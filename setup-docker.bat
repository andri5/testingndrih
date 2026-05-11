@echo off
REM ============================================================================
REM Quick Setup Script for Multi-Laptop Docker Deployment (Windows)
REM Usage: setup-docker.bat [setup|start|stop|logs|status|clean]
REM ============================================================================

setlocal enabledelayedexpansion

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker is not installed or not in PATH!
    echo Download Docker Desktop: https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker Compose is not installed!
    echo.
    pause
    exit /b 1
)

if "%1"=="" goto setup
if "%1"=="setup" goto setup
if "%1"=="start" goto start
if "%1"=="stop" goto stop
if "%1"=="logs" goto logs
if "%1"=="status" goto status
if "%1"=="clean" goto clean
goto usage

:setup
echo.
echo [INFO] Setting up TestingNDRIH with Docker...
echo [INFO] Docker is installed ✓
echo.

if not exist ".env" (
    echo [INFO] Creating .env file from .env.example...
    copy .env.example .env
    echo [SUCCESS] .env file created
    echo [WARNING] Please review .env file and customize if needed
) else (
    echo [INFO] .env file already exists
)

echo.
echo [INFO] Run: setup-docker.bat start  (to start services)
echo.
goto end

:start
echo.
echo [INFO] Starting Docker services...
docker-compose up -d

echo [INFO] Waiting for services to be ready (15 seconds)...
timeout /t 15 /nobreak

docker-compose ps
echo.
echo [SUCCESS] Services started!
echo.
echo [INFO] Access your application:
echo   Frontend:  http://localhost:3000
echo   API Docs:  http://localhost:3000/api/docs
echo   Login:     admin@testingndrih.local / changeme123
echo.
goto end

:stop
echo.
echo [INFO] Stopping Docker services...
docker-compose down
echo [SUCCESS] Services stopped (data preserved)
echo.
goto end

:logs
if "%2"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %2
)
goto end

:status
echo.
echo [INFO] Checking service status...
docker-compose ps
echo.
echo [INFO] Testing API health...
curl -s http://localhost:3000/health >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend API: NOT RESPONDING
) else (
    echo [SUCCESS] Backend API: HEALTHY
)
echo.
goto end

:clean
echo.
echo [WARNING] This will DELETE all data and containers!
set /p confirm="Are you sure? Type 'yes' to confirm: "
if not "!confirm!"=="yes" (
    echo [INFO] Cancelled
    goto end
)

echo [INFO] Removing all containers and volumes...
docker-compose down -v
echo [SUCCESS] All cleaned up
echo.
goto end

:usage
echo.
echo Usage: setup-docker.bat [command]
echo.
echo Commands:
echo   setup    - Initialize .env file (one-time)
echo   start    - Start all services
echo   stop     - Stop all services
echo   logs     - Show logs (add 'app' or 'postgres' for specific service)
echo   status   - Check service health
echo   clean    - Remove all data (DESTRUCTIVE)
echo.
goto end

:end
