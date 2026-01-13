#!/bin/bash

# Script to fix Go dependencies with TLS/certificate issues

echo "Fixing Go dependencies..."

# Set environment variables to bypass proxy issues
export GOPROXY=direct
export GOSUMDB=off

# Clean module cache if needed
echo "Cleaning module cache..."
go clean -modcache 2>/dev/null || true

# Download dependencies
echo "Downloading dependencies with direct proxy..."
go mod download

# Tidy up
echo "Running go mod tidy..."
go mod tidy

if [ $? -eq 0 ]; then
    echo "✓ Dependencies fixed successfully!"
    echo ""
    echo "You can now:"
    echo "  - Build: go build -o matcha ."
    echo "  - Run: go run main.go"
else
    echo "✗ Failed to fix dependencies"
    echo ""
    echo "Try manually:"
    echo "  export GOPROXY=direct"
    echo "  export GOSUMDB=off"
    echo "  go mod tidy"
    exit 1
fi

