package middleware

import (
	"net/http"
	"net/url"

	"github.com/finlleyl/nebula-quiz/internal/httpapi"
)

func CSRF(allowedOrigins []string) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(allowedOrigins))
	for _, o := range allowedOrigins {
		allowed[o] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !stateChanging(r.Method) {
				next.ServeHTTP(w, r)
				return
			}
			origin := r.Header.Get("Origin")
			if origin == "" {
				origin = refererOrigin(r.Header.Get("Referer"))
			}
			if origin == "" {
				httpapi.WriteProblem(w, http.StatusForbidden, "csrf_forbidden", "missing Origin/Referer header")
				return
			}
			if _, ok := allowed[origin]; !ok {
				httpapi.WriteProblem(w, http.StatusForbidden, "csrf_forbidden", "origin is not allowed")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func stateChanging(method string) bool {
	switch method {
	case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	default:
		return false
	}
}

func refererOrigin(ref string) string {
	if ref == "" {
		return ""
	}
	u, err := url.Parse(ref)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return ""
	}
	return u.Scheme + "://" + u.Host
}
