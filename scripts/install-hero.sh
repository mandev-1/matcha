#!/bin/bash

# Script to install Hero template engine
# This is the Go template engine (github.com/shiyanhui/hero), not the React Hero UI

echo "Installing Hero template engine..."

# The hero CLI tool is in the hero subdirectory
HERO_PATH="github.com/shiyanhui/hero/hero"

# Try standard installation
echo "Attempting: go install $HERO_PATH@latest"
if go install $HERO_PATH@latest; then
    echo "Hero installed successfully!"
    echo "Make sure $HOME/go/bin is in your PATH"
    if [ -f "$HOME/go/bin/hero" ]; then
        $HOME/go/bin/hero --version
    else
        echo "Hero binary not found. Check your GOPATH/bin location."
    fi
else
    echo "Standard installation failed. Trying with GOPROXY=direct..."
    if GOPROXY=direct go install $HERO_PATH@latest; then
        echo "Hero installed successfully with direct proxy!"
        if [ -f "$HOME/go/bin/hero" ]; then
            $HOME/go/bin/hero --version
        fi
    else
        echo ""
        echo "Installation failed. Alternative methods:"
        echo ""
        echo "Method 1: Clone and build manually"
        echo "  git clone https://github.com/shiyanhui/hero.git"
        echo "  cd hero/hero"
        echo "  go install"
        echo ""
        echo "Method 2: Download pre-built binary"
        echo "  Visit: https://github.com/shiyanhui/hero/releases"
        echo ""
        echo "Method 3: Use go get (older method)"
        echo "  go get -u github.com/shiyanhui/hero/hero"
    fi
fi

