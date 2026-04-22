package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/finlleyl/nebula-quiz/internal/auth"
	"github.com/finlleyl/nebula-quiz/internal/httpapi"
	"github.com/google/uuid"
)

type ctxKey string

const (
	ctxUserID ctxKey = "userID"
	ctxRole   ctxKey = "userRole"
)

// OptionalAuth extracts and validates the bearer token if present, but does
// not reject requests without one. Downstream handlers use UserID to check.
func OptionalAuth(issuer *auth.TokenIssuer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if raw := bearerToken(r); raw != "" {
				if claims, err := issuer.Parse(raw); err == nil {
					ctx := context.WithValue(r.Context(), ctxUserID, claims.UserID)
					ctx = context.WithValue(ctx, ctxRole, claims.Role)
					r = r.WithContext(ctx)
				}
			}
			next.ServeHTTP(w, r)
		})
	}
}

func RequireAuth(issuer *auth.TokenIssuer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			raw := bearerToken(r)
			if raw == "" {
				httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "missing bearer token")
				return
			}
			claims, err := issuer.Parse(raw)
			if err != nil {
				httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "invalid or expired token")
				return
			}
			ctx := context.WithValue(r.Context(), ctxUserID, claims.UserID)
			ctx = context.WithValue(ctx, ctxRole, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func bearerToken(r *http.Request) string {
	h := r.Header.Get("Authorization")
	const prefix = "Bearer "
	if !strings.HasPrefix(h, prefix) {
		return ""
	}
	return strings.TrimSpace(h[len(prefix):])
}

func UserID(r *http.Request) (uuid.UUID, bool) {
	v, ok := r.Context().Value(ctxUserID).(uuid.UUID)
	return v, ok
}

func UserRole(r *http.Request) (string, bool) {
	v, ok := r.Context().Value(ctxRole).(string)
	return v, ok
}
