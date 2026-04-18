package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenIssuer struct {
	secret []byte
	ttl    time.Duration
}

func NewTokenIssuer(secret []byte, ttl time.Duration) *TokenIssuer {
	return &TokenIssuer{secret: secret, ttl: ttl}
}

func (i *TokenIssuer) TTL() time.Duration { return i.ttl }

func (i *TokenIssuer) Issue(userID uuid.UUID, role string) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"sub":  userID.String(),
		"role": role,
		"iat":  now.Unix(),
		"exp":  now.Add(i.ttl).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(i.secret)
}

type Claims struct {
	UserID uuid.UUID
	Role   string
}

func (i *TokenIssuer) Parse(token string) (*Claims, error) {
	parsed, err := jwt.Parse(token, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method %v", t.Header["alg"])
		}
		return i.secret, nil
	})
	if err != nil {
		return nil, err
	}
	mc, ok := parsed.Claims.(jwt.MapClaims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token claims")
	}
	sub, _ := mc["sub"].(string)
	uid, err := uuid.Parse(sub)
	if err != nil {
		return nil, fmt.Errorf("invalid sub: %w", err)
	}
	role, _ := mc["role"].(string)
	return &Claims{UserID: uid, Role: role}, nil
}
