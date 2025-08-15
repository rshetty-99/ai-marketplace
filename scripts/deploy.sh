#!/bin/bash

# AI Marketplace Deployment Script
# Orchestrates the complete deployment process with validation and rollback capabilities

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/deploy-$(date +%Y%m%d_%H%M%S).log"
DEPLOYMENT_CONFIG="$PROJECT_ROOT/deployment-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
DRY_RUN=false
SKIP_TESTS=false
FORCE_DEPLOY=false
ROLLBACK_ON_FAILURE=true
HEALTH_CHECK_TIMEOUT=300

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    
    case $level in
        ERROR)   echo -e "${RED}ERROR: $message${NC}" ;;
        SUCCESS) echo -e "${GREEN}SUCCESS: $message${NC}" ;;
        WARNING) echo -e "${YELLOW}WARNING: $message${NC}" ;;
        INFO)    echo -e "${BLUE}INFO: $message${NC}" ;;
    esac
}

# Error handling
trap 'handle_error $? $LINENO' ERR

handle_error() {
    local exit_code=$1
    local line_number=$2
    
    log "ERROR" "Deployment failed at line $line_number with exit code $exit_code"
    
    if [[ "$ROLLBACK_ON_FAILURE" == "true" && "$DRY_RUN" == "false" ]]; then
        log "INFO" "Initiating automatic rollback..."
        "$SCRIPT_DIR/rollback.sh" --environment="$ENVIRONMENT" --reason="deployment_failure"
    fi
    
    cleanup
    exit $exit_code
}

# Cleanup function
cleanup() {
    log "INFO" "Performing cleanup..."
    
    # Remove temporary files
    if [[ -d "$PROJECT_ROOT/tmp" ]]; then
        rm -rf "$PROJECT_ROOT/tmp"
    fi
    
    # Kill background processes
    jobs -p | xargs -r kill 2>/dev/null || true
}

# Usage information
show_usage() {
    cat << EOF
AI Marketplace Deployment Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -e, --environment ENVIRONMENT    Target environment (development|staging|production) [default: development]
    -d, --dry-run                   Perform a dry run without actual deployment
    -s, --skip-tests                Skip the testing phase
    -f, --force                     Force deployment even if checks fail
    -n, --no-rollback              Disable automatic rollback on failure
    -t, --timeout SECONDS          Health check timeout in seconds [default: 300]
    -h, --help                      Show this help message

EXAMPLES:
    $0 --environment=staging
    $0 --environment=production --dry-run
    $0 --environment=production --skip-tests --force

ENVIRONMENT VARIABLES:
    FIREBASE_TOKEN                  Firebase authentication token
    NODE_ENV                        Node.js environment
    SLACK_WEBHOOK_URL              Slack notification webhook (optional)
    GITHUB_TOKEN                    GitHub API token (optional)

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -s|--skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            -f|--force)
                FORCE_DEPLOY=true
                shift
                ;;
            -n|--no-rollback)
                ROLLBACK_ON_FAILURE=false
                shift
                ;;
            -t|--timeout)
                HEALTH_CHECK_TIMEOUT="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log "ERROR" "Invalid environment: $ENVIRONMENT"
        exit 1
    fi
}

# Validate prerequisites
validate_prerequisites() {
    log "INFO" "Validating deployment prerequisites..."
    
    # Check required tools
    local required_tools=("node" "npm" "firebase" "git")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version | sed 's/v//')
    local required_version="20.0.0"
    if ! printf '%s\n%s\n' "$required_version" "$node_version" | sort -V | head -n1 | grep -q "^$required_version$"; then
        log "ERROR" "Node.js version $node_version is too old. Required: $required_version+"
        exit 1
    fi
    
    # Check environment variables
    if [[ -z "${FIREBASE_TOKEN:-}" ]]; then
        log "ERROR" "FIREBASE_TOKEN environment variable is required"
        exit 1
    fi
    
    # Check if git working directory is clean
    if [[ -n "$(git status --porcelain)" ]]; then
        log "WARNING" "Git working directory is not clean"
        if [[ "$FORCE_DEPLOY" != "true" ]]; then
            log "ERROR" "Please commit or stash your changes before deploying"
            exit 1
        fi
    fi
    
    log "SUCCESS" "Prerequisites validation passed"
}

# Load deployment configuration
load_deployment_config() {
    if [[ -f "$DEPLOYMENT_CONFIG" ]]; then
        log "INFO" "Loading deployment configuration from $DEPLOYMENT_CONFIG"
        
        # Extract environment-specific configuration
        local config=$(cat "$DEPLOYMENT_CONFIG")
        
        # Set Firebase project
        FIREBASE_PROJECT=$(echo "$config" | jq -r ".environments.$ENVIRONMENT.firebase_project")
        SITE_URL=$(echo "$config" | jq -r ".environments.$ENVIRONMENT.site_url")
        HEALTH_CHECK_URL="$SITE_URL/api/health"
        
        log "INFO" "Firebase project: $FIREBASE_PROJECT"
        log "INFO" "Site URL: $SITE_URL"
    else
        log "WARNING" "Deployment configuration file not found: $DEPLOYMENT_CONFIG"
        
        # Set default values based on environment
        case "$ENVIRONMENT" in
            production)
                FIREBASE_PROJECT="ai-marketplace-prod"
                SITE_URL="https://ai-marketplace.com"
                ;;
            staging)
                FIREBASE_PROJECT="ai-marketplace-staging"
                SITE_URL="https://staging.ai-marketplace.com"
                ;;
            development)
                FIREBASE_PROJECT="ai-marketplace-dev"
                SITE_URL="https://dev.ai-marketplace.com"
                ;;
        esac
        
        HEALTH_CHECK_URL="$SITE_URL/api/health"
    fi
}

# Pre-deployment checks
run_pre_deployment_checks() {
    log "INFO" "Running pre-deployment checks..."
    
    # Check Firebase authentication
    if ! firebase projects:list --token="$FIREBASE_TOKEN" &>/dev/null; then
        log "ERROR" "Firebase authentication failed"
        exit 1
    fi
    
    # Verify Firebase project exists
    if ! firebase projects:list --token="$FIREBASE_TOKEN" | grep -q "$FIREBASE_PROJECT"; then
        log "ERROR" "Firebase project not found: $FIREBASE_PROJECT"
        exit 1
    fi
    
    # Check current deployment status
    local current_version=""
    if current_version=$(firebase hosting:releases:list --project="$FIREBASE_PROJECT" --limit=1 --token="$FIREBASE_TOKEN" | tail -n1 | awk '{print $1}' 2>/dev/null); then
        log "INFO" "Current deployment version: $current_version"
        echo "$current_version" > "$PROJECT_ROOT/tmp/previous_version.txt"
    fi
    
    log "SUCCESS" "Pre-deployment checks passed"
}

# Install dependencies
install_dependencies() {
    log "INFO" "Installing dependencies..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would install dependencies with: npm ci"
        return 0
    fi
    
    npm ci --silent
    
    log "SUCCESS" "Dependencies installed successfully"
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log "WARNING" "Skipping tests as requested"
        return 0
    fi
    
    log "INFO" "Running test suite..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would run tests with: npm test"
        return 0
    fi
    
    # Run unit tests
    log "INFO" "Running unit tests..."
    npm run test:unit
    
    # Run integration tests
    log "INFO" "Running integration tests..."
    npm run test:integration
    
    # Run security tests
    log "INFO" "Running security tests..."
    npm run test:security || log "WARNING" "Security tests completed with warnings"
    
    log "SUCCESS" "All tests passed"
}

# Build application
build_application() {
    log "INFO" "Building application for $ENVIRONMENT..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables for build
    export NODE_ENV="production"
    export NEXT_PUBLIC_FIREBASE_PROJECT_ID="$FIREBASE_PROJECT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would build with: npm run build"
        return 0
    fi
    
    npm run build
    
    # Verify build output
    if [[ ! -d "$PROJECT_ROOT/out" && ! -d "$PROJECT_ROOT/.next" ]]; then
        log "ERROR" "Build output not found"
        exit 1
    fi
    
    log "SUCCESS" "Application built successfully"
}

# Deploy to Firebase
deploy_to_firebase() {
    log "INFO" "Deploying to Firebase ($ENVIRONMENT)..."
    
    cd "$PROJECT_ROOT"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would deploy to Firebase project: $FIREBASE_PROJECT"
        log "INFO" "DRY RUN: Would deploy firestore rules, storage rules, and hosting"
        return 0
    fi
    
    # Deploy Firestore rules and indexes
    log "INFO" "Deploying Firestore rules and indexes..."
    firebase deploy --only firestore:rules,firestore:indexes --project="$FIREBASE_PROJECT" --token="$FIREBASE_TOKEN"
    
    # Deploy Storage rules
    log "INFO" "Deploying Storage rules..."
    firebase deploy --only storage:rules --project="$FIREBASE_PROJECT" --token="$FIREBASE_TOKEN"
    
    # Deploy hosting
    log "INFO" "Deploying hosting..."
    firebase deploy --only hosting --project="$FIREBASE_PROJECT" --token="$FIREBASE_TOKEN"
    
    # Get deployment URL
    DEPLOYMENT_URL=$(firebase hosting:releases:list --project="$FIREBASE_PROJECT" --limit=1 --token="$FIREBASE_TOKEN" | tail -n1 | awk '{print $3}')
    
    log "SUCCESS" "Deployment completed successfully"
    log "INFO" "Deployment URL: $DEPLOYMENT_URL"
    
    # Save deployment info
    cat > "$PROJECT_ROOT/tmp/deployment_info.json" << EOF
{
    "environment": "$ENVIRONMENT",
    "firebase_project": "$FIREBASE_PROJECT",
    "deployment_url": "$DEPLOYMENT_URL",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "git_commit": "$(git rev-parse HEAD)",
    "git_branch": "$(git rev-parse --abbrev-ref HEAD)"
}
EOF
}

# Run health checks
run_health_checks() {
    log "INFO" "Running post-deployment health checks..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would perform health checks against: $HEALTH_CHECK_URL"
        return 0
    fi
    
    # Wait for deployment to propagate
    log "INFO" "Waiting for deployment to propagate..."
    sleep 30
    
    # Basic connectivity check
    local attempts=0
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / 10))
    
    while [[ $attempts -lt $max_attempts ]]; do
        log "INFO" "Health check attempt $((attempts + 1))/$max_attempts..."
        
        if curl -f -s -m 10 "$HEALTH_CHECK_URL" >/dev/null; then
            log "SUCCESS" "Health check passed"
            break
        fi
        
        attempts=$((attempts + 1))
        if [[ $attempts -lt $max_attempts ]]; then
            log "WARNING" "Health check failed, retrying in 10 seconds..."
            sleep 10
        fi
    done
    
    if [[ $attempts -eq $max_attempts ]]; then
        log "ERROR" "Health checks failed after $max_attempts attempts"
        exit 1
    fi
    
    # Run smoke tests
    log "INFO" "Running smoke tests..."
    "$SCRIPT_DIR/health-check.sh" --url="$SITE_URL" --timeout=60
    
    log "SUCCESS" "Post-deployment health checks passed"
}

# Send notifications
send_notifications() {
    local status=$1
    local message=$2
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would send notification: $message"
        return 0
    fi
    
    log "INFO" "Sending deployment notifications..."
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local emoji=""
        case $status in
            success) emoji="✅" ;;
            failure) emoji="❌" ;;
            warning) emoji="⚠️" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$emoji **$ENVIRONMENT Deployment** $message\"}" \
            "$SLACK_WEBHOOK_URL" || log "WARNING" "Failed to send Slack notification"
    fi
    
    # GitHub deployment status
    if [[ -n "${GITHUB_TOKEN:-}" && -n "${GITHUB_REPOSITORY:-}" ]]; then
        local state=""
        case $status in
            success) state="success" ;;
            failure) state="failure" ;;
            warning) state="error" ;;
        esac
        
        curl -X POST \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Content-Type: application/json" \
            "https://api.github.com/repos/$GITHUB_REPOSITORY/deployments" \
            -d "{
                \"ref\": \"$(git rev-parse HEAD)\",
                \"environment\": \"$ENVIRONMENT\",
                \"state\": \"$state\",
                \"description\": \"$message\"
            }" || log "WARNING" "Failed to update GitHub deployment status"
    fi
    
    log "SUCCESS" "Notifications sent"
}

# Main deployment flow
main() {
    log "INFO" "Starting AI Marketplace deployment process..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Dry run: $DRY_RUN"
    
    # Create temporary directory
    mkdir -p "$PROJECT_ROOT/tmp"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Validate prerequisites
    validate_prerequisites
    
    # Load deployment configuration
    load_deployment_config
    
    # Pre-deployment checks
    run_pre_deployment_checks
    
    # Install dependencies
    install_dependencies
    
    # Run tests
    run_tests
    
    # Build application
    build_application
    
    # Deploy to Firebase
    deploy_to_firebase
    
    # Health checks
    run_health_checks
    
    # Success notification
    send_notifications "success" "Deployment completed successfully! 🚀"
    
    log "SUCCESS" "Deployment process completed successfully!"
    log "INFO" "Deployment URL: $SITE_URL"
    log "INFO" "Log file: $LOG_FILE"
    
    # Cleanup
    cleanup
}

# Run main function with all arguments
main "$@"