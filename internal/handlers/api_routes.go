package handlers

import (
	"net/http"

	"goji.io"
	"goji.io/pat"
)

// SetupAPIRoutes configures all API routes (JSON responses)
func SetupAPIRoutes(mux *goji.Mux) {
	// Authentication API
	mux.HandleFunc(pat.Post("/api/register"), RegisterAPI)
	mux.HandleFunc(pat.Post("/api/login"), LoginAPI)
	mux.HandleFunc(pat.Post("/api/logout"), LogoutAPI)

	// Profile API
	mux.HandleFunc(pat.Get("/api/profile"), ProfileAPI)
	mux.HandleFunc(pat.Post("/api/profile"), ProfileUpdateAPI)

	// Browse/Search API
	mux.HandleFunc(pat.Get("/api/browse"), BrowseAPI)
	mux.HandleFunc(pat.Get("/api/search"), SearchAPI)

	// User profile API
	mux.HandleFunc(pat.Get("/api/user/:id"), UserProfileAPI)

	// Like/Unlike API
	mux.HandleFunc(pat.Post("/api/like/:id"), LikeAPI)
	mux.HandleFunc(pat.Post("/api/unlike/:id"), UnlikeAPI)

	// Chat API
	mux.HandleFunc(pat.Get("/api/chat"), ChatListAPI)
	mux.HandleFunc(pat.Get("/api/messages/:id"), MessagesAPI)
	mux.HandleFunc(pat.Post("/api/messages/:id"), SendMessageAPI)

	// Notifications API
	mux.HandleFunc(pat.Get("/api/notifications"), NotificationsAPI)
}

// SetupFrontendRoutes serves the React app (catch-all)
func SetupFrontendRoutes(mux *goji.Mux) {
	// Serve React app build files
	fs := http.FileServer(http.Dir("./static/dist"))
	
	// Serve index.html for all non-API routes
	mux.HandleFunc(pat.Get("/*"), func(w http.ResponseWriter, r *http.Request) {
		// Don't serve React app for API routes
		if r.URL.Path[:4] == "/api" {
			http.NotFound(w, r)
			return
		}
		// Serve index.html for React Router
		http.ServeFile(w, r, "./static/dist/index.html")
	})
	
	// Serve static assets from React build
	mux.HandleFunc(pat.Get("/assets/*"), http.StripPrefix("/assets/", fs).ServeHTTP)
}

