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
