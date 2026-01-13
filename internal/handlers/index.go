package handlers

import (
	"net/http"
)

// IndexHandler handles the home page
// Since we're using React, this endpoint is not needed - React Router handles frontend routes
// This is kept for backwards compatibility or can be removed
func IndexHandler(w http.ResponseWriter, r *http.Request) {
	// Frontend is served by SetupFrontendRoutes in api_routes.go
	// This handler is not used when React is serving the frontend
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("API is running. Frontend should be served by React app."))
}
