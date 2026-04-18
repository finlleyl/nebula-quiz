package auth

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"net/netip"
	"strings"
	"time"

	"github.com/finlleyl/nebula-quiz/internal/storage/gen"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInvalidCredentials = errors.New("invalid_credentials")
	ErrEmailExists        = errors.New("email_exists")
	ErrInvalidRole        = errors.New("invalid_role")
	ErrInvalidRefresh     = errors.New("invalid_refresh")
	ErrValidation         = errors.New("validation_failed")
)

var allowedRoles = map[gen.UserRole]struct{}{
	gen.UserRoleParticipant: {},
	gen.UserRoleOrganizer:   {},
}

const (
	minPasswordLen = 8
	maxPasswordLen = 256
	maxDisplayLen  = 64
)

type Service struct {
	pool       *pgxpool.Pool
	q          *gen.Queries
	issuer     *TokenIssuer
	refreshTTL time.Duration
}

func NewService(pool *pgxpool.Pool, issuer *TokenIssuer, refreshTTL time.Duration) *Service {
	return &Service{
		pool:       pool,
		q:          gen.New(pool),
		issuer:     issuer,
		refreshTTL: refreshTTL,
	}
}

type RegisterInput struct {
	Email       string
	Password    string
	DisplayName string
	Role        string
}

type LoginInput struct {
	Email    string
	Password string
}

type SessionResult struct {
	User         gen.User
	AccessToken  string
	RefreshRaw   string
	RefreshExpAt time.Time
}

func (s *Service) Register(ctx context.Context, in RegisterInput, ua string, ip netip.Addr) (*SessionResult, error) {
	email, err := normalizeEmail(in.Email)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrValidation, err)
	}
	if err := validatePassword(in.Password); err != nil {
		return nil, fmt.Errorf("%w: %v", ErrValidation, err)
	}
	displayName := strings.TrimSpace(in.DisplayName)
	if displayName == "" || len(displayName) > maxDisplayLen {
		return nil, fmt.Errorf("%w: display_name length must be 1..%d", ErrValidation, maxDisplayLen)
	}
	role := gen.UserRole(in.Role)
	if _, ok := allowedRoles[role]; !ok {
		return nil, ErrInvalidRole
	}

	hash, err := HashPassword(in.Password)
	if err != nil {
		return nil, err
	}

	user, err := s.q.CreateUser(ctx, gen.CreateUserParams{
		Email:        email,
		PasswordHash: hash,
		Role:         role,
		DisplayName:  displayName,
	})
	if err != nil {
		if isEmailUniqueViolation(err) {
			return nil, ErrEmailExists
		}
		return nil, err
	}

	return s.issueSession(ctx, s.q, user, ua, ip)
}

func (s *Service) Login(ctx context.Context, in LoginInput, ua string, ip netip.Addr) (*SessionResult, error) {
	email, err := normalizeEmail(in.Email)
	if err != nil {
		return nil, ErrInvalidCredentials
	}
	user, err := s.q.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	ok, err := VerifyPassword(in.Password, user.PasswordHash)
	if err != nil || !ok {
		return nil, ErrInvalidCredentials
	}
	return s.issueSession(ctx, s.q, user, ua, ip)
}

// Refresh rotates the refresh token atomically. If a revoked token is
// presented, this is treated as a replay (possible theft): all refresh
// tokens for that user are revoked and ErrInvalidRefresh is returned.
func (s *Service) Refresh(ctx context.Context, raw, ua string, ip netip.Addr) (*SessionResult, error) {
	if raw == "" {
		return nil, ErrInvalidRefresh
	}
	hash := HashRefreshToken(raw)

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() { _ = tx.Rollback(ctx) }()
	qtx := s.q.WithTx(tx)

	rt, err := qtx.GetRefreshTokenByHash(ctx, hash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrInvalidRefresh
		}
		return nil, err
	}

	if rt.RevokedAt.Valid {
		if err := qtx.RevokeAllUserRefreshTokens(ctx, rt.UserID); err != nil {
			return nil, err
		}
		if err := tx.Commit(ctx); err != nil {
			return nil, err
		}
		return nil, ErrInvalidRefresh
	}

	if !rt.ExpiresAt.Valid || !rt.ExpiresAt.Time.After(time.Now()) {
		return nil, ErrInvalidRefresh
	}

	if err := qtx.RevokeRefreshToken(ctx, rt.ID); err != nil {
		return nil, err
	}
	user, err := qtx.GetUserByID(ctx, rt.UserID)
	if err != nil {
		return nil, err
	}

	res, err := s.issueSession(ctx, qtx, user, ua, ip)
	if err != nil {
		return nil, err
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return res, nil
}

func (s *Service) Logout(ctx context.Context, raw string) error {
	if raw == "" {
		return nil
	}
	hash := HashRefreshToken(raw)
	rt, err := s.q.GetActiveRefreshTokenByHash(ctx, hash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil
		}
		return err
	}
	return s.q.RevokeRefreshToken(ctx, rt.ID)
}

func (s *Service) issueSession(ctx context.Context, q *gen.Queries, user gen.User, ua string, ip netip.Addr) (*SessionResult, error) {
	access, err := s.issuer.Issue(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}
	raw, hash, err := GenerateRefreshToken()
	if err != nil {
		return nil, err
	}
	expAt := time.Now().Add(s.refreshTTL)
	if _, err := q.InsertRefreshToken(ctx, gen.InsertRefreshTokenParams{
		UserID:    user.ID,
		TokenHash: hash,
		ExpiresAt: pgtype.Timestamptz{Time: expAt, Valid: true},
		UserAgent: optStr(ua),
		Ip:        optIP(ip),
	}); err != nil {
		return nil, err
	}
	return &SessionResult{
		User:         user,
		AccessToken:  access,
		RefreshRaw:   raw,
		RefreshExpAt: expAt,
	}, nil
}

func normalizeEmail(raw string) (string, error) {
	s := strings.TrimSpace(raw)
	addr, err := mail.ParseAddress(s)
	if err != nil || addr.Name != "" || addr.Address != s {
		return "", errors.New("email must be a plain address without display name")
	}
	return strings.ToLower(addr.Address), nil
}

func validatePassword(p string) error {
	if len(p) < minPasswordLen {
		return fmt.Errorf("password must be at least %d characters", minPasswordLen)
	}
	if len(p) > maxPasswordLen {
		return fmt.Errorf("password must be at most %d characters", maxPasswordLen)
	}
	return nil
}

func optStr(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func optIP(ip netip.Addr) *netip.Addr {
	if !ip.IsValid() {
		return nil
	}
	return &ip
}

func isEmailUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) || pgErr.Code != "23505" {
		return false
	}
	return strings.Contains(pgErr.ConstraintName, "email")
}
