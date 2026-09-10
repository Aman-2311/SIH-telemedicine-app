# Stage 1: Build the frontend
FROM node:20-alpine AS build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package.json frontend/package-lock.json* ./

# Clean install to ensure exact dependencies
RUN npm ci

# Copy the rest of the frontend source
COPY frontend/ ./

# Build the frontend (Vite)
RUN npm run build


# Stage 2: Serve with FastAPI
FROM python:3.11-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Copy the requirements file and install dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the backend source code
COPY backend/ ./backend/

# Copy the compiled frontend assets from the build stage
COPY --from=build /app/frontend/dist /app/frontend/dist

# Expose the default port (Render will override via $PORT)
ENV PORT=8000
EXPOSE $PORT

# Start Uvicorn and bind to $PORT
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
