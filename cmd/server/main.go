package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"matcha/internal/config"
	"matcha/internal/database"
	"matcha/internal/handlers"

	"goji.io"
	"goji.io/pat"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize database
	if err := database.Init(cfg.DBPath); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer database.Close()

	// Create data directory if it doesn't exist
	if err := os.MkdirAll("data", 0755); err != nil {
		log.Fatalf("Failed to create data directory: %v", err)
	}

	// Setup routes
	mux := goji.NewMux()

	// Serve static files (CSS, JS, images)
	mux.HandleFunc(pat.Get("/static/*"), http.StripPrefix("/static/", http.FileServer(http.Dir("./static"))).ServeHTTP)

	// API routes (must come before catch-all)
	handlers.SetupAPIRoutes(mux)

	// Serve React app (catch-all for frontend routes)
	// This must be last to catch all non-API routes
	handlers.SetupFrontendRoutes(mux)

	// Setup server
	addr := fmt.Sprintf(":%s", cfg.Port)
	server := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	// Setup graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on %s", addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Wait for interrupt signal
	<-sigChan
	log.Println("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server forced to shutdown: %v", err)
	} else {
		log.Println("Server gracefully stopped")
	}
}
