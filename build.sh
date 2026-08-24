#!/usr/bin/env bash
# =========================================================================
#  Portfolio Builder for Linux / macOS / Git Bash
#  Updates index.html from portfolio.config.json
# =========================================================================

echo "[INFO] Updating portfolio from portfolio.config.json..."
node build.js

if [ $? -eq 0 ]; then
    echo "[SUCCESS] Portfolio updated successfully!"
else
    echo "[ERROR] Build failed. Please ensure Node.js is installed."
    exit 1
fi
