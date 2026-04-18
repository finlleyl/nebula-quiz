package config

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"
)

type Config struct {
	HTTPAddr       string
	DatabaseURL    string
	JWTSecret      []byte
	JWTAccessTTL   time.Duration
	RefreshTTL     time.Duration
	AllowedOrigins []string
	Production     bool
}

func Load() (*Config, error) {
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 32 bytes long, got %d", len(secret))
	}
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil, errors.New("DATABASE_URL is required")
	}

	accessTTL, err := parseDuration("JWT_ACCESS_TTL", "15m")
	if err != nil {
		return nil, err
	}
	refreshTTL, err := parseDuration("REFRESH_TTL", "720h")
	if err != nil {
		return nil, err
	}

	raw := getenv("ALLOWED_ORIGINS", "http://localhost:5173")
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			origins = append(origins, p)
		}
	}
	if len(origins) == 0 {
		return nil, errors.New("ALLOWED_ORIGINS must contain at least one origin")
	}

	return &Config{
		HTTPAddr:       getenv("HTTP_ADDR", ":8080"),
		DatabaseURL:    dsn,
		JWTSecret:      []byte(secret),
		JWTAccessTTL:   accessTTL,
		RefreshTTL:     refreshTTL,
		AllowedOrigins: origins,
		Production:     os.Getenv("APP_ENV") == "production",
	}, nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func parseDuration(key, fallback string) (time.Duration, error) {
	v := getenv(key, fallback)
	d, err := time.ParseDuration(v)
	if err != nil {
		return 0, fmt.Errorf("%s: invalid duration %q: %w", key, v, err)
	}
	return d, nil
}
