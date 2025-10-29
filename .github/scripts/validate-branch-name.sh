#!/bin/bash

# Script to validate branch names according to project conventions
# Usage: ./check-branch-name.sh <branch-name>

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
    echo "Usage: $0 <branch-name>"
    echo ""
    echo "Examples:"
    echo "  $0 develop"
    echo "  $0 staging"
    echo "  $0 main"
    echo "  $0 release/1.2.3"
    echo "  $0 feature/PROJ-123"
    echo "  $0 bugfix/BUG-456-login-fix"
    echo "  $0 hotfix/URGENT-789"
    echo ""
    echo "Valid branch formats:"
    echo "  1. Special branches: develop, staging, main"
    echo "  2. Release branches: release/X.Y.Z (version with 1-2 digits each)"
    echo "  3. Feature branches: <type>/<jira-key>-<number>(-<optional-description>)"
    echo ""
    echo "Valid types for feature branches:"
    echo "  bugfix, feature, hotfix, chore, fix, feat, docs, style,"
    echo "  refactor, perf, test, build, ci, revert"
    echo ""
    echo "Valid JIRA key format:"
    echo "  - Must be uppercase letters followed by hyphen and numbers"
    echo "  - Examples: PROJ-123, BUG-456, FEAT-789"
}

# Check if branch name is provided
if [ $# -eq 0 ]; then
    print_error "No branch name provided"
    echo ""
    show_usage
    exit 1
fi

# Function to validate special branches (develop, staging, main)
validate_special_branch() {
    local branch_name="$1"
    local special_pattern="^(develop|staging|main)$"
    
    if [[ "$branch_name" =~ $special_pattern ]]; then
        print_success "Special branch name is valid!"
        echo ""
        echo "Branch type: Special branch ($branch_name)"
        return 0
    fi
    return 1
}

# Function to validate release branches (release/X.Y.Z)
validate_release_branch() {
    local branch_name="$1"
    local release_pattern="^release/[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}$"
    
    if [[ "$branch_name" =~ $release_pattern ]]; then
        print_success "Release branch name is valid!"
        
        # Extract version for detailed feedback
        local version=$(echo "$branch_name" | cut -d'/' -f2)
        echo ""
        echo "Branch components:"
        echo "  Type: release"
        echo "  Version: $version"
        echo "  Full: $branch_name"
        return 0
    fi
    return 1
}

# Function to validate feature branches (type/JIRA-KEY-NUMBER)
validate_feature_branch() {
    local branch_name="$1"
    local feature_pattern="^(bugfix|feature|hotfix|chore|fix|feat|docs|style|refactor|perf|test|build|ci|revert)/[A-Z]+-[0-9]+(-[a-z0-9]+)*$"
    
    if [[ "$branch_name" =~ $feature_pattern ]]; then
        print_success "Feature branch name is valid!"
        
        # Extract components for detailed feedback
        local type=$(echo "$branch_name" | cut -d'/' -f1)
        local jira_part=$(echo "$branch_name" | cut -d'/' -f2)
        local jira_key=$(echo "$jira_part" | grep -o '^[A-Z]\+-[0-9]\+')
        
        echo ""
        echo "Branch components:"
        echo "  Type: $type"
        echo "  JIRA Key: $jira_key"
        echo "  Full: $branch_name"
        return 0
    fi
    return 1
}

# Main validation function
validate_branch_name() {
    local branch_name="$1"
    
    print_info "Checking branch name: $branch_name"
    
    # Try each validation type in order
    if validate_special_branch "$branch_name"; then
        return 0
    elif validate_release_branch "$branch_name"; then
        return 0
    elif validate_feature_branch "$branch_name"; then
        return 0
    else
        # None of the validations passed, show error
        print_error "Invalid branch name format!"
        echo ""
        echo "Current branch: $branch_name"
        echo ""
        echo "Expected formats:"
        echo "  1. Special branches: develop, staging, main"
        echo "  2. Release branches: release/X.Y.Z (e.g., release/1.2.3)"
        echo "  3. Feature branches: <type>/<jira-key>-<number>(-<optional-description>)"
        echo ""
   
        
        # Provide specific feedback on what's wrong
        if [[ "$branch_name" =~ ^release/ ]]; then
            if [[ ! "$branch_name" =~ ^release/[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{1,2}$ ]]; then
                local version_part=$(echo "$branch_name" | cut -d'/' -f2)
                print_warning "Invalid release version format '$version_part'."
                echo "           Expected format: X.Y.Z where X, Y, Z are 1-2 digits (e.g., 1.2.3, 12.34.56)"
            fi
        elif [[ ! "$branch_name" =~ / ]]; then
            if [[ ! "$branch_name" =~ ^(develop|staging|main)$ ]]; then
                print_warning "Invalid branch name. Must be one of the special branches or use slash separator"
                echo "           Special branches: develop, staging, main"
            fi
        elif [[ ! "$branch_name" =~ ^(bugfix|feature|hotfix|chore|fix|feat|docs|style|refactor|perf|test|build|ci|revert)/ ]]; then
            local type_part=$(echo "$branch_name" | cut -d'/' -f1)
            print_warning "Invalid type '$type_part'. Must be one of:"
            echo "           bugfix, feature, hotfix, chore, fix, feat, docs, style,"
            echo "           refactor, perf, test, build, ci, revert"
        elif [[ ! "$branch_name" =~ /[A-Z]+-[0-9]+ ]]; then
            local jira_part=$(echo "$branch_name" | cut -d'/' -f2)
            print_warning "Invalid JIRA key format '$jira_part'."
            echo "           Expected format: UPPERCASE-NUMBER (e.g., PROJ-123)"
        else
            print_warning "Unknown validation error. Please check the format."
        fi
        
        echo ""
        echo "Valid examples:"
        echo "  Special: develop, staging, main"
        echo "  Release: release/1.2.3, release/12.34.56"
        echo "  Feature: feature/PROJ-123, bugfix/BUG-456-auth-fix"
        echo "  Current: fix/LESBB-3102-valider-format-branch-et-commit-messages"
        
        return 1
    fi
}

# Main execution
BRANCH_NAME="$1"

# Check for help flag
if [[ "$BRANCH_NAME" == "-h" || "$BRANCH_NAME" == "--help" ]]; then
    show_usage
    exit 0
fi

# Validate the branch name
if validate_branch_name "$BRANCH_NAME"; then
    exit 0
else
    exit 1
fi
