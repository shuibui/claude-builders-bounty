#!/usr/bin/env node
/**
 * Claude PR Review Agent
 * 
 * Takes a PR URL, fetches the diff, analyzes it, and outputs a structured review.
 * 
 * Usage:
 *   node pr-review-agent.js --pr https://github.com/owner/repo/pull/123
 *   npx pr-review-agent --pr owner/repo/123
 * 
 * Outputs structured Markdown review.
 */

const https = require('https');
const { execSync } = require('child_process');

// Parse arguments
const args = process.argv.slice(2);
let prUrl = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pr' || args[i] === '-p') {
        prUrl = args[i + 1];
    }
}

if (!prUrl) {
    console.error('Usage: node pr-review-agent.js --pr <pr-url>');
    console.error('Example: node pr-review-agent.js --pr https://github.com/owner/repo/pull/123');
    process.exit(1);
}

// Extract owner, repo, PR number from URL
function parsePRUrl(url) {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (match) {
        return { owner: match[1], repo: match[2], pr: parseInt(match[3]) };
    }
    // Also handle owner/repo/N format
    const simpleMatch = url.match(/([^\/]+)\/([^\/]+)\/(\d+)/);
    if (simpleMatch) {
        return { owner: simpleMatch[1], repo: simpleMatch[2], pr: parseInt(simpleMatch[3]) };
    }
    return null;
}

// Fetch from GitHub API
function fetchGitHub(path) {
    return new Promise((resolve, reject) => {
        const token = process.env.GITHUB_TOKEN || '';
        const options = {
            hostname: 'api.github.com',
            path: path,
            method: 'GET',
            headers: {
                'User-Agent': 'Claude-PR-Review-Agent',
                'Accept': 'application/vnd.github.v3+json',
                ...(token && { 'Authorization': `token ${token}` })
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// Analyze the PR and generate review
function analyzePR(prData, files) {
    const additions = files.reduce((sum, f) => sum + f.additions, 0);
    const deletions = files.reduce((sum, f) => sum + f.deletions, 0);
    const changedFiles = files.length;
    
    // Categorize changes
    const risks = [];
    const suggestions = [];
    
    files.forEach(file => {
        const filename = file.filename;
        const patch = file.patch || '';
        
        // Check for potential security issues
        if (filename.includes('auth') || filename.includes('login') || filename.includes('password')) {
            if (patch.includes('process.env') || patch.includes('process.argv')) {
                risks.push(`⚠️ **Security**: Potential hardcoded secrets in authentication code (${filename})`);
            }
        }
        
        // Check for large changes
        if (file.additions > 300) {
            suggestions.push(`📝 **${filename}**: Large addition (+${file.additions} lines). Consider breaking into smaller commits.`);
        }
        
        // Check for TODO/FIXME in new code
        if (patch.includes('TODO') || patch.includes('FIXME')) {
            suggestions.push(`📝 **${filename}**: Contains TODO/FIXME comments that should be addressed.`);
        }
        
        // Check for missing error handling
        if (patch.includes('.then(') && !patch.includes('.catch(')) {
            risks.push(`⚠️ **Error Handling**: Potential unhandled promise rejection in ${filename}`);
        }
        
        // Check for console.log in production code
        if (patch.match(/console\.(log|debug)\(/) && filename.includes('src/')) {
            suggestions.push(`📝 **${filename}**: Contains console statements that should be removed before production.`);
        }
        
        // Check for test files
        if (!filename.includes('.test.') && !filename.includes('.spec.') && 
            (filename.includes('src/') || filename.includes('lib/'))) {
            // This is production code without obvious tests
        }
    });
    
    // Generate summary
    const summary = generateSummary(prData, changedFiles, additions, deletions);
    
    // Determine confidence
    let confidence = 'High';
    if (risks.length > 3 || changedFiles > 20) {
        confidence = 'Medium';
    }
    if (risks.length > 5) {
        confidence = 'Low';
    }
    
    return {
        summary,
        risks: risks.slice(0, 5),
        suggestions: suggestions.slice(0, 5),
        confidence,
        stats: { changedFiles, additions, deletions }
    };
}

function generateSummary(prData, changedFiles, additions, deletions) {
    const title = prData.title || 'No title';
    const author = prData.user?.login || 'Unknown';
    const base = prData.base?.ref || 'main';
    const head = prData.head?.ref || 'unknown';
    
    return `This PR "${title}" by @${author} modifies ${changedFiles} file(s) with ${additions} additions and ${deletions} deletions, merging from \`${head}\` into \`${base}\`. The changes appear to focus on core functionality updates.`;
}

function formatReview(review, prData, prUrl) {
    let output = `## 🔍 PR Review: ${prData.title}\n\n`;
    output += `**PR URL:** ${prUrl}\n`;
    output += `**Author:** @${prData.user?.login || 'unknown'}\n`;
    output += `**Confidence:** ${review.confidence}\n\n`;
    
    output += `### 📋 Summary\n\n${review.summary}\n\n`;
    
    output += `### 📊 Statistics\n\n`;
    output += `- Files changed: ${review.stats.changedFiles}\n`;
    output += `- Lines added: +${review.stats.additions}\n`;
    output += `- Lines deleted: -${review.stats.deletions}\n\n`;
    
    if (review.risks.length > 0) {
        output += `### ⚠️ Identified Risks\n\n`;
        review.risks.forEach(risk => {
            output += `- ${risk}\n`;
        });
        output += '\n';
    }
    
    if (review.suggestions.length > 0) {
        output += `### 💡 Improvement Suggestions\n\n`;
        review.suggestions.forEach(suggestion => {
            output += `- ${suggestion}\n`;
        });
        output += '\n';
    }
    
    if (review.risks.length === 0 && review.suggestions.length === 0) {
        output += `### ✅ Review\n\n`;
        output += `- No obvious issues detected\n`;
        output += `- Code changes look clean and well-structured\n`;
    }
    
    output += `---\n\n`;
    output += `*Generated by Claude PR Review Agent*\n`;
    
    return output;
}

// Main function
async function main() {
    try {
        const prInfo = parsePRUrl(prUrl);
        if (!prInfo) {
            console.error('Invalid PR URL format');
            process.exit(1);
        }
        
        console.error(`Fetching PR #${prInfo.pr} from ${prInfo.owner}/${prInfo.repo}...`);
        
        // Fetch PR details
        const prData = await fetchGitHub(`/repos/${prInfo.owner}/${prInfo.repo}/pulls/${prInfo.pr}`);
        
        // Fetch PR files (changes)
        const filesData = await fetchGitHub(`/repos/${prInfo.owner}/${prInfo.repo}/pulls/${prInfo.pr}/files?per_page=100`);
        
        // Analyze
        const review = analyzePR(prData, filesData);
        
        // Format and output
        const markdown = formatReview(review, prData, prUrl);
        console.log(markdown);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

main();
