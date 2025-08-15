#!/bin/bash

# AI Marketplace Health Check Script
# Comprehensive health validation for post-deployment verification

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/health-check-$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BASE_URL=""
TIMEOUT=60
VERBOSE=false
REPORT_FILE=""
CHECK_TYPES="all"
RETRIES=3
RETRY_DELAY=5

# Health check results
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

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

# Usage information
show_usage() {
    cat << EOF
AI Marketplace Health Check Script

USAGE:
    $0 --url=URL [OPTIONS]

OPTIONS:
    --url=URL                       Base URL to check (required)
    --timeout=SECONDS              Request timeout in seconds [default: 60]
    --verbose                       Enable verbose output
    --report=FILE                   Generate JSON report file
    --checks=TYPE                   Types of checks to run (all|basic|full|smoke) [default: all]
    --retries=COUNT                Number of retries for failed checks [default: 3]
    --retry-delay=SECONDS          Delay between retries [default: 5]
    -h, --help                     Show this help message

EXAMPLES:
    $0 --url=https://ai-marketplace.com
    $0 --url=https://staging.ai-marketplace.com --checks=basic --report=health-report.json
    $0 --url=http://localhost:3000 --checks=smoke --verbose

HEALTH CHECK TYPES:
    basic    - Basic connectivity and essential API endpoints
    smoke    - Critical user paths and core functionality
    full     - Comprehensive testing including performance and security
    all      - All available health checks

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --url=*)
                BASE_URL="${1#*=}"
                shift
                ;;
            --timeout=*)
                TIMEOUT="${1#*=}"
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --report=*)
                REPORT_FILE="${1#*=}"
                shift
                ;;
            --checks=*)
                CHECK_TYPES="${1#*=}"
                shift
                ;;
            --retries=*)
                RETRIES="${1#*=}"
                shift
                ;;
            --retry-delay=*)
                RETRY_DELAY="${1#*=}"
                shift
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
    
    # Validate required arguments
    if [[ -z "$BASE_URL" ]]; then
        log "ERROR" "Base URL is required. Use --url=URL"
        show_usage
        exit 1
    fi
    
    # Validate check types
    if [[ ! "$CHECK_TYPES" =~ ^(basic|smoke|full|all)$ ]]; then
        log "ERROR" "Invalid check type: $CHECK_TYPES"
        exit 1
    fi
}

# Execute health check with retries
execute_check() {
    local check_name=$1
    local check_function=$2
    local is_critical=${3:-true}
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    log "INFO" "Running check: $check_name"
    
    local attempt=1
    local success=false
    
    while [[ $attempt -le $RETRIES ]]; do
        if [[ $attempt -gt 1 ]]; then
            log "INFO" "Retry attempt $attempt/$RETRIES for: $check_name"
            sleep $RETRY_DELAY
        fi
        
        if $check_function; then
            success=true
            break
        fi
        
        attempt=$((attempt + 1))
    done
    
    if [[ "$success" == "true" ]]; then
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        log "SUCCESS" "✅ $check_name"
        return 0
    else
        if [[ "$is_critical" == "true" ]]; then
            FAILED_CHECKS=$((FAILED_CHECKS + 1))
            log "ERROR" "❌ $check_name (Critical)"
            return 1
        else
            WARNING_CHECKS=$((WARNING_CHECKS + 1))
            log "WARNING" "⚠️ $check_name (Non-critical)"
            return 2
        fi
    fi
}

# Basic connectivity checks
check_homepage() {
    local response_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time $TIMEOUT "$BASE_URL" || echo "000")
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time $TIMEOUT "$BASE_URL" || echo "999")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Homepage response: $response_code (${response_time}s)"
    fi
    
    [[ "$response_code" == "200" ]] && (( $(echo "$response_time < 5.0" | bc -l) ))
}

check_api_health() {
    local health_url="$BASE_URL/api/health"
    local response=$(curl -s --max-time $TIMEOUT "$health_url" || echo "")
    
    if [[ -z "$response" ]]; then
        return 1
    fi
    
    local status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null || echo "unknown")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "API health status: $status"
    fi
    
    [[ "$status" == "healthy" ]]
}

check_api_version() {
    local version_url="$BASE_URL/api/version"
    local response=$(curl -s --max-time $TIMEOUT "$version_url" || echo "")
    
    if [[ -z "$response" ]]; then
        return 1
    fi
    
    local version=$(echo "$response" | jq -r '.version // "unknown"' 2>/dev/null || echo "unknown")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "API version: $version"
    fi
    
    [[ "$version" != "unknown" && "$version" != "null" ]]
}

# Database connectivity checks
check_database_connection() {
    local db_health_url="$BASE_URL/api/health/database"
    local response=$(curl -s --max-time $TIMEOUT "$db_health_url" || echo "")
    
    if [[ -z "$response" ]]; then
        return 1
    fi
    
    local db_status=$(echo "$response" | jq -r '.database.status // "unknown"' 2>/dev/null || echo "unknown")
    local response_time=$(echo "$response" | jq -r '.database.response_time // "999"' 2>/dev/null || echo "999")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Database status: $db_status (${response_time}ms)"
    fi
    
    [[ "$db_status" == "connected" ]] && (( $(echo "$response_time < 100" | bc -l) ))
}

check_firestore_rules() {
    local rules_test_url="$BASE_URL/api/health/firestore-rules"
    local response_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time $TIMEOUT "$rules_test_url" || echo "000")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Firestore rules test response: $response_code"
    fi
    
    [[ "$response_code" == "200" ]]
}

# Authentication checks
check_auth_endpoint() {
    local auth_url="$BASE_URL/api/auth/validate"
    local response_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time $TIMEOUT "$auth_url" || echo "000")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Auth endpoint response: $response_code"
    fi
    
    # Should return 401 for unauthenticated requests
    [[ "$response_code" == "401" ]]
}

check_clerk_integration() {
    local clerk_health_url="$BASE_URL/api/auth/clerk/health"
    local response_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time $TIMEOUT "$clerk_health_url" || echo "000")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Clerk integration response: $response_code"
    fi
    
    [[ "$response_code" == "200" ]]
}

# Security checks
check_security_headers() {
    local headers=$(curl -I -s --max-time $TIMEOUT "$BASE_URL" || echo "")
    
    local has_hsts=$(echo "$headers" | grep -i "strict-transport-security" | wc -l)
    local has_cto=$(echo "$headers" | grep -i "x-content-type-options" | wc -l)
    local has_frame_options=$(echo "$headers" | grep -i "x-frame-options" | wc -l)
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Security headers - HSTS: $has_hsts, CTO: $has_cto, Frame: $has_frame_options"
    fi
    
    [[ $has_hsts -gt 0 && $has_cto -gt 0 && $has_frame_options -gt 0 ]]
}

check_ssl_certificate() {
    if [[ ! "$BASE_URL" =~ ^https:// ]]; then
        log "INFO" "Skipping SSL check for non-HTTPS URL"
        return 0
    fi
    
    local domain=$(echo "$BASE_URL" | sed 's|https://||' | sed 's|/.*||')
    local cert_info=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null || echo "")
    
    if [[ -z "$cert_info" ]]; then
        return 1
    fi
    
    local expiry_date=$(echo "$cert_info" | sed 's/notAfter=//')
    local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
    local current_epoch=$(date +%s)
    local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "SSL certificate expires in $days_until_expiry days"
    fi
    
    [[ $days_until_expiry -gt 30 ]]
}

# Performance checks
check_page_load_time() {
    local load_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time $TIMEOUT "$BASE_URL" || echo "999")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Page load time: ${load_time}s"
    fi
    
    (( $(echo "$load_time < 3.0" | bc -l) ))
}

check_api_response_time() {
    local api_url="$BASE_URL/api/health"
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" --max-time $TIMEOUT "$api_url" || echo "999")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "API response time: ${response_time}s"
    fi
    
    (( $(echo "$response_time < 1.0" | bc -l) ))
}

# Application-specific checks
check_categories_endpoint() {
    local categories_url="$BASE_URL/api/v1/categories"
    local response=$(curl -s --max-time $TIMEOUT "$categories_url" || echo "")
    
    if [[ -z "$response" ]]; then
        return 1
    fi
    
    local categories_count=$(echo "$response" | jq '. | length' 2>/dev/null || echo "0")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Categories count: $categories_count"
    fi
    
    [[ $categories_count -gt 0 ]]
}

check_search_functionality() {
    local search_url="$BASE_URL/api/v1/search?q=test"
    local response_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time $TIMEOUT "$search_url" || echo "000")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Search endpoint response: $response_code"
    fi
    
    [[ "$response_code" == "200" ]]
}

# Storage checks
check_file_upload_endpoint() {
    local upload_url="$BASE_URL/api/v1/upload/test"
    local response_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time $TIMEOUT -X POST "$upload_url" || echo "000")
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Upload endpoint response: $response_code"
    fi
    
    # Should return 401 for unauthenticated requests
    [[ "$response_code" == "401" ]]
}

# Analytics checks
check_analytics_tracking() {
    local homepage_content=$(curl -s --max-time $TIMEOUT "$BASE_URL" || echo "")
    
    local has_ga=$(echo "$homepage_content" | grep -i "google.*analytics\|gtag\|GA_TRACKING_ID" | wc -l)
    
    if [[ "$VERBOSE" == "true" ]]; then
        log "INFO" "Analytics tracking found: $has_ga"
    fi
    
    [[ $has_ga -gt 0 ]]
}

# Generate health check report
generate_report() {
    if [[ -z "$REPORT_FILE" ]]; then
        return 0
    fi
    
    log "INFO" "Generating health check report: $REPORT_FILE"
    
    local overall_status="healthy"
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        overall_status="unhealthy"
    elif [[ $WARNING_CHECKS -gt 0 ]]; then
        overall_status="degraded"
    fi
    
    cat > "$REPORT_FILE" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "base_url": "$BASE_URL",
    "check_types": "$CHECK_TYPES",
    "overall_status": "$overall_status",
    "summary": {
        "total_checks": $TOTAL_CHECKS,
        "passed_checks": $PASSED_CHECKS,
        "failed_checks": $FAILED_CHECKS,
        "warning_checks": $WARNING_CHECKS,
        "success_rate": $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))
    },
    "configuration": {
        "timeout": $TIMEOUT,
        "retries": $RETRIES,
        "retry_delay": $RETRY_DELAY
    },
    "log_file": "$LOG_FILE"
}
EOF
    
    log "SUCCESS" "Health check report generated: $REPORT_FILE"
}

# Main health check execution
run_health_checks() {
    log "INFO" "Starting health checks for: $BASE_URL"
    log "INFO" "Check types: $CHECK_TYPES"
    log "INFO" "Timeout: ${TIMEOUT}s, Retries: $RETRIES"
    
    # Initialize counters
    TOTAL_CHECKS=0
    PASSED_CHECKS=0
    FAILED_CHECKS=0
    WARNING_CHECKS=0
    
    # Basic checks (always run)
    execute_check "Homepage accessibility" check_homepage true
    execute_check "API health endpoint" check_api_health true
    
    if [[ "$CHECK_TYPES" == "basic" ]]; then
        log "INFO" "Basic health checks completed"
        return 0
    fi
    
    # Smoke tests
    execute_check "API version endpoint" check_api_version true
    execute_check "Database connection" check_database_connection true
    execute_check "Authentication endpoint" check_auth_endpoint true
    
    if [[ "$CHECK_TYPES" == "smoke" ]]; then
        log "INFO" "Smoke tests completed"
        return 0
    fi
    
    # Full checks
    execute_check "Firestore rules" check_firestore_rules false
    execute_check "Clerk integration" check_clerk_integration false
    execute_check "Security headers" check_security_headers false
    execute_check "SSL certificate" check_ssl_certificate false
    execute_check "Page load performance" check_page_load_time false
    execute_check "API response time" check_api_response_time false
    execute_check "Categories endpoint" check_categories_endpoint false
    execute_check "Search functionality" check_search_functionality false
    execute_check "File upload endpoint" check_file_upload_endpoint false
    execute_check "Analytics tracking" check_analytics_tracking false
    
    if [[ "$CHECK_TYPES" == "full" || "$CHECK_TYPES" == "all" ]]; then
        log "INFO" "Full health checks completed"
    fi
}

# Display results summary
display_summary() {
    log "INFO" "Health Check Summary:"
    log "INFO" "===================="
    log "INFO" "Total checks: $TOTAL_CHECKS"
    log "SUCCESS" "Passed: $PASSED_CHECKS"
    log "WARNING" "Warnings: $WARNING_CHECKS"
    log "ERROR" "Failed: $FAILED_CHECKS"
    
    local success_rate=0
    if [[ $TOTAL_CHECKS -gt 0 ]]; then
        success_rate=$(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))
    fi
    log "INFO" "Success rate: ${success_rate}%"
    
    # Overall status
    if [[ $FAILED_CHECKS -eq 0 && $WARNING_CHECKS -eq 0 ]]; then
        log "SUCCESS" "Overall status: HEALTHY ✅"
        return 0
    elif [[ $FAILED_CHECKS -eq 0 ]]; then
        log "WARNING" "Overall status: DEGRADED ⚠️"
        return 1
    else
        log "ERROR" "Overall status: UNHEALTHY ❌"
        return 2
    fi
}

# Main execution function
main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    log "INFO" "AI Marketplace Health Check Script"
    log "INFO" "=================================="
    
    # Run health checks
    run_health_checks
    
    # Generate report
    generate_report
    
    # Display summary and exit with appropriate code
    display_summary
}

# Run main function with all arguments
main "$@"