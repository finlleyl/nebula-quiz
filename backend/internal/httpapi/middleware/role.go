package middleware

import (
	"net/http"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
)

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := UserRole(r)
			if !ok {
				httpapi.WriteProblem(w, http.StatusUnauthorized, "unauthorized", "missing auth context")
				return
			}
			if _, allow := allowed[role]; !allow {
				httpapi.WriteProblem(w, http.StatusForbidden, "forbidden", "insufficient role")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
