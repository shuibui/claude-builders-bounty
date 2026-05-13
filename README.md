# Claude Code Pre-Tool-Use Hook: Block Destructive Commands

A Claude Code hook that intercepts and blocks dangerous bash commands before execution.

## What It Does

🔒 **Blocks dangerous commands:**
- `rm -rf` on system directories
- `DROP TABLE`, `TRUNCATE`, `DELETE FROM` without WHERE
- `git push --force`
- `DROP DATABASE`
- And more...

📝 **Logs every blocked attempt** to `~/.claude/hooks/blocked.log`

## Installation

```bash
# 1. Create the hooks directory
mkdir -p ~/.claude/hooks/pre-tool-use

# 2. Copy this hook
cp destructive-hook.sh ~/.claude/hooks/pre-tool-use/destructive-hook

# 3. Make it executable
chmod +x ~/.claude/hooks/pre-tool-use/destructive-hook
```

That's it! Claude Code will automatically run this hook before every tool use.

## Configuration

### Adding More Blocked Patterns

Edit the `BLOCKED_PATTERNS` array in `destructive-hook.sh`:

```bash
BLOCKED_PATTERNS=(
    "rm -rf /"
    "your-new-pattern"
    # Add more...
)
```

### Changing the Log Location

Set the `LOG_FILE` environment variable:

```bash
LOG_FILE="/path/to/your/log" ./destructive-hook "your command"
```

## Log Format

```
[2025-05-13 14:30:45] BLOCKED: rm -rf /home | Project: /home/ubuntu/myproject
[2025-05-13 14:31:00] BLOCKED: DROP TABLE users | Project: /home/ubuntu/app
```

## Tested Commands

| Command | Blocked? |
|---------|----------|
| `rm -rf /` | ✅ Yes |
| `rm -rf /home` | ✅ Yes |
| `DROP TABLE users` | ✅ Yes |
| `DELETE FROM users` | ✅ Yes |
| `git push --force` | ✅ Yes |
| `rm file.txt` | ❌ No (safe) |
| `git push` | ❌ No (safe) |
| `DROP TABLE users WHERE id = 1` | ❌ No (has WHERE) |

## How It Works

1. Claude Code calls this script before every tool use
2. The script receives the command as `$1`
3. It checks against blocked patterns
4. If blocked, logs and exits with code 1
5. If safe, exits with code 0

## License

MIT
