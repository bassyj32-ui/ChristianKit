@echo off
REM Christian Kit Deployment Script for Windows
REM This script handles deployment to Cloudflare Pages

setlocal enabledelayedexpansion

REM Set colors for output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %GREEN%[INFO]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Check if wrangler is installed
:check_wrangler
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Wrangler CLI is not installed. Please install it first:"
    echo npm install -g wrangler
    exit /b 1
)
goto :eof

REM Check if user is authenticated
:check_auth
wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Not authenticated with Cloudflare. Please run:"
    echo wrangler login
    exit /b 1
)
goto :eof

REM Build the project
:build_project
call :print_status "Building project..."
call npm run build

if not exist "dist" (
    call :print_error "Build failed - dist directory not found"
    exit /b 1
)

call :print_status "Build completed successfully"
goto :eof

REM Deploy to staging
:deploy_staging
call :print_status "Deploying to staging environment..."
set "ENVIRONMENT=staging"

REM Deploy using wrangler
wrangler pages deploy dist --project-name=christian-kit-staging --env=staging

call :print_status "Staging deployment completed"
goto :eof

REM Deploy to production
:deploy_production
call :print_status "Deploying to production environment..."
set "ENVIRONMENT=production"

REM Deploy using wrangler
wrangler pages deploy dist --project-name=christian-kit-prod --env=production

call :print_status "Production deployment completed"
goto :eof

REM Run tests
:run_tests
call :print_status "Running tests..."
call npm test -- --run

if %errorlevel% neq 0 (
    call :print_error "Tests failed - deployment aborted"
    exit /b 1
)

call :print_status "All tests passed"
goto :eof

REM Check environment
:check_environment
call :print_status "Checking environment configuration..."

REM Check if wrangler.toml exists
if not exist "wrangler.toml" (
    call :print_error "wrangler.toml not found"
    exit /b 1
)

REM Check if database and KV IDs are configured
findstr "your-database-id-here" wrangler.toml >nul 2>&1
if %errorlevel% equ 0 (
    call :print_warning "Database ID not configured in wrangler.toml"
)

findstr "your-kv-namespace-id-here" wrangler.toml >nul 2>&1
if %errorlevel% equ 0 (
    call :print_warning "KV namespace ID not configured in wrangler.toml"
)
goto :eof

REM Main deployment function
:main
set "environment=%~1"
if "%environment%"=="" set "environment=staging"

call :print_status "Starting deployment to %environment% environment..."

REM Pre-deployment checks
call :check_wrangler
if %errorlevel% neq 0 exit /b 1

call :check_auth
if %errorlevel% neq 0 exit /b 1

call :check_environment
if %errorlevel% neq 0 exit /b 1

call :run_tests
if %errorlevel% neq 0 exit /b 1

call :build_project
if %errorlevel% neq 0 exit /b 1

REM Deploy based on environment
if /i "%environment%"=="staging" (
    call :deploy_staging
) else if /i "%environment%"=="production" (
    call :deploy_production
) else (
    call :print_error "Invalid environment: %environment%. Use 'staging' or 'production'"
    exit /b 1
)

call :print_status "Deployment completed successfully!"
goto :eof

REM Handle command line arguments
if "%1"=="staging" (
    call :main "staging"
) else if "%1"=="production" (
    call :main "production"
) else if "%1"=="help" (
    echo Usage: %0 [staging^|production]
    echo   staging    - Deploy to staging environment ^(default^)
    echo   production - Deploy to production environment
    echo   help       - Show this help message
) else (
    call :main "staging"
)

endlocal




REM Christian Kit Deployment Script for Windows
REM This script handles deployment to Cloudflare Pages

setlocal enabledelayedexpansion

REM Set colors for output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %GREEN%[INFO]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Check if wrangler is installed
:check_wrangler
wrangler --version >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Wrangler CLI is not installed. Please install it first:"
    echo npm install -g wrangler
    exit /b 1
)
goto :eof

REM Check if user is authenticated
:check_auth
wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    call :print_error "Not authenticated with Cloudflare. Please run:"
    echo wrangler login
    exit /b 1
)
goto :eof

REM Build the project
:build_project
call :print_status "Building project..."
call npm run build

if not exist "dist" (
    call :print_error "Build failed - dist directory not found"
    exit /b 1
)

call :print_status "Build completed successfully"
goto :eof

REM Deploy to staging
:deploy_staging
call :print_status "Deploying to staging environment..."
set "ENVIRONMENT=staging"

REM Deploy using wrangler
wrangler pages deploy dist --project-name=christian-kit-staging --env=staging

call :print_status "Staging deployment completed"
goto :eof

REM Deploy to production
:deploy_production
call :print_status "Deploying to production environment..."
set "ENVIRONMENT=production"

REM Deploy using wrangler
wrangler pages deploy dist --project-name=christian-kit-prod --env=production

call :print_status "Production deployment completed"
goto :eof

REM Run tests
:run_tests
call :print_status "Running tests..."
call npm test -- --run

if %errorlevel% neq 0 (
    call :print_error "Tests failed - deployment aborted"
    exit /b 1
)

call :print_status "All tests passed"
goto :eof

REM Check environment
:check_environment
call :print_status "Checking environment configuration..."

REM Check if wrangler.toml exists
if not exist "wrangler.toml" (
    call :print_error "wrangler.toml not found"
    exit /b 1
)

REM Check if database and KV IDs are configured
findstr "your-database-id-here" wrangler.toml >nul 2>&1
if %errorlevel% equ 0 (
    call :print_warning "Database ID not configured in wrangler.toml"
)

findstr "your-kv-namespace-id-here" wrangler.toml >nul 2>&1
if %errorlevel% equ 0 (
    call :print_warning "KV namespace ID not configured in wrangler.toml"
)
goto :eof

REM Main deployment function
:main
set "environment=%~1"
if "%environment%"=="" set "environment=staging"

call :print_status "Starting deployment to %environment% environment..."

REM Pre-deployment checks
call :check_wrangler
if %errorlevel% neq 0 exit /b 1

call :check_auth
if %errorlevel% neq 0 exit /b 1

call :check_environment
if %errorlevel% neq 0 exit /b 1

call :run_tests
if %errorlevel% neq 0 exit /b 1

call :build_project
if %errorlevel% neq 0 exit /b 1

REM Deploy based on environment
if /i "%environment%"=="staging" (
    call :deploy_staging
) else if /i "%environment%"=="production" (
    call :deploy_production
) else (
    call :print_error "Invalid environment: %environment%. Use 'staging' or 'production'"
    exit /b 1
)

call :print_status "Deployment completed successfully!"
goto :eof

REM Handle command line arguments
if "%1"=="staging" (
    call :main "staging"
) else if "%1"=="production" (
    call :main "production"
) else if "%1"=="help" (
    echo Usage: %0 [staging^|production]
    echo   staging    - Deploy to staging environment ^(default^)
    echo   production - Deploy to production environment
    echo   help       - Show this help message
) else (
    call :main "staging"
)

endlocal




