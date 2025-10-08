#!/bin/bash

# Deployment script for Loan Prediction Frontend
# Supports deployment to Netlify, Vercel, and other platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="loan-prediction-frontend"
BUILD_DIR="$PROJECT_DIR/build"
DIST_DIR="dist"

echo -e "${BLUE}🚀 Loan Prediction Frontend Deployment Script${NC}"
echo "============================================="

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Project directory '$PROJECT_DIR' not found!"
    print_info "Please run this script from the root of your loan-default-detection repository"
    exit 1
fi

# Check deployment platform
PLATFORM=${1:-"netlify"}

case $PLATFORM in
    "netlify"|"n")
        PLATFORM="netlify"
        print_info "Deploying to Netlify..."
        ;;
    "vercel"|"v")
        PLATFORM="vercel"
        print_info "Deploying to Vercel..."
        ;;
    "manual"|"m")
        PLATFORM="manual"
        print_info "Building for manual deployment..."
        ;;
    *)
        print_error "Unknown platform: $PLATFORM"
        echo "Usage: $0 [netlify|vercel|manual]"
        exit 1
        ;;
esac

# Navigate to project directory
cd $PROJECT_DIR

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found in $PROJECT_DIR"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_info "Installing dependencies..."
    npm install
    print_status "Dependencies installed"
fi

# Clean previous builds
if [ -d "$BUILD_DIR" ]; then
    print_info "Cleaning previous build..."
    rm -rf build
fi

# Build the project
print_info "Building production bundle..."
npm run build:prod

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_status "Build completed successfully!"

# Check build size
BUILD_SIZE=$(du -sh build 2>/dev/null | cut -f1 || echo "unknown")
print_info "Build size: $BUILD_SIZE"

# Platform-specific deployment
case $PLATFORM in
    "netlify")
        print_info "Checking for Netlify CLI..."
        if ! command -v netlify &> /dev/null; then
            print_warning "Netlify CLI not found. Installing..."
            npm install -g netlify-cli
        fi
        
        print_info "Deploying to Netlify..."
        netlify deploy --prod --dir=build --open
        
        if [ $? -eq 0 ]; then
            print_status "Successfully deployed to Netlify!"
        else
            print_error "Netlify deployment failed!"
            exit 1
        fi
        ;;
        
    "vercel")
        print_info "Checking for Vercel CLI..."
        if ! command -v vercel &> /dev/null; then
            print_warning "Vercel CLI not found. Installing..."
            npm install -g vercel
        fi
        
        print_info "Deploying to Vercel..."
        vercel --prod
        
        if [ $? -eq 0 ]; then
            print_status "Successfully deployed to Vercel!"
        else
            print_error "Vercel deployment failed!"
            exit 1
        fi
        ;;
        
    "manual")
        # Create distribution package
        cd ..
        print_info "Creating distribution package..."
        
        if [ -d "$DIST_DIR" ]; then
            rm -rf $DIST_DIR
        fi
        
        mkdir -p $DIST_DIR
        
        # Copy build files
        cp -r $PROJECT_DIR/build/* $DIST_DIR/
        
        # Copy configuration files
        cp netlify.toml $DIST_DIR/ 2>/dev/null || true
        cp vercel.json $DIST_DIR/ 2>/dev/null || true
        cp Dockerfile $DIST_DIR/ 2>/dev/null || true
        cp docker-compose.yml $DIST_DIR/ 2>/dev/null || true
        
        # Create deployment guide
        cat > $DIST_DIR/DEPLOYMENT_GUIDE.md << EOF
# Manual Deployment Guide

This package contains the built loan prediction frontend application.

## Contents
- Static files ready for web server deployment
- Configuration files for various platforms
- Docker configuration for containerized deployment

## Deployment Options

### Static Web Server (Apache/Nginx)
1. Upload all files to your web root directory
2. Configure your web server to serve index.html for all routes
3. Set appropriate cache headers for static assets

### Netlify
1. Drag and drop this folder to netlify.com/drop
2. Or use the Netlify CLI: netlify deploy --prod --dir=.

### Vercel
1. Use Vercel CLI: vercel --prod
2. Or connect your GitHub repository to Vercel

### Docker
1. Build: docker build -t loan-prediction-frontend .
2. Run: docker run -p 80:80 loan-prediction-frontend

## Environment Variables
Make sure to set the appropriate environment variables for your production environment:
- REACT_APP_API_URL: Your backend API URL
- REACT_APP_WS_URL: Your WebSocket URL (if applicable)

Built on: $(date)
EOF

        # Create archive
        tar -czf loan-prediction-frontend-$(date +%Y%m%d).tar.gz $DIST_DIR
        
        print_status "Distribution package created in $DIST_DIR/"
        print_status "Archive created: loan-prediction-frontend-$(date +%Y%m%d).tar.gz"
        print_info "Ready for manual deployment!"
        ;;
esac

# Performance check
print_info "Running quick performance check..."
echo "==================================="

# Check bundle sizes
echo "📦 Bundle Analysis:"
if [ -f "build/static/js/"*.js ]; then
    for file in build/static/js/*.js; do
        size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
        size_kb=$((size / 1024))
        filename=$(basename "$file")
        echo "   $filename: ${size_kb}KB"
    done
fi

# Check for common performance issues
echo ""
echo "🔍 Performance Checks:"

# Check if source maps are disabled in production
if [ -f "build/static/js/"*.js.map ]; then
    print_warning "Source maps found in production build (may increase bundle size)"
else
    print_status "Source maps properly excluded from production"
fi

# Check gzip compression potential
if command -v gzip &> /dev/null; then
    original_size=$(du -sb build 2>/dev/null | cut -f1 || echo "0")
    gzipped_size=$(tar -czf - build 2>/dev/null | wc -c || echo "0")
    if [ "$original_size" -gt 0 ] && [ "$gzipped_size" -gt 0 ]; then
        compression_ratio=$((100 - (gzipped_size * 100 / original_size)))
        print_info "Gzip compression potential: ~${compression_ratio}% size reduction"
    fi
fi

echo ""
print_status "Deployment completed successfully! 🎉"
echo ""
print_info "Next steps:"
echo "1. Test your deployed application thoroughly"
echo "2. Set up monitoring and analytics"
echo "3. Configure custom domain (if needed)"
echo "4. Set up SSL certificate"
echo "5. Configure CDN for global performance"

# If it's a Netlify or Vercel deployment, show the URL
if [ "$PLATFORM" = "netlify" ] || [ "$PLATFORM" = "vercel" ]; then
    print_info "Your application should now be live at the provided URL!"
fi