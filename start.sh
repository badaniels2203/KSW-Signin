#!/bin/bash

echo "======================================"
echo "KSW Attendance System - Quick Start"
echo "======================================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed."
    echo "Please install Docker from: https://www.docker.com/get-started"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed."
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env exists, create if not
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ Created .env file"
    echo ""
    echo "WARNING: Using default credentials!"
    echo "Please edit .env to change JWT_SECRET and admin password before deploying to production."
    echo ""
fi

# Start Docker Compose
echo "Starting services..."
echo ""
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✓ Services started successfully!"
    echo "======================================"
    echo ""
    echo "Waiting for services to initialize (30 seconds)..."
    sleep 30
    echo ""
    echo "Application URLs:"
    echo "  Student Sign-In:  http://localhost"
    echo "  Admin Portal:     http://localhost/admin/login"
    echo ""
    echo "Default Admin Credentials:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    echo "IMPORTANT: Change the admin password after first login!"
    echo ""
    echo "To view logs: docker-compose logs -f"
    echo "To stop:      docker-compose down"
    echo ""
else
    echo ""
    echo "Error: Failed to start services."
    echo "Please check the error messages above."
    exit 1
fi
