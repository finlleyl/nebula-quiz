package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/finlleyl/nebula-quiz/internal/auth"
	"github.com/finlleyl/nebula-quiz/internal/config"
	"github.com/finlleyl/nebula-quiz/internal/httpapi/middleware"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func newRouter(cfg *config.Config, authHandler *auth.Handler) http.Handler {
	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Logger)
	r.Use(chimw.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodDelete, http.MethodOptions},
		AllowedHeaders:   []string{"Authorization", "Content-Type", "Origin", "Accept"},
		ExposedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/healthz", healthz)

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Use(middleware.CSRF(cfg.AllowedOrigins))
			r.Post("/register", authHandler.Register)
			r.With(middleware.RateLimit(5, time.Minute)).Post("/login", authHandler.Login)
			r.With(middleware.RateLimit(60, time.Minute)).Post("/refresh", authHandler.Refresh)
			r.Post("/logout", authHandler.Logout)
		})
	})

	return r
}

func healthz(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
