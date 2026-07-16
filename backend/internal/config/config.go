package config

import (
	"errors"
	"log/slog"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Env              string
	HTTPAddr         string
	LogLevel         slog.Level
	DatabaseURL      string
	DBMaxConns       int32
	DBMinConns       int32
	DBMaxConnIdle    time.Duration
	DBMaxConnLife    time.Duration
	RedisURL         string
	AllowedOrigins   []string
	AccessTokenTTL   string
	RefreshTokenTTL  string
	IdentitySecret   string
	IdentityTokenTTL time.Duration
	StorageDir       string
	StorageMaxUpload int64
}

func Load() Config {
	return Config{
		Env:              env("APP_ENV", "development"),
		HTTPAddr:         env("HTTP_ADDR", ":8080"),
		LogLevel:         logLevel(env("LOG_LEVEL", "info")),
		DatabaseURL:      env("DATABASE_URL", "postgres://formbuilder:formbuilder@localhost:5432/formbuilder?sslmode=disable"),
		DBMaxConns:       int32(intEnv("DB_MAX_CONNS", 25)),
		DBMinConns:       int32(intEnv("DB_MIN_CONNS", 2)),
		DBMaxConnIdle:    durationEnv("DB_MAX_CONN_IDLE", 5*time.Minute),
		DBMaxConnLife:    durationEnv("DB_MAX_CONN_LIFETIME", time.Hour),
		RedisURL:         env("REDIS_URL", "redis://localhost:6379/0"),
		AllowedOrigins:   csvEnv("ALLOWED_ORIGINS", "http://127.0.0.1:4173,http://localhost:4173"),
		AccessTokenTTL:   env("ACCESS_TOKEN_TTL", "15m"),
		RefreshTokenTTL:  env("REFRESH_TOKEN_TTL", "168h"),
		IdentitySecret:   env("IDENTITY_SECRET", "dev-identity-secret-change-me"),
		IdentityTokenTTL: durationEnv("IDENTITY_TOKEN_TTL", 5*time.Minute),
		StorageDir:       env("STORAGE_DIR", "/data/storage"),
		StorageMaxUpload: int64(intEnv("STORAGE_MAX_UPLOAD_BYTES", 50<<20)), // 50 MiB, matches the frontend's stated material-upload cap
	}
}

func intEnv(key string, fallback int) int {
	value := env(key, "")
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func durationEnv(key string, fallback time.Duration) time.Duration {
	value := env(key, fallback.String())
	parsed, err := time.ParseDuration(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}

func (c Config) Validate() error {
	if c.DatabaseURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	if c.Env == "production" {
		if len(c.IdentitySecret) < 32 || c.IdentitySecret == "dev-identity-secret-change-me" {
			return errors.New("IDENTITY_SECRET must be a unique value of at least 32 characters in production")
		}
		parsed, err := url.Parse(c.DatabaseURL)
		if err != nil || parsed.User == nil {
			return errors.New("production DATABASE_URL is invalid")
		}
		password, hasPassword := parsed.User.Password()
		if !hasPassword || password == "" || (parsed.User.Username() == "formbuilder" && password == "formbuilder") {
			return errors.New("production DATABASE_URL must use explicit non-default database credentials")
		}
	}
	return nil
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func csvEnv(key, fallback string) []string {
	raw := env(key, fallback)
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		if value := strings.TrimSpace(part); value != "" {
			out = append(out, value)
		}
	}
	return out
}

func logLevel(value string) slog.Level {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
