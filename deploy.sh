#!/bin/bash

# Women's Wellness Buddy Deployment Script
# This script helps deploy both frontend and backend

set -e

echo "🚀 Women's Wellness Buddy Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_status "Dependencies check passed!"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    cd frontend
    
    if [ ! -f "package.json" ]; then
        print_error "Frontend package.json not found!"
        exit 1
    fi
    
    npm install
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Frontend build failed - dist directory not found!"
        exit 1
    fi
    
    print_status "Frontend built successfully!"
    cd ..
}

# Build backend
build_backend() {
    print_status "Building backend..."
    cd backend
    
    if [ ! -f "package.json" ]; then
        print_error "Backend package.json not found!"
        exit 1
    fi
    
    npm install
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Backend build failed - dist directory not found!"
        exit 1
    fi
    
    print_status "Backend built successfully!"
    cd ..
}

# Deploy frontend to Vercel
deploy_frontend() {
    print_status "Deploying frontend to Vercel..."
    cd frontend
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    print_status "Starting Vercel deployment..."
    vercel --prod
    
    cd ..
}

# Deploy backend to Railway
deploy_backend() {
    print_status "Deploying backend to Railway..."
    cd backend
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI not found. Installing..."
        npm install -g @railway/cli
    fi
    
    print_status "Starting Railway deployment..."
    railway up
    
    cd ..
}

# Main deployment function
deploy_all() {
    print_status "Starting full deployment..."
    
    check_dependencies
    build_frontend
    build_backend
    
    echo ""
    print_status "Builds completed successfully!"
    echo ""
    
    read -p "Do you want to deploy to Vercel and Railway now? (y/n): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy_frontend
        deploy_backend
        print_status "Deployment completed!"
    else
        print_status "Builds ready for manual deployment."
        print_status "Frontend: cd frontend && vercel --prod"
        print_status "Backend: cd backend && railway up"
    fi
}

# Development setup
setup_dev() {
    print_status "Setting up development environment..."
    
    # Frontend setup
    cd frontend
    npm install
    print_status "Frontend dependencies installed!"
    cd ..
    
    # Backend setup
    cd backend
    npm install
    print_status "Backend dependencies installed!"
    cd ..
    
    print_status "Development environment ready!"
    print_status "To start development:"
    print_status "  Frontend: cd frontend && npm run dev"
    print_status "  Backend: cd backend && npm run dev"
}

# Show usage
show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     - Build both frontend and backend"
    echo "  deploy    - Build and deploy both applications"
    echo "  dev       - Set up development environment"
    echo "  frontend  - Build and deploy only frontend"
    echo "  backend   - Build and deploy only backend"
    echo "  help      - Show this help message"
    echo ""
}

# Main script logic
case "${1:-help}" in
    "build")
        check_dependencies
        build_frontend
        build_backend
        print_status "Builds completed successfully!"
        ;;
    "deploy")
        deploy_all
        ;;
    "dev")
        setup_dev
        ;;
    "frontend")
        check_dependencies
        build_frontend
        deploy_frontend
        ;;
    "backend")
        check_dependencies
        build_backend
        deploy_backend
        ;;
    "help"|*)
        show_usage
        ;;
esac 