package auth

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/netip"
	"strings"
	"time"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
)

const RefreshCookieName = "nebula_refresh"

type Handler struct {
	svc           *Service
	accessTTL     time.Duration
	refreshTTL    time.Duration
	refreshPath   string
	secureCookies bool
}

type HandlerOptions struct {
	AccessTTL     time.Duration
	RefreshTTL    time.Duration
	SecureCookies bool
}

func NewHandler(svc *Service, opts HandlerOptions) *Handler {
	return &Handler{
		svc:           svc,
		accessTTL:     opts.AccessTTL,
		refreshTTL:    opts.RefreshTTL,
		refreshPath:   "/api/v1/auth",
		secureCookies: opts.SecureCookies,
	}
}

type registerRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
	Role        string `json:"role"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResponse struct {
	ID          string  `json:"id"`
	Email       string  `json:"email"`
	Role        string  `json:"role"`
	DisplayName string  `json:"display_name"`
	AvatarURL   *string `json:"avatar_url,omitempty"`
	Plan        string  `json:"plan"`
}

type sessionResponse struct {
	User        userResponse `json:"user"`
	AccessToken string       `json:"access_token"`
	ExpiresIn   int64        `json:"expires_in"`
}

type refreshResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
}

func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var in registerRequest
	if err := decodeJSON(r, &in); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	res, err := h.svc.Register(r.Context(), RegisterInput{
		Email:       in.Email,
		Password:    in.Password,
		DisplayName: in.DisplayName,
		Role:        in.Role,
	}, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeAuthError(w, err)
		return
	}
	h.setRefreshCookie(w, res.RefreshRaw, res.RefreshExpAt)
	writeJSON(w, http.StatusCreated, sessionResponse{
		User:        toUserResponse(res),
		AccessToken: res.AccessToken,
		ExpiresIn:   int64(h.accessTTL.Seconds()),
	})
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var in loginRequest
	if err := decodeJSON(r, &in); err != nil {
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_body", err.Error())
		return
	}
	res, err := h.svc.Login(r.Context(), LoginInput{Email: in.Email, Password: in.Password}, r.UserAgent(), clientIP(r))
	if err != nil {
		h.writeAuthError(w, err)
		return
	}
	h.setRefreshCookie(w, res.RefreshRaw, res.RefreshExpAt)
	writeJSON(w, http.StatusOK, sessionResponse{
		User:        toUserResponse(res),
		AccessToken: res.AccessToken,
		ExpiresIn:   int64(h.accessTTL.Seconds()),
	})
}

func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	raw := readRefreshCookie(r)
	if raw == "" {
		httpapi.WriteProblem(w, http.StatusUnauthorized, "invalid_refresh", "missing refresh cookie")
		return
	}
	res, err := h.svc.Refresh(r.Context(), raw, r.UserAgent(), clientIP(r))
	if err != nil {
		if errors.Is(err, ErrInvalidRefresh) {
			h.clearRefreshCookie(w)
			httpapi.WriteProblem(w, http.StatusUnauthorized, "invalid_refresh", "refresh token is invalid or expired")
			return
		}
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal_error", "")
		return
	}
	h.setRefreshCookie(w, res.RefreshRaw, res.RefreshExpAt)
	writeJSON(w, http.StatusOK, refreshResponse{
		AccessToken: res.AccessToken,
		ExpiresIn:   int64(h.accessTTL.Seconds()),
	})
}

func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	raw := readRefreshCookie(r)
	_ = h.svc.Logout(r.Context(), raw)
	h.clearRefreshCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) writeAuthError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, ErrInvalidCredentials):
		httpapi.WriteProblem(w, http.StatusUnauthorized, "invalid_credentials", "email or password is incorrect")
	case errors.Is(err, ErrEmailExists):
		httpapi.WriteProblem(w, http.StatusConflict, "email_exists", "email is already registered")
	case errors.Is(err, ErrInvalidRole):
		httpapi.WriteProblem(w, http.StatusBadRequest, "invalid_role", "role must be participant or organizer")
	case errors.Is(err, ErrValidation):
		httpapi.WriteProblem(w, http.StatusBadRequest, "validation_failed", err.Error())
	case errors.Is(err, ErrInvalidRefresh):
		httpapi.WriteProblem(w, http.StatusUnauthorized, "invalid_refresh", "refresh token is invalid or expired")
	default:
		httpapi.WriteProblem(w, http.StatusInternalServerError, "internal_error", "")
	}
}

func (h *Handler) setRefreshCookie(w http.ResponseWriter, raw string, exp time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshCookieName,
		Value:    raw,
		Path:     h.refreshPath,
		Expires:  exp,
		MaxAge:   int(time.Until(exp).Seconds()),
		HttpOnly: true,
		Secure:   h.secureCookies,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *Handler) clearRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshCookieName,
		Value:    "",
		Path:     h.refreshPath,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.secureCookies,
		SameSite: http.SameSiteLaxMode,
	})
}

func readRefreshCookie(r *http.Request) string {
	c, err := r.Cookie(RefreshCookieName)
	if err != nil {
		return ""
	}
	return c.Value
}

func decodeJSON(r *http.Request, v any) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(v)
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func toUserResponse(res *SessionResult) userResponse {
	return userResponse{
		ID:          res.User.ID.String(),
		Email:       res.User.Email,
		Role:        string(res.User.Role),
		DisplayName: res.User.DisplayName,
		AvatarURL:   res.User.AvatarUrl,
		Plan:        res.User.Plan,
	}
}

func clientIP(r *http.Request) netip.Addr {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if comma := strings.Index(xff, ","); comma >= 0 {
			xff = xff[:comma]
		}
		if a, err := netip.ParseAddr(strings.TrimSpace(xff)); err == nil {
			return a
		}
	}
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i >= 0 {
		host = host[:i]
	}
	host = strings.TrimPrefix(strings.TrimSuffix(host, "]"), "[")
	if a, err := netip.ParseAddr(host); err == nil {
		return a
	}
	return netip.Addr{}
}
