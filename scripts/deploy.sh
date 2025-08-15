#!/bin/bash

# Christian Kit Deployment Script
# This script handles deployment to Cloudflare Pages

set -e

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

# Check if wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI is not installed. Please install it first:"
        echo "npm install -g wrangler"
        exit 1
    fi
}

# Check if user is authenticated
check_auth() {
    if ! wrangler whoami &> /dev/null; then
        print_error "Not authenticated with Cloudflare. Please run:"
        echo "wrangler login"
        exit 1
    fi
}

# Build the project
build_project() {
    print_status "Building project..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not found"
        exit 1
    fi
    
    print_status "Build completed successfully"
}

# Deploy to staging
deploy_staging() {
    print_status "Deploying to staging environment..."
    
    # Set environment variables for staging
    export ENVIRONMENT=staging
    
    # Deploy using wrangler
    wrangler pages deploy dist --project-name=christian-kit-staging --env=staging
    
    print_status "Staging deployment completed"
}

# Deploy to production
deploy_production() {
    print_status "Deploying to production environment..."
    
    # Set environment variables for production
    export ENVIRONMENT=production
    
    # Deploy using wrangler
    wrangler pages deploy dist --project-name=christian-kit-prod --env=production
    
    print_status "Production deployment completed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test -- --run
    
    if [ $? -eq 0 ]; then
        print_status "All tests passed"
    else
        print_error "Tests failed - deployment aborted"
        exit 1
    fi
}

# Check environment
check_environment() {
    print_status "Checking environment configuration..."
    
    # Check if wrangler.toml exists
    if [ ! -f "wrangler.toml" ]; then
        print_error "wrangler.toml not found"
        exit 1
    fi
    
    # Check if database and KV IDs are configured
    if grep -q "your-database-id-here" wrangler.toml; then
        print_warning "Database ID not configured in wrangler.toml"
    fi
    
    if grep -q "your-kv-namespace-id-here" wrangler.toml; then
        print_warning "KV namespace ID not configured in wrangler.toml"
    fi
}

# Main deployment function
main() {
    local environment=${1:-staging}
    
    print_status "Starting deployment to $environment environment..."
    
    # Pre-deployment checks
    check_wrangler
    check_auth
    check_environment
    run_tests
    build_project
    
    # Deploy based on environment
    case $environment in
        "staging")
            deploy_staging
            ;;
        "production")
            deploy_production
            ;;
        *)
            print_error "Invalid environment: $environment. Use 'staging' or 'production'"
            exit 1
            ;;
    esac
    
    print_status "Deployment completed successfully!"
}

# Handle command line arguments
case ${1:-} in
    "staging")
        main "staging"
        ;;
    "production")
        main "production"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [staging|production]"
        echo "  staging    - Deploy to staging environment (default)"
        echo "  production - Deploy to production environment"
        echo "  help       - Show this help message"
        ;;
    *)
        main "staging"
        ;;
esac





# Christian Kit Deployment Script
# This script handles deployment to Cloudflare Pages

set -e

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

# Check if wrangler is installed
check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI is not installed. Please install it first:"
        echo "npm install -g wrangler"
        exit 1
    fi
}

# Check if user is authenticated
check_auth() {
    if ! wrangler whoami &> /dev/null; then
        print_error "Not authenticated with Cloudflare. Please run:"
        echo "wrangler login"
        exit 1
    fi
}

# Build the project
build_project() {
    print_status "Building project..."
    npm run build
    
    if [ ! -d "dist" ]; then
        print_error "Build failed - dist directory not found"
        exit 1
    fi
    
    print_status "Build completed successfully"
}

# Deploy to staging
deploy_staging() {
    print_status "Deploying to staging environment..."
    
    # Set environment variables for staging
    export ENVIRONMENT=staging
    
    # Deploy using wrangler
    wrangler pages deploy dist --project-name=christian-kit-staging --env=staging
    
    print_status "Staging deployment completed"
}

# Deploy to production
deploy_production() {
    print_status "Deploying to production environment..."
    
    # Set environment variables for production
    export ENVIRONMENT=production
    
    # Deploy using wrangler
    wrangler pages deploy dist --project-name=christian-kit-prod --env=production
    
    print_status "Production deployment completed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    npm test -- --run
    
    if [ $? -eq 0 ]; then
        print_status "All tests passed"
    else
        print_error "Tests failed - deployment aborted"
        exit 1
    fi
}

# Check environment
check_environment() {
    print_status "Checking environment configuration..."
    
    # Check if wrangler.toml exists
    if [ ! -f "wrangler.toml" ]; then
        print_error "wrangler.toml not found"
        exit 1
    fi
    
    # Check if database and KV IDs are configured
    if grep -q "your-database-id-here" wrangler.toml; then
        print_warning "Database ID not configured in wrangler.toml"
    fi
    
    if grep -q "your-kv-namespace-id-here" wrangler.toml; then
        print_warning "KV namespace ID not configured in wrangler.toml"
    fi
}

# Main deployment function
main() {
    local environment=${1:-staging}
    
    print_status "Starting deployment to $environment environment..."
    
    # Pre-deployment checks
    check_wrangler
    check_auth
    check_environment
    run_tests
    build_project
    
    # Deploy based on environment
    case $environment in
        "staging")
            deploy_staging
            ;;
        "production")
            deploy_production
            ;;
        *)
            print_error "Invalid environment: $environment. Use 'staging' or 'production'"
            exit 1
            ;;
    esac
    
    print_status "Deployment completed successfully!"
}

# Handle command line arguments
case ${1:-} in
    "staging")
        main "staging"
        ;;
    "production")
        main "production"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [staging|production]"
        echo "  staging    - Deploy to staging environment (default)"
        echo "  production - Deploy to production environment"
        echo "  help       - Show this help message"
        ;;
    *)
        main "staging"
        ;;
esac




