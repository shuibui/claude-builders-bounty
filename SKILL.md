# Generate Changelog — Claude Code Skill

**Author:** shuibui  
**Created:** 2026-05-13  
**Bounty:** $50 (Opire)  
**For:** claude-builders-bounty/changelog-bounty #1

## Trigger

User says: `/generate-changelog` or `/changelog`

## What It Does

Automatically generates a structured `CHANGELOG.md` from git history:
1. Fetches commits since the last git tag
2. Auto-categorizes into: Added / Fixed / Changed / Removed / Deprecated
3. Outputs a properly formatted `CHANGELOG.md`

## How to Use

```bash
# Option 1: Claude Code command
/generate-changelog

# Option 2: Direct bash script
bash changelog.sh

# Option 3: Python script
python3 generate_changelog.py
```

## Acceptance Criteria

- [x] Works via `/generate-changelog` command
- [x] Fetches commits since the last git tag
- [x] Auto-categorizes into: Added / Fixed / Changed / Removed
- [x] Outputs a properly formatted `CHANGELOG.md`
- [ ] README with setup instructions

## Implementation

### Bash Version (changelog.sh)

```bash
#!/bin/bash
# Generate CHANGELOG from git history
# Usage: bash changelog.sh

set -e

# Get last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
COMMITS=$(git log --oneline $LAST_TAG..HEAD 2>/dev/null || git log --oneline -50)

generate_category() {
    local prefix=$1
    local category=$2
    local commits=$(echo "$COMMITS" | grep -i "^.*$prefix.*:" | sed 's/^[^:]*: //')
    if [ -n "$commits" ]; then
        echo "### $category"
        echo ""
        echo "$commits" | sed 's/^/  - /'
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
    generate_category "feat|add|new" "Added"
    generate_category "fix|bug|patch" "Fixed"
    generate_category "change|refactor|update" "Changed"
    generate_category "remove|delete|deprecate" "Deprecated"
    generate_category "doc|docs|readme" "Documentation"
    generate_category "test" "Tests"
    echo ""
    echo "## [${LAST_TAG:-v0.0.0}] - $(date +%Y-%m-%d)"
    echo ""
    echo "### Initial Release"
    echo ""
} > CHANGELOG.md

echo "✅ CHANGELOG.md generated!"
cat CHANGELOG.md
```

### Python Version (generate_changelog.py)

```python
#!/usr/bin/env python3
"""
Generate CHANGELOG.md from git history
Usage: python3 generate_changelog.py
"""
import subprocess
import re
from datetime import datetime
from pathlib import Path

CATEGORIES = {
    'added': re.compile(r'feat|add|new', re.I),
    'fixed': re.compile(r'fix|bug|patch', re.I),
    'changed': re.compile(r'change|refactor|update|upgrade', re.I),
    'removed': re.compile(r'remove|delete|deprecate', re.I),
    'docs': re.compile(r'doc|docs|readme|comment', re.I),
    'tests': re.compile(r'test|spec', re.I),
}

def get_last_tag():
    result = subprocess.run(
        ['git', 'describe', '--tags', '--abbrev=0'],
        capture_output=True, text=True
    )
    return result.stdout.strip() or None

def get_commits_since_tag(tag):
    if tag:
        result = subprocess.run(
            ['git', 'log', f'{tag}..HEAD', '--format=%s', '--reverse'],
            capture_output=True, text=True
        )
    else:
        result = subprocess.run(
            ['git', 'log', '-50', '--format=%s', '--reverse'],
            capture_output=True, text=True
        )
    return result.stdout.strip().split('\n') if result.stdout.strip() else []

def categorize(commit):
    for category, pattern in CATEGORIES.items():
        if pattern.search(commit):
            return category.capitalize()
    return 'Changed'

def generate_changelog():
    tag = get_last_tag()
    commits = get_commits_since_tag(tag)
    
    categorized = {'Added': [], 'Fixed': [], 'Changed': [], 'Removed': [], 
                   'Documentation': [], 'Tests': []}
    
    for commit in commits:
        if commit:
            cat = categorize(commit)
            categorized[cat].append(f"  - {commit}")
    
    date = datetime.now().strftime('%Y-%m-%d')
    version = tag or 'Unreleased'
    
    lines = ['# Changelog', '', 
             'All notable changes to this project will be documented in this file.', '']
    
    lines.append(f'## [{version}] - {date}' if tag else '## [Unreleased]')
    lines.append('')
    
    for cat, items in categorized.items():
        if items:
            lines.append(f'### {cat}')
            lines.extend(items)
            lines.append('')
    
    return '\n'.join(lines)

if __name__ == '__main__':
    changelog = generate_changelog()
    Path('CHANGELOG.md').write_text(changelog)
    print('✅ CHANGELOG.md generated!')
    print(changelog)
```

## Test Results

Tested on: `shuibui/memanto` fork

```
## [Unreleased]

### Added
  - feat: langgraph memory integration

### Fixed
  - fix: typo in http_client.go

### Changed
  - refactor: update dependencies
```

## Sample Output

See generated `CHANGELOG.md` in this repository.
