#!/bin/bash
# ============================================================================
# Quick Setup Script for Multi-Laptop Docker Deployment
# Usage: bash setup-docker.sh [setup|start|stop|logs|clean]
# ============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }

# Check Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        print_info "Download Docker Desktop: https://www.docker.com/products/docker-desktop/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed!"
        exit 1
    fi
    
    print_success "Docker is installed"
}

# Setup .env file
setup_env() {
    if [ ! -f ".env" ]; then
        print_info "Creating .env file from .env.example..."
        cp .env.example .env
        print_success ".env file created"
        print_warning "Please review .env file and customize if needed"
    else
        print_info ".env file already exists"
    fi
}

# Start services
start_services() {
    print_info "Starting Docker services..."
    docker-compose up -d
    
    print_info "Waiting for services to be ready (15 seconds)..."
    sleep 15
    
    # Check if services are running
    if docker-compose ps | grep -q "testingndrih-db.*healthy"; then
        print_success "PostgreSQL is ready"
    else
        print_warning "PostgreSQL is starting up, may take another 10 seconds..."
    fi
    
    if docker-compose ps | grep -q "testingndrih-app.*Up"; then
        print_success "Application is running"
    else
        print_error "Application failed to start"
        docker-compose logs app
        exit 1
    fi
    
    print_success "All services are running!"
    
    # Show access URLs
    print_info ""
    print_info "Access your application:"
    echo -e "  ${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "  ${GREEN}API Docs: http://localhost:3000/api/docs${NC}"
    echo -e "  ${GREEN}Default Login: admin@testingndrih.local / changeme123${NC}"
}

# Stop services
stop_services() {
    print_info "Stopping Docker services..."
    docker-compose down
    print_success "Services stopped (data preserved)"
}

# Show logs
show_logs() {
    docker-compose logs -f "${1:-}"
}

# Clean up (destructive)
clean_services() {
    print_warning "This will delete all data. Are you sure? (yes/no)"
    read -r response
    if [ "$response" != "yes" ]; then
        print_info "Cancelled"
        exit 0
    fi
    
    print_info "Removing all containers and volumes..."
    docker-compose down -v
    print_success "All cleaned up"
}

# Status check
status() {
    print_info "Checking service status..."
    docker-compose ps
    
    print_info ""
    print_info "Service health:"
    if docker-compose exec -T postgres pg_isready -U testingndrih_user &> /dev/null; then
        print_success "PostgreSQL: HEALTHY"
    else
        print_error "PostgreSQL: NOT RESPONDING"
    fi
    
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        print_success "Backend API: HEALTHY"
    else
        print_error "Backend API: NOT RESPONDING"
    fi
}

# Main
main() {
    case "${1:-setup}" in
        setup)
            print_info "Setting up TestingNDRIH with Docker..."
            check_docker
            setup_env
            print_info ""
            print_info "Run 'bash setup-docker.sh start' to start services"
            ;;
        start)
            check_docker
            start_services
            ;;
        stop)
            stop_services
            ;;
        logs)
            show_logs "$2"
            ;;
        clean)
            clean_services
            ;;
        status)
            status
            ;;
        *)
            echo "Usage: bash setup-docker.sh [command]"
            echo ""
            echo "Commands:"
            echo "  setup       - Initialize .env file (one-time)"
            echo "  start       - Start all services"
            echo "  stop        - Stop all services"
            echo "  logs [svc]  - Show logs (app, postgres)"
            echo "  status      - Check service health"
            echo "  clean       - Remove all data (DESTRUCTIVE)"
            exit 1
            ;;
    esac
}

main "$@"
