# Generate Changelog

Automatically generates a structured `CHANGELOG.md` from git history.

## Quick Start

```bash
# Bash version
bash changelog.sh

# Python version
python3 generate_changelog.py
```

## What It Does

1. Fetches commits since the last git tag
2. Auto-categorizes into: Added / Fixed / Changed / Removed / Deprecated
3. Outputs a properly formatted `CHANGELOG.md`

## Requirements

- Git
- Bash or Python 3

## Usage

```bash
# Generate changelog for current repo
bash changelog.sh

# Or use Python
python3 generate_changelog.py
```

## Output Format

```markdown
# Changelog

## [Unreleased]

### Added
  - feat: new feature

### Fixed
  - fix: bug fix
```
