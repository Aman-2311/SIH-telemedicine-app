#!/usr/bin/env bash
# Fail on any error
set -e

echo "=== SIH Telemedicine Hub Build Script ==="

echo "1. Building React Frontend..."
# Navigate up to the frontend client directory
cd ../frontend/client

# Install frontend dependencies
npm install --legacy-peer-deps

# Build the frontend (Vite)
npm run build

# Navigate back to backend
cd ../../backend

echo "2. Moving frontend build to backend static folder..."
# Remove old static folder if it exists
rm -rf static

# Move the newly built public directory to static
mv ../frontend/dist/public static

echo "3. Installing Backend Dependencies..."
# Install Python requirements
pip install -r requirements.txt

echo "=== Build Complete ==="
