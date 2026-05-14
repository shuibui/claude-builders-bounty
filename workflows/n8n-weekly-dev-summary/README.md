# Weekly Dev Summary - n8n + Claude Workflow

Automated weekly narrative summary of GitHub repository activity using Claude API.

## Features

- **Weekly trigger** (Friday 5pm) via n8n cron
- **Fetches**: commits, closed issues, merged PRs from GitHub API
- **Generates** narrative summary using Claude Sonnet 4
- **Delivers** via Discord, Slack, or Email (configurable)
- **Multilingual**: English (EN) or French (FR)

## Setup (5 Steps)

### Step 1: Import Workflow
1. Open n8n dashboard → Click **"+"** → **"Import from JSON"**
2. Upload `n8n-workflow.json`

### Step 2: Configure Variables
In n8n → **Settings** → **Variables**, add:

| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_REPO` | Repository in `owner/repo` format | `claude-builders-bounty/claude-builders-bounty` |
| `GITHUB_TOKEN` | GitHub Personal Access Token | `ghp_...` |
| `CLAUDE_API_KEY` | Anthropic API Key | `sk-ant-...` |
| `LANGUAGE` | Summary language (`EN` or `FR`) | `EN` |

### Step 3: Configure Delivery Channel
Choose ONE delivery method:

**Discord**:
- Add `DISCORD_WEBHOOK` variable with your Discord webhook URL

**Slack**:
- Add `SLACK_WEBHOOK` variable with your Slack webhook URL

**Email**:
- Add `EMAIL_TO` variable with recipient email
- Configure SMTP credentials in n8n email node

### Step 4: Set Credentials
- **HTTP Header Auth**: For Claude API calls (API key in header)

### Step 5: Activate
Toggle the workflow **ON** in n8n. Runs automatically every Friday at 5pm.

## Workflow Structure

```
Schedule Trigger (Friday 5pm)
    ↓
Calculate Date Range (past 7 days)
    ↓
[Fetch Commits] [Fetch Closed Issues] [Fetch Merged PRs]
    ↓
Compile Activity Data
    ↓
Build Prompt + Claude API (claude-sonnet-4-20250514)
    ↓
Format Notification
    ↓
[Send Discord] [Send Slack] [Send Email]
```

## Sample Output

> **Weekly Dev Summary**
>
> This week saw significant progress with 23 commits merged across 5 pull requests. The team closed 8 issues, including a major performance optimization (#142) and several UI improvements. Notable work included the new notification system implementation and database migration tooling.
>
> _Repository: owner/repo | May 8 - May 14, 2026_

## Troubleshooting

- **No data fetched**: Verify `GITHUB_TOKEN` has `repo` scope
- **Claude errors**: Ensure `CLAUDE_API_KEY` is valid
- **Delivery failed**: Check webhook URLs and SMTP settings
