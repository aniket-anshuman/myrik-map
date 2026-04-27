#!/bin/bash

# ================================================
# Issue Reporting System - Startup Script
# ================================================

echo ""
echo "========================================"
echo "  Issue Reporting System"
echo "  Backend API + Frontend UI"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo ""
    echo "Please download and install Node.js from:"
    echo "https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[1/4] Checking Node.js..."
node --version
echo ""

echo "[2/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo ""

echo "[3/4] Creating upload directory..."
mkdir -p uploads/issues
echo "Created/verified: uploads/issues"
echo ""

echo "[4/4] Starting server..."
echo ""
echo "========================================"
echo "  Server starting on port 3000"
echo "  Open browser: http://localhost:3000"
echo "  Press Ctrl+C to stop"
echo "========================================"
echo ""

# Start the server
npm start
