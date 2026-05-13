#!/usr/bin/env node
/**
 * CLI wrapper for PR Review Agent
 * Usage: claude-review --pr https://github.com/owner/repo/pull/123
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const prIndex = args.indexOf('--pr');
const prIndex2 = args.indexOf('-p');

const prArgIndex = prIndex !== -1 ? prIndex : prIndex2;
const prUrl = prArgIndex !== -1 ? args[prArgIndex + 1] : null;

if (!prUrl) {
    console.error('Usage: claude-review --pr <pr-url>');
    console.error('Example: claude-review --pr https://github.com/owner/repo/pull/123');
    console.error('       claude-review -p owner/repo/123');
    process.exit(1);
}

const scriptPath = path.join(__dirname, 'pr-review-agent.js');
const child = spawn('node', [scriptPath, '--pr', prUrl], {
    stdio: ['inherit', 'pipe', 'inherit'],
    env: { ...process.env, GITHUB_TOKEN: process.env.GITHUB_TOKEN || '' }
});

child.stdout.on('data', (data) => {
    process.stdout.write(data);
});

child.on('close', (code) => {
    process.exit(code);
});
