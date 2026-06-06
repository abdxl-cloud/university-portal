package config

import (
	"log/slog"
	"os"
	"strings"
)

type Config struct {
	Env             string
	HTTPAddr        string
	LogLevel        slog.Level
	DatabaseURL     string
	RedisURL        string
	AllowedOrigins  []string
	AccessTokenTTL  string
	RefreshTokenTTL string
}

func Load() Config {
	return Config{
		Env:             env("APP_ENV", "development"),
		HTTPAddr:        env("HTTP_ADDR", ":8080"),
		LogLevel:        logLevel(env("LOG_LEVEL", "info")),
		DatabaseURL:     env("DATABASE_URL", "postgres://formbuilder:formbuilder@localhost:5432/formbuilder?sslmode=disable"),
		RedisURL:        env("REDIS_URL", "redis://localhost:6379/0"),
		AllowedOrigins:  csvEnv("ALLOWED_ORIGINS", "http://127.0.0.1:4173,http://localhost:4173"),
		AccessTokenTTL:  env("ACCESS_TOKEN_TTL", "15m"),
		RefreshTokenTTL: env("REFRESH_TOKEN_TTL", "168h"),
	}
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
