#!/bin/bash

# Script to validate commit messages according to project conventions
# Usage: ./validate-commit-name.sh <commit-message>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}🔍 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] <commit-message>"
    echo ""
    echo "Options:"
    echo "  --multiple    Validate multiple commit messages (one per line from stdin)"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  # Single commit validation"
    echo "  $0 \"PROJ-123: feat(auth): add user authentication\""
    echo "  $0 \"BUG-456: fix(login): resolve password validation\""
    echo "  $0 \"FEAT-789: docs(readme): update installation guide\""
    echo ""
    echo "  # Multiple commits validation"
    echo "  git log --pretty=format:'%s' HEAD~5..HEAD | $0 --multiple"
    echo "  echo -e \"PROJ-123: feat: first commit\\nPROJ-124: fix: second commit\" | $0 --multiple"
    echo ""
    echo "Valid commit message format:"
    echo "  <jira-key>-<number>: type(scope): message"
    echo "  <jira-key>-<number>: type: message (scope is optional)"
    echo ""
    echo "Valid types:"
    echo "  bugfix, feature, hotfix, chore, fix, feat, docs, style,"
    echo "  refactor, perf, test, build, ci, revert"
    echo ""
    echo "Valid JIRA key format:"
    echo "  - Must be uppercase letters followed by hyphen and numbers"
    echo "  - Examples: PROJ-123, BUG-456, FEAT-789"
    echo ""
    echo "Scope format (optional):"
    echo "  - Letters, numbers, underscores, and hyphens only"
    echo "  - Examples: (auth), (user-service), (ui_components)"
    echo "  - Can be omitted: PROJ-123: feat: add new feature"
}


# Function to validate merge commits
validate_merge_commit() {
    local commit_message="$1"
    local quiet_mode="$2"
    local merge_pattern="^Merge"
    
    if [[ "$commit_message" =~ $merge_pattern ]]; then
        if [[ "$quiet_mode" != "--quiet" ]]; then
            print_info "Skipping merge commit validation"
            print_success "Merge commit detected: $commit_message"
        fi
        return 0
    fi
    return 1
}

# Function to validate standard commit message format
validate_standard_commit() {
    local commit_message="$1"
    
    # Check the basic pattern first (without optional scope)
    local basic_pattern='^[A-Z]+-[0-9]+:\ (bugfix|feature|hotfix|chore|fix|feat|docs|style|refactor|perf|test|build|ci|revert):\ .+'
    local with_scope_pattern='^[A-Z]+-[0-9]+:\ (bugfix|feature|hotfix|chore|fix|feat|docs|style|refactor|perf|test|build|ci|revert)\([a-zA-Z0-9_-]+\):\ .+'
    
    if [[ "$commit_message" =~ $basic_pattern ]] || [[ "$commit_message" =~ $with_scope_pattern ]]; then
        return 0
    fi
    return 1
}

# Function to validate multiple commits from stdin
validate_multiple_commits() {
    local total_commits=0
    local valid_commits=0
    local invalid_commits=0
    local has_invalid=false
    
    print_info "Validating multiple commit messages"
    echo ""
    
    while IFS= read -r commit_message; do
        # Skip empty lines
        if [[ -z "$commit_message" ]]; then
            continue
        fi
        
        total_commits=$((total_commits + 1))
        
        if validate_commit_message "$commit_message" --quiet; then
            valid_commits=$((valid_commits + 1))
        else
            invalid_commits=$((invalid_commits + 1))
            has_invalid=true
        fi
        echo ""
    done
    
    # Summary
    echo "=========================="
    echo "VALIDATION SUMMARY"
    echo "=========================="
    echo "Total commits checked: $total_commits"
    print_success "Valid commits: $valid_commits"
    if [[ $invalid_commits -gt 0 ]]; then
        print_error "Invalid commits: $invalid_commits"
    else
        print_success "Invalid commits: $invalid_commits"
    fi
    echo ""
    
    if [[ "$has_invalid" == true ]]; then
        print_error "Some commit messages are invalid. Please fix them before proceeding."
        return 1
    else
        print_success "All commit messages are valid!"
        return 0
    fi
}

# Main validation function
validate_commit_message() {
    local commit_message="$1"
    local quiet_mode="$2"
    
    if [[ "$quiet_mode" != "--quiet" ]]; then
        print_info "Validating commit message: $commit_message"
    fi
    
    # First check if it's a merge commit (skip validation)
    if validate_merge_commit "$commit_message" "$quiet_mode"; then
        return 0
    fi
    
    # Then validate standard commit format
    if validate_standard_commit "$commit_message"; then
        if [[ "$quiet_mode" != "--quiet" ]]; then
            print_success "Commit message format is valid!"
            
            # Extract components for detailed feedback using different approach
            local jira_key=$(echo "$commit_message" | cut -d':' -f1)
            local rest_after_jira=$(echo "$commit_message" | cut -d':' -f2- | sed 's/^ *//')
            local type=$(echo "$rest_after_jira" | sed 's/(.*//' | sed 's/:.*//') 
            local scope=$(echo "$rest_after_jira" | sed -n 's/[^(]*(\([^)]*\)).*/\1/p')
            local message=$(echo "$commit_message" | sed 's/^[^:]*:[^:]*: *//')
            
            # If scope is empty, show "none"
            if [[ -z "$scope" ]]; then
                scope="none"
            fi
            
            echo ""
            echo "Commit components:"
            echo "  JIRA Key: $jira_key"
            echo "  Type: $type"
            echo "  Scope: $scope"
            echo "  Message: $message"
            echo "  Full: $commit_message"
        else
            print_success "$commit_message"
        fi
        return 0
    else
        if [[ "$quiet_mode" != "--quiet" ]]; then
            # Provide detailed error feedback
            print_error "Invalid commit message format!"
            echo ""
            echo "Current commit: $commit_message"
            echo ""
            echo "Expected format: <jira-key>-<number>: type(scope): message"
            echo "            or: <jira-key>-<number>: type: message (scope is optional)"
            echo ""
            
            # Analyze what's wrong using separate patterns
            local type_pattern=':\ (bugfix|feature|hotfix|chore|fix|feat|docs|style|refactor|perf|test|build|ci|revert)'
            
            if [[ ! "$commit_message" =~ ^[A-Z]+-[0-9]+: ]]; then
                print_warning "Missing or invalid JIRA key prefix."
                echo "           Expected format: UPPERCASE-NUMBER: (e.g., PROJ-123:)"
            elif [[ ! "$commit_message" =~ $type_pattern ]]; then
                local type_part=$(echo "$commit_message" | sed -n 's/^[A-Z]\+-[0-9]\+: \([^(:]*\).*/\1/p')
                print_warning "Invalid or missing commit type '$type_part'."
                echo "           Valid types: bugfix, feature, hotfix, chore, fix, feat,"
                echo "                        docs, style, refactor, perf, test, build, ci, revert"
            elif [[ "$commit_message" =~ \\([^)]*$ ]]; then
                print_warning "Unclosed scope parenthesis."
                echo "           Expected format: (scope) or no scope at all"
            elif [[ ! "$commit_message" =~ :\ .+$ ]]; then
                print_warning "Missing or empty commit message after type/scope."
                echo "           Expected format: : <descriptive message>"
            else
                print_warning "Unknown validation error. Please check the complete format."
            fi
            
            echo ""
            echo "Valid examples:"
            echo "  PROJ-123: feat(auth): add user authentication system"
            echo "  PROJ-123: feat: add user authentication system"
            echo "  BUG-456: fix(login): resolve password validation issue"
            echo "  BUG-456: fix: resolve password validation issue"
            echo "  DOCS-789: docs(readme): update installation instructions"
            echo "  PERF-101: perf: optimize database queries"
        else
            print_error "$commit_message"
        fi
        
        return 1
    fi
}

# Check for help flag
COMMIT_MESSAGE="$1"
if [[ "$COMMIT_MESSAGE" == "-h" || "$COMMIT_MESSAGE" == "--help" ]]; then
    show_usage
    exit 0
fi

# Check for multiple commits flag
if [[ "$COMMIT_MESSAGE" == "--multiple" ]]; then
    if validate_multiple_commits; then
        exit 0
    else
        exit 1
    fi
fi

# Check if commit message is provided for single validation
if [ $# -eq 0 ]; then
    print_error "No commit message provided"
    echo ""
    show_usage
    exit 1
fi

# Main execution
if validate_commit_message "$COMMIT_MESSAGE"; then
    exit 0
else
    exit 1
fi
