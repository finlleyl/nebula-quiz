package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/finlleyl/nebula-quiz/internal/analytics"
	"github.com/finlleyl/nebula-quiz/internal/auth"
	"github.com/finlleyl/nebula-quiz/internal/config"
	"github.com/finlleyl/nebula-quiz/internal/game"
	"github.com/finlleyl/nebula-quiz/internal/httpapi/middleware"
	"github.com/finlleyl/nebula-quiz/internal/imagestore"
	"github.com/finlleyl/nebula-quiz/internal/quiz"
	"github.com/finlleyl/nebula-quiz/internal/realtime"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func newRouter(
	cfg *config.Config,
	issuer *auth.TokenIssuer,
	authHandler *auth.Handler,
	quizHandler *quiz.Handler,
	imageHandler *imagestore.Handler,
	gameHandler *game.Handler,
	analyticsHandler *analytics.Handler,
	hub *realtime.Hub,
) http.Handler {
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

	// WebSocket endpoint — ticket auth, no JWT needed.
	r.Get("/ws", hub.ServeWS)

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Use(middleware.CSRF(cfg.AllowedOrigins))
			r.Post("/register", authHandler.Register)
			r.With(middleware.RateLimit(5, time.Minute)).Post("/login", authHandler.Login)
			r.With(middleware.RateLimit(60, time.Minute)).Post("/refresh", authHandler.Refresh)
			r.Post("/logout", authHandler.Logout)
		})

		// Public endpoints — no auth required.
		r.Get("/explore", quizHandler.Explore)
		r.Get("/categories", quizHandler.ListCategories)

		// Join a game by room code — no auth required (guests allowed).
		r.Post("/games/by-code/{code}/join", gameHandler.JoinByCode)

		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth(issuer))

			r.Get("/me/quizzes", quizHandler.ListMyQuizzes)
			r.Get("/me/history", gameHandler.History)
			r.Get("/me/library", quizHandler.ListLibrary)
			r.Post("/me/library/{quiz_id}", quizHandler.SaveToLibrary)
			r.Delete("/me/library/{quiz_id}", quizHandler.RemoveFromLibrary)

			r.With(middleware.RequireRole("organizer", "admin")).Get("/analytics/overview", analyticsHandler.Overview)
			r.With(middleware.RequireRole("organizer", "admin")).Post("/quizzes", quizHandler.CreateQuiz)
			r.Get("/quizzes/{id}", quizHandler.GetQuiz)

			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireRole("organizer", "admin"))
				r.Patch("/quizzes/{id}", quizHandler.UpdateQuiz)
				r.Delete("/quizzes/{id}", quizHandler.DeleteQuiz)
				r.Post("/quizzes/{id}/publish", quizHandler.Publish)
				r.Post("/quizzes/{id}/duplicate", quizHandler.Duplicate)
				r.Post("/quizzes/{id}/questions", quizHandler.CreateQuestion)
				r.Post("/quizzes/{id}/questions/reorder", quizHandler.ReorderQuestions)
				r.Patch("/questions/{id}", quizHandler.UpdateQuestion)
				r.Delete("/questions/{id}", quizHandler.DeleteQuestion)
				r.Post("/images", imageHandler.Upload)

				// Game session management (host only).
				r.Post("/games", gameHandler.Create)
				r.Get("/games/{id}", gameHandler.Get)
			})
		})
	})

	return r
}

func healthz(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
