package handlers

import (
	"net/http"
	"path/filepath"
	"strings"

	"goji.io"
	"goji.io/pat"
)

// SetupAPIRoutes configures all API routes (JSON responses)
func SetupAPIRoutes(mux *goji.Mux) {
	// Health check (no auth) - for server status / devtools
	mux.HandleFunc(pat.Get("/api/health"), HealthAPI)

	// Authentication API
	mux.HandleFunc(pat.Post("/api/register"), RegisterAPI)
	mux.HandleFunc(pat.Post("/api/login"), LoginAPI)
	mux.HandleFunc(pat.Post("/api/logout"), LogoutAPI)
	mux.HandleFunc(pat.Get("/api/verify-email"), VerifyEmailAPI)
	mux.HandleFunc(pat.Post("/api/resend-verification"), ResendVerificationAPI)

	// Profile API
	mux.HandleFunc(pat.Get("/api/profile"), ProfileAPI)
	mux.HandleFunc(pat.Post("/api/profile"), ProfileUpdateAPI)
	mux.HandleFunc(pat.Post("/api/profile/setup-complete"), SetupCompleteAPI)
	mux.HandleFunc(pat.Post("/api/profile/reset"), ResetProfileAPI)
	mux.HandleFunc(pat.Post("/api/profile/change-password"), ChangePasswordAPI)
	mux.HandleFunc(pat.Post("/api/profile/upload-image"), UploadImageAPI)
	mux.HandleFunc(pat.Post("/api/profile/reorder-images"), ReorderImagesAPI)
	mux.HandleFunc(pat.Get("/api/profile/visitors"), ProfileVisitorsAPI)

	// Browse/Search API
	mux.HandleFunc(pat.Get("/api/browse"), BrowseAPI)
	mux.HandleFunc(pat.Get("/api/search"), SearchAPI)

	// User profile API
	mux.HandleFunc(pat.Get("/api/user/:id"), UserProfileAPI)

	// Like/Unlike API
	mux.HandleFunc(pat.Post("/api/like/:id"), LikeAPI)
	mux.HandleFunc(pat.Post("/api/unlike/:id"), UnlikeAPI)
	mux.HandleFunc(pat.Get("/api/connections"), ConnectionsAPI)

	// Block/Report API
	mux.HandleFunc(pat.Post("/api/block/:id"), BlockUserAPI)
	mux.HandleFunc(pat.Post("/api/unblock/:id"), UnblockUserAPI)
	mux.HandleFunc(pat.Post("/api/report/:id"), ReportUserAPI)
	mux.HandleFunc(pat.Post("/api/simulate-connection/:id"), SimulateConnectionAPI)

	// Chat API
	mux.HandleFunc(pat.Get("/api/chat"), ChatListAPI)
	mux.HandleFunc(pat.Get("/api/messages/:id"), MessagesAPI)
	mux.HandleFunc(pat.Post("/api/messages/:id"), SendMessageAPI)

	// Notifications API (mark-all-read is literal; :id/read is parameterized)
	mux.HandleFunc(pat.Get("/api/notifications"), NotificationsAPI)
	mux.HandleFunc(pat.Post("/api/notifications/mark-all-read"), MarkAllNotificationsReadAPI)
	mux.HandleFunc(pat.Post("/api/notifications/:id/read"), MarkNotificationReadAPI)

	// Tags API
	mux.HandleFunc(pat.Get("/api/tags/popular"), PopularTagsAPI)
	mux.HandleFunc(pat.Get("/api/tags/user-match"), UserTagMatchAPI)
	mux.HandleFunc(pat.Post("/api/tags/add"), AddTagAPI)
	mux.HandleFunc(pat.Post("/api/tags/remove"), RemoveTagAPI)

	// Trends API (popular tags, personality, gender, orientation)
	mux.HandleFunc(pat.Get("/api/trends"), TrendsAPI)

	// Bot Activity API
	mux.HandleFunc(pat.Get("/api/bot-activity"), BotActivityLogAPI)

	// Ranking API
	mux.HandleFunc(pat.Get("/api/ranking"), RankingAPI)
}

// SetupFrontendRoutes serves the React app (catch-all)
func SetupFrontendRoutes(mux *goji.Mux) {
	// Serve static assets from Next.js build
	// Try both _next/static (Next.js export) and assets (legacy) for compatibility
	nextStaticFS := http.FileServer(http.Dir("./static/dist/_next/static"))
	assetsFS := http.FileServer(http.Dir("./static/dist/assets"))

	// Wrap the file server to ensure correct MIME types
	assetHandler := func(w http.ResponseWriter, r *http.Request) {
		// Set correct MIME types based on file extension
		ext := filepath.Ext(r.URL.Path)
		switch ext {
		case ".js":
			w.Header().Set("Content-Type", "application/javascript")
		case ".css":
			w.Header().Set("Content-Type", "text/css")
		case ".json":
			w.Header().Set("Content-Type", "application/json")
		case ".png":
			w.Header().Set("Content-Type", "image/png")
		case ".jpg", ".jpeg":
			w.Header().Set("Content-Type", "image/jpeg")
		case ".svg":
			w.Header().Set("Content-Type", "image/svg+xml")
		case ".woff", ".woff2":
			w.Header().Set("Content-Type", "font/woff2")
		}
		// Try _next/static first (Next.js export), then fallback to assets
		if strings.HasPrefix(r.URL.Path, "/_next/static/") {
			http.StripPrefix("/_next/static/", nextStaticFS).ServeHTTP(w, r)
		} else if strings.HasPrefix(r.URL.Path, "/assets/") {
			http.StripPrefix("/assets/", assetsFS).ServeHTTP(w, r)
		} else {
			http.NotFound(w, r)
		}
	}

	// Serve Next.js static assets
	mux.HandleFunc(pat.Get("/_next/static/*"), assetHandler)
	mux.HandleFunc(pat.Get("/assets/*"), assetHandler)

	// Serve index.html for all non-API routes (catch-all - must be last)
	mux.HandleFunc(pat.Get("/*"), func(w http.ResponseWriter, r *http.Request) {
		// Don't serve React app for API routes
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}
		// Don't serve index.html for asset requests
		if strings.HasPrefix(r.URL.Path, "/_next") || strings.HasPrefix(r.URL.Path, "/assets") {
			http.NotFound(w, r)
			return
		}
		// Serve index.html for React Router/Next.js
		http.ServeFile(w, r, "./static/dist/index.html")
	})
}
