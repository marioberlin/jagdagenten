#!/bin/bash
# Frontend startup script - uses npx to avoid Bun runtime issues with Vite

cd "$(dirname "$0")"

echo "Starting LiquidCrypto Frontend..."
echo "Frontend will be available at: http://localhost:5173"
echo ""

# Use npx to run vite directly
npx vite --host
