package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/finlleyl/nebula-quiz/internal/auth"
	"github.com/finlleyl/nebula-quiz/internal/config"
	"github.com/finlleyl/nebula-quiz/internal/game"
	"github.com/finlleyl/nebula-quiz/internal/imagestore"
	"github.com/finlleyl/nebula-quiz/internal/quiz"
	"github.com/finlleyl/nebula-quiz/internal/realtime"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		slog.Error("config load failed", "err", err)
		os.Exit(1)
	}

	pingCtx, pingCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer pingCancel()
	pool, err := pgxpool.New(pingCtx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(pingCtx); err != nil {
		slog.Error("db ping failed", "err", err)
		os.Exit(1)
	}

	redisOpts, err := redis.ParseURL(cfg.RedisURL)
	if err != nil {
		slog.Error("redis url parse failed", "err", err)
		os.Exit(1)
	}
	rdb := redis.NewClient(redisOpts)
	defer rdb.Close()

	if err := rdb.Ping(pingCtx).Err(); err != nil {
		slog.Error("redis ping failed", "err", err)
		os.Exit(1)
	}

	issuer := auth.NewTokenIssuer(cfg.JWTSecret, cfg.JWTAccessTTL)
	authSvc := auth.NewService(pool, issuer, cfg.RefreshTTL)
	authHandler := auth.NewHandler(authSvc, auth.HandlerOptions{
		AccessTTL:     cfg.JWTAccessTTL,
		RefreshTTL:    cfg.RefreshTTL,
		SecureCookies: cfg.Production,
	})

	quizSvc := quiz.NewService(pool)
	quizHandler := quiz.NewHandler(quizSvc)

	imageCtx, imageCancel := context.WithTimeout(context.Background(), 15*time.Second)
	imageSvc, err := imagestore.New(imageCtx, imagestore.Config{
		Endpoint:      cfg.S3Endpoint,
		AccessKey:     cfg.S3AccessKey,
		SecretKey:     cfg.S3SecretKey,
		Bucket:        cfg.S3Bucket,
		UseSSL:        cfg.S3UseSSL,
		PublicBaseURL: cfg.S3PublicBaseURL,
	})
	imageCancel()
	if err != nil {
		slog.Error("imagestore init failed", "err", err)
		os.Exit(1)
	}
	imageHandler := imagestore.NewHandler(imageSvc)

	tickets := realtime.NewTicketStore(rdb)
	hub := realtime.NewHub(tickets)
	gameSvc := game.NewService(pool, tickets, hub)
	gameHandler := game.NewHandler(gameSvc)

	srv := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           newRouter(cfg, issuer, authHandler, quizHandler, imageHandler, gameHandler, hub),
		ReadHeaderTimeout: 5 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		slog.Info("http server listening", "addr", cfg.HTTPAddr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("http server failed", "err", err)
			stop()
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown error", "err", err)
		os.Exit(1)
	}
}
