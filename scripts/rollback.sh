#!/bin/bash

# AI Marketplace Rollback Script
# Performs safe rollback to previous deployment with validation and monitoring

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/rollback-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
DRY_RUN=false
TARGET_VERSION=""
REASON=""
FORCE_ROLLBACK=false
SKIP_HEALTH_CHECK=false
HEALTH_CHECK_TIMEOUT=180

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
    
    log "ERROR" "Rollback failed at line $line_number with exit code $exit_code"
    
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
}

# Usage information
show_usage() {
    cat << EOF
AI Marketplace Rollback Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -e, --environment ENVIRONMENT    Target environment (development|staging|production) [default: development]
    -v, --version VERSION           Specific version to rollback to (default: previous release)
    -r, --reason REASON             Reason for rollback (for logging and notifications)
    -d, --dry-run                   Show what would be rolled back without executing
    -f, --force                     Force rollback without confirmation prompts
    -s, --skip-health-check         Skip post-rollback health checks
    -t, --timeout SECONDS          Health check timeout in seconds [default: 180]
    -h, --help                      Show this help message

EXAMPLES:
    $0 --environment=staging --reason="critical_bug_fix"
    $0 --environment=production --version="v1.2.3" --reason="performance_regression"
    $0 --environment=production --dry-run

ENVIRONMENT VARIABLES:
    FIREBASE_TOKEN                  Firebase authentication token
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
            -v|--version)
                TARGET_VERSION="$2"
                shift 2
                ;;
            -r|--reason)
                REASON="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE_ROLLBACK=true
                shift
                ;;
            -s|--skip-health-check)
                SKIP_HEALTH_CHECK=true
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

# Set environment configuration
set_environment_config() {
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
    
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Firebase project: $FIREBASE_PROJECT"
    log "INFO" "Site URL: $SITE_URL"
}

# Validate prerequisites
validate_prerequisites() {
    log "INFO" "Validating rollback prerequisites..."
    
    # Check required tools
    local required_tools=("firebase" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check environment variables
    if [[ -z "${FIREBASE_TOKEN:-}" ]]; then
        log "ERROR" "FIREBASE_TOKEN environment variable is required"
        exit 1
    fi
    
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
    
    log "SUCCESS" "Prerequisites validation passed"
}

# Get deployment history
get_deployment_history() {
    log "INFO" "Retrieving deployment history..."
    
    mkdir -p "$PROJECT_ROOT/tmp"
    
    # Get Firebase hosting releases
    firebase hosting:releases:list \
        --project="$FIREBASE_PROJECT" \
        --token="$FIREBASE_TOKEN" \
        --limit=10 \
        --json > "$PROJECT_ROOT/tmp/releases.json"
    
    if [[ ! -s "$PROJECT_ROOT/tmp/releases.json" ]]; then
        log "ERROR" "Failed to retrieve deployment history"
        exit 1
    fi
    
    # Parse releases
    local current_release=$(jq -r '.[0].name' "$PROJECT_ROOT/tmp/releases.json")
    local previous_release=$(jq -r '.[1].name // empty' "$PROJECT_ROOT/tmp/releases.json")
    
    log "INFO" "Current release: $current_release"
    log "INFO" "Previous release: $previous_release"
    
    # Set target version if not specified
    if [[ -z "$TARGET_VERSION" ]]; then
        if [[ -z "$previous_release" || "$previous_release" == "null" ]]; then
            log "ERROR" "No previous release found to rollback to"
            exit 1
        fi
        TARGET_VERSION="$previous_release"
        log "INFO" "Target rollback version: $TARGET_VERSION"
    fi
    
    # Validate target version exists
    if ! jq -e --arg version "$TARGET_VERSION" '.[] | select(.name == $version)' "$PROJECT_ROOT/tmp/releases.json" >/dev/null; then
        log "ERROR" "Target version not found in deployment history: $TARGET_VERSION"
        exit 1
    fi
    
    # Get target version details
    jq --arg version "$TARGET_VERSION" '.[] | select(.name == $version)' "$PROJECT_ROOT/tmp/releases.json" > "$PROJECT_ROOT/tmp/target_version.json"
    
    local target_date=$(jq -r '.version.createTime' "$PROJECT_ROOT/tmp/target_version.json")
    log "INFO" "Target version created: $target_date"
}

# Validate rollback safety
validate_rollback_safety() {
    log "INFO" "Validating rollback safety..."
    
    # Check if target version is too old
    local target_timestamp=$(jq -r '.version.createTime' "$PROJECT_ROOT/tmp/target_version.json")
    local target_epoch=$(date -d "$target_timestamp" +%s)
    local current_epoch=$(date +%s)
    local age_hours=$(( (current_epoch - target_epoch) / 3600 ))
    
    log "INFO" "Target version age: $age_hours hours"
    
    if [[ $age_hours -gt 168 ]]; then # 7 days
        log "WARNING" "Target version is older than 7 days"
        if [[ "$FORCE_ROLLBACK" != "true" ]]; then
            log "ERROR" "Refusing to rollback to version older than 7 days without --force flag"
            exit 1
        fi
    fi
    
    # Check current application status
    log "INFO" "Checking current application status..."
    
    local current_status=""
    if current_status=$(curl -sf --max-time 10 "$HEALTH_CHECK_URL" | jq -r '.status // "unknown"' 2>/dev/null); then
        log "INFO" "Current application status: $current_status"
        
        if [[ "$current_status" == "healthy" && "$FORCE_ROLLBACK" != "true" ]]; then
            read -p "Current application appears healthy. Continue with rollback? [y/N]: " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "INFO" "Rollback cancelled by user"
                exit 0
            fi
        fi
    else
        log "WARNING" "Unable to determine current application status"
    fi
    
    log "SUCCESS" "Rollback safety validation passed"
}

# Create rollback point
create_rollback_point() {
    log "INFO" "Creating rollback point..."
    
    # Get current release info
    local current_release=$(jq -r '.[0]' "$PROJECT_ROOT/tmp/releases.json")
    
    # Save current state
    cat > "$PROJECT_ROOT/tmp/rollback_point.json" << EOF
{
    "rollback_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "reason": "$REASON",
    "environment": "$ENVIRONMENT",
    "firebase_project": "$FIREBASE_PROJECT",
    "current_release": $current_release,
    "target_version": "$TARGET_VERSION",
    "initiated_by": "${USER:-unknown}",
    "dry_run": $DRY_RUN
}
EOF
    
    log "SUCCESS" "Rollback point created"
}

# Perform rollback
perform_rollback() {
    log "INFO" "Performing rollback to version: $TARGET_VERSION"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would rollback hosting to version: $TARGET_VERSION"
        log "INFO" "DRY RUN: Would clone release $TARGET_VERSION to live channel"
        return 0
    fi
    
    # Clone the target version to live channel
    log "INFO" "Cloning version $TARGET_VERSION to live channel..."
    
    firebase hosting:clone \
        "$TARGET_VERSION:live" \
        live \
        --project="$FIREBASE_PROJECT" \
        --token="$FIREBASE_TOKEN"
    
    log "SUCCESS" "Rollback completed successfully"
    
    # Wait for propagation
    log "INFO" "Waiting for rollback to propagate..."
    sleep 30
}

# Run post-rollback health checks
run_health_checks() {
    if [[ "$SKIP_HEALTH_CHECK" == "true" ]]; then
        log "WARNING" "Skipping health checks as requested"
        return 0
    fi
    
    log "INFO" "Running post-rollback health checks..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would perform health checks against: $HEALTH_CHECK_URL"
        return 0
    fi
    
    local attempts=0
    local max_attempts=$((HEALTH_CHECK_TIMEOUT / 10))
    local health_check_passed=false
    
    while [[ $attempts -lt $max_attempts ]]; do
        log "INFO" "Health check attempt $((attempts + 1))/$max_attempts..."
        
        # Basic connectivity check
        if curl -f -s -m 10 "$HEALTH_CHECK_URL" >/dev/null; then
            log "INFO" "Basic connectivity check passed"
            
            # Detailed health check
            local health_response=""
            if health_response=$(curl -s -m 10 "$HEALTH_CHECK_URL" | jq -r '.status // "unknown"' 2>/dev/null); then
                if [[ "$health_response" == "healthy" ]]; then
                    health_check_passed=true
                    break
                else
                    log "WARNING" "Health check returned status: $health_response"
                fi
            else
                log "WARNING" "Unable to parse health check response"
            fi
        else
            log "WARNING" "Basic connectivity check failed"
        fi
        
        attempts=$((attempts + 1))
        if [[ $attempts -lt $max_attempts ]]; then
            log "INFO" "Retrying in 10 seconds..."
            sleep 10
        fi
    done
    
    if [[ "$health_check_passed" == "true" ]]; then
        log "SUCCESS" "Post-rollback health checks passed"
    else
        log "ERROR" "Post-rollback health checks failed after $max_attempts attempts"
        exit 1
    fi
    
    # Run additional smoke tests if available
    if [[ -f "$SCRIPT_DIR/health-check.sh" ]]; then
        log "INFO" "Running additional smoke tests..."
        "$SCRIPT_DIR/health-check.sh" --url="$SITE_URL" --timeout=60 || log "WARNING" "Some smoke tests failed"
    fi
}

# Log rollback event
log_rollback_event() {
    log "INFO" "Logging rollback event..."
    
    local rollback_log="$PROJECT_ROOT/logs/rollback_history.json"
    mkdir -p "$(dirname "$rollback_log")"
    
    # Initialize log file if it doesn't exist
    if [[ ! -f "$rollback_log" ]]; then
        echo "[]" > "$rollback_log"
    fi
    
    # Create rollback event
    local rollback_event=$(cat << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "environment": "$ENVIRONMENT",
    "target_version": "$TARGET_VERSION",
    "reason": "$REASON",
    "initiated_by": "${USER:-unknown}",
    "dry_run": $DRY_RUN,
    "success": true,
    "log_file": "$LOG_FILE"
}
EOF
)
    
    # Add to rollback history
    jq ". += [$rollback_event]" "$rollback_log" > "$rollback_log.tmp" && mv "$rollback_log.tmp" "$rollback_log"
    
    log "SUCCESS" "Rollback event logged"
}

# Send notifications
send_notifications() {
    local status=$1
    local message=$2
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "INFO" "DRY RUN: Would send notification: $message"
        return 0
    fi
    
    log "INFO" "Sending rollback notifications..."
    
    # Slack notification
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local emoji=""
        case $status in
            success) emoji="🔄" ;;
            failure) emoji="❌" ;;
        esac
        
        local notification_text="$emoji **ROLLBACK - $ENVIRONMENT**\n$message\n"
        if [[ -n "$REASON" ]]; then
            notification_text+="Reason: $REASON\n"
        fi
        notification_text+="Version: $TARGET_VERSION"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$notification_text\"}" \
            "$SLACK_WEBHOOK_URL" || log "WARNING" "Failed to send Slack notification"
    fi
    
    # GitHub issue comment (if rollback was due to deployment failure)
    if [[ -n "${GITHUB_TOKEN:-}" && -n "${GITHUB_REPOSITORY:-}" && "$REASON" == "deployment_failure" ]]; then
        log "INFO" "Creating GitHub issue for rollback..."
        
        curl -X POST \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Content-Type: application/json" \
            "https://api.github.com/repos/$GITHUB_REPOSITORY/issues" \
            -d "{
                \"title\": \"Automatic rollback performed on $ENVIRONMENT\",
                \"body\": \"**Rollback Details**\\n\\n- Environment: $ENVIRONMENT\\n- Target Version: $TARGET_VERSION\\n- Reason: $REASON\\n- Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)\\n\\n$message\",
                \"labels\": [\"rollback\", \"$ENVIRONMENT\", \"urgent\"]
            }" || log "WARNING" "Failed to create GitHub issue"
    fi
    
    log "SUCCESS" "Notifications sent"
}

# Main rollback flow
main() {
    log "INFO" "Starting AI Marketplace rollback process..."
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Dry run: $DRY_RUN"
    if [[ -n "$REASON" ]]; then
        log "INFO" "Reason: $REASON"
    fi
    
    # Create temporary directory
    mkdir -p "$PROJECT_ROOT/tmp"
    
    # Parse arguments
    parse_arguments "$@"
    
    # Set environment configuration
    set_environment_config
    
    # Validate prerequisites
    validate_prerequisites
    
    # Get deployment history
    get_deployment_history
    
    # Validate rollback safety
    validate_rollback_safety
    
    # Create rollback point
    create_rollback_point
    
    # Perform rollback
    perform_rollback
    
    # Run health checks
    run_health_checks
    
    # Log rollback event
    log_rollback_event
    
    # Send notifications
    send_notifications "success" "Rollback completed successfully"
    
    log "SUCCESS" "Rollback process completed successfully!"
    log "INFO" "Rolled back to version: $TARGET_VERSION"
    log "INFO" "Site URL: $SITE_URL"
    log "INFO" "Log file: $LOG_FILE"
    
    # Cleanup
    cleanup
}

# Run main function with all arguments
main "$@"