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

	S3Endpoint      string
	S3AccessKey     string
	S3SecretKey     string
	S3Bucket        string
	S3UseSSL        bool
	S3PublicBaseURL string
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

	s3Endpoint := getenv("S3_ENDPOINT", "localhost:9000")
	s3Bucket := getenv("S3_BUCKET", "nebula-images")
	s3Access := getenv("S3_ACCESS_KEY", "minio")
	s3Secret := getenv("S3_SECRET_KEY", "miniominio")
	s3SSL := os.Getenv("S3_USE_SSL") == "true"
	scheme := "http"
	if s3SSL {
		scheme = "https"
	}
	s3Public := getenv("S3_PUBLIC_BASE_URL", fmt.Sprintf("%s://%s", scheme, s3Endpoint))

	return &Config{
		HTTPAddr:        getenv("HTTP_ADDR", ":8080"),
		DatabaseURL:     dsn,
		JWTSecret:       []byte(secret),
		JWTAccessTTL:    accessTTL,
		RefreshTTL:      refreshTTL,
		AllowedOrigins:  origins,
		Production:      os.Getenv("APP_ENV") == "production",
		S3Endpoint:      s3Endpoint,
		S3AccessKey:     s3Access,
		S3SecretKey:     s3Secret,
		S3Bucket:        s3Bucket,
		S3UseSSL:        s3SSL,
		S3PublicBaseURL: strings.TrimRight(s3Public, "/"),
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
