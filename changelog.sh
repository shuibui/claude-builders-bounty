#!/bin/bash
# Generate CHANGELOG.md from git history
# Usage: bash changelog.sh

set -e

# Get last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$LAST_TAG" ]; then
    COMMITS=$(git log --format="%s" "${LAST_TAG}..HEAD" --reverse)
else
    COMMITS=$(git log --format="%s" -50 --reverse)
fi

generate_category() {
    local prefix=$1
    local category=$2
    local label=""
    
    case $prefix in
        feat) label="Added" ;;
        fix) label="Fixed" ;;
        change|refactor|update) label="Changed" ;;
        remove|delete|deprecate) label="Removed" ;;
        doc|docs|readme) label="Documentation" ;;
        test) label="Tests" ;;
        *) label="Changed" ;;
    esac
    
    local commits=""
    while IFS= read -r line; do
        if echo "$line" | grep -qiE "^[^:]+: ${prefix}"; then
            commit_msg=$(echo "$line" | sed 's/^[^:]*: //')
            commits="${commits}  - ${commit_msg}"$'\n'
        fi
    done <<< "$COMMITS"
    
    if [ -n "$commits" ]; then
        echo "### ${label}"
        echo ""
        echo -n "$commits"
        echo ""
    fi
}

# Generate CHANGELOG
{
    echo "# Changelog"
    echo ""
    echo "All notable changes to this project will be documented in this file."
    echo ""
    echo "## [Unreleased]"
    echo ""
    echo "### Added"
    echo ""
    while IFS= read -r line; do
        if echo "$line" | grep -qiE "^[^:]+: feat"; then
            msg=$(echo "$line" | sed 's/^[^:]*: //')
            echo "  - ${msg}"
        fi
    done <<< "$COMMITS"
    echo ""
    echo "### Fixed"
    echo ""
    while IFS= read -r line; do
        if echo "$line" | grep -qiE "^[^:]+: fix"; then
            msg=$(echo "$line" | sed 's/^[^:]*: //')
            echo "  - ${msg}"
        fi
    done <<< "$COMMITS"
    echo ""
    echo "### Changed"
    echo ""
    while IFS= read -r line; do
        if echo "$line" | grep -qiE "^[^:]+: (refactor|update|change)"; then
            msg=$(echo "$line" | sed 's/^[^:]*: //')
            echo "  - ${msg}"
        fi
    done <<< "$COMMITS"
    echo ""
    if [ -n "$LAST_TAG" ]; then
        echo "## [${LAST_TAG}] - $(date +%Y-%m-%d)"
        echo ""
    fi
} > CHANGELOG.md

echo "✅ CHANGELOG.md generated!"
cat CHANGELOG.md
