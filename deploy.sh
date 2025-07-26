#!/bin/bash

# SenShop Production Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting SenShop deployment to $ENVIRONMENT..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        print_error "Environment file .env.$ENVIRONMENT not found"
        print_status "Please create .env.$ENVIRONMENT based on the template"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Create backup
create_backup() {
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Creating backup..."
        
        # Create backup directory
        mkdir -p "backups/$TIMESTAMP"
        
        # Backup database
        docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U senshop_user senshop_production > "backups/$TIMESTAMP/database_backup.sql"
        
        # Backup uploads directory
        if [ -d "sen-commerce/uploads" ]; then
            cp -r sen-commerce/uploads "backups/$TIMESTAMP/uploads_backup"
        fi
        
        print_success "Backup created in backups/$TIMESTAMP"
    fi
}

# Build and deploy
deploy() {
    print_status "Starting deployment process..."
    
    # Load environment variables
    export $(cat .env.$ENVIRONMENT | xargs)
    
    # Stop existing containers
    print_status "Stopping existing containers..."
    docker-compose -f docker-compose.production.yml down
    
    # Build new images
    print_status "Building application images..."
    docker-compose -f docker-compose.production.yml build --no-cache
    
    # Start database and cache first
    print_status "Starting database and cache services..."
    docker-compose -f docker-compose.production.yml up -d postgres redis
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    timeout=60
    while ! docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U senshop_user -d senshop_production; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "Database failed to start within timeout"
            exit 1
        fi
    done
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose -f docker-compose.production.yml run --rm backend npm run medusa -- db:migrate
    
    # Start backend
    print_status "Starting backend service..."
    docker-compose -f docker-compose.production.yml up -d backend
    
    # Wait for backend to be ready
    print_status "Waiting for backend to be ready..."
    timeout=60
    while ! curl -f http://localhost:9000/health &> /dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "Backend failed to start within timeout"
            exit 1
        fi
    done
    
    # Start frontend
    print_status "Starting frontend service..."
    docker-compose -f docker-compose.production.yml up -d frontend
    
    # Wait for frontend to be ready
    print_status "Waiting for frontend to be ready..."
    timeout=60
    while ! curl -f http://localhost:3000 &> /dev/null; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            print_error "Frontend failed to start within timeout"
            exit 1
        fi
    done
    
    # Start nginx
    print_status "Starting nginx reverse proxy..."
    docker-compose -f docker-compose.production.yml up -d nginx
    
    print_success "All services started successfully"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Check backend health
    if curl -f http://localhost:9000/health &> /dev/null; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        return 1
    fi
    
    # Check frontend health
    if curl -f http://localhost:3000 &> /dev/null; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        return 1
    fi
    
    # Check database connection
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U senshop_user -d senshop_production &> /dev/null; then
        print_success "Database connection check passed"
    else
        print_error "Database connection check failed"
        return 1
    fi
    
    print_success "All health checks passed"
}

# Cleanup old images
cleanup() {
    print_status "Cleaning up old Docker images..."
    docker image prune -f
    docker system prune -f --volumes
    print_success "Cleanup completed"
}

# Rollback function
rollback() {
    if [ -d "backups/$1" ]; then
        print_warning "Rolling back to backup $1..."
        
        # Stop services
        docker-compose -f docker-compose.production.yml down
        
        # Restore database
        docker-compose -f docker-compose.production.yml up -d postgres
        sleep 10
        docker-compose -f docker-compose.production.yml exec -T postgres psql -U senshop_user -d senshop_production < "backups/$1/database_backup.sql"
        
        # Restore uploads
        if [ -d "backups/$1/uploads_backup" ]; then
            rm -rf sen-commerce/uploads
            cp -r "backups/$1/uploads_backup" sen-commerce/uploads
        fi
        
        # Start services
        docker-compose -f docker-compose.production.yml up -d
        
        print_success "Rollback completed"
    else
        print_error "Backup $1 not found"
        exit 1
    fi
}

# Print usage
usage() {
    echo "Usage: $0 [environment]"
    echo "       $0 rollback [backup_timestamp]"
    echo ""
    echo "Environments: production, staging"
    echo ""
    echo "Examples:"
    echo "  $0 production"
    echo "  $0 rollback 20231201_143022"
}

# Main execution
case "$1" in
    "rollback")
        if [ -z "$2" ]; then
            print_error "Please specify backup timestamp for rollback"
            usage
            exit 1
        fi
        rollback "$2"
        ;;
    "production"|"staging"|"")
        check_prerequisites
        create_backup
        deploy
        sleep 10
        if health_check; then
            cleanup
            print_success "🎉 Deployment completed successfully!"
            print_status "Application is available at:"
            print_status "  - Frontend: http://localhost"
            print_status "  - Backend API: http://localhost/api"
            print_status "  - Admin: http://localhost/app"
        else
            print_error "Health checks failed. Please check the logs."
            print_status "You can rollback using: $0 rollback $TIMESTAMP"
            exit 1
        fi
        ;;
    "help"|"-h"|"--help")
        usage
        ;;
    *)
        print_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac