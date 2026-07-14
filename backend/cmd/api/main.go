package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"formbuilder/backend/internal/auth"
	"formbuilder/backend/internal/config"
	"formbuilder/backend/internal/db"
	"formbuilder/backend/internal/httpapi"
)

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel}))
	if err := cfg.Validate(); err != nil {
		logger.Error("invalid configuration", "error", err)
		os.Exit(1)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	pool, err := db.Connect(ctx, cfg.DatabaseURL, db.PoolOptions{
		MaxConns:        cfg.DBMaxConns,
		MinConns:        cfg.DBMinConns,
		MaxConnIdleTime: cfg.DBMaxConnIdle,
		MaxConnLifetime: cfg.DBMaxConnLife,
	})
	if err != nil {
		cancel()
		logger.Error("database connection failed", "error", err)
		os.Exit(1)
	}
	if err := db.Migrate(ctx, pool); err != nil {
		cancel()
		pool.Close()
		logger.Error("migrations failed", "error", err)
		os.Exit(1)
	}
	if cfg.Env == "production" {
		disabled, err := auth.DisableDemoAccounts(ctx, pool)
		if err != nil {
			cancel()
			pool.Close()
			logger.Error("failed to disable demo accounts", "error", err)
			os.Exit(1)
		}
		if disabled > 0 {
			logger.Warn("disabled accounts using the bundled demo password", "count", disabled)
		}
	}
	cancel()
	defer pool.Close()
	logger.Info("database ready")

	app := httpapi.New(httpapi.Options{
		Config: cfg,
		Logger: logger,
		Pool:   pool,
	})

	server := &http.Server{
		Addr:              cfg.HTTPAddr,
		Handler:           app.Routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       15 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			cleanupCtx, cleanupCancel := context.WithTimeout(context.Background(), 10*time.Second)
			if n, err := app.CleanupExpiredSessions(cleanupCtx); err != nil {
				logger.Warn("session cleanup failed", "error", err)
			} else if n > 0 {
				logger.Info("pruned expired sessions", "count", n)
			}
			cleanupCancel()
		}
	}()

	errs := make(chan error, 1)
	go func() {
		logger.Info("api listening", "addr", cfg.HTTPAddr, "env", cfg.Env)
		errs <- server.ListenAndServe()
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errs:
		if err != nil && err != http.ErrServerClosed {
			logger.Error("server stopped unexpectedly", "error", err)
			os.Exit(1)
		}
	case sig := <-stop:
		logger.Info("shutdown requested", "signal", sig.String())
		shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer shutdownCancel()
		if err := server.Shutdown(shutdownCtx); err != nil {
			logger.Error("graceful shutdown failed", "error", err)
			os.Exit(1)
		}
	}
}
