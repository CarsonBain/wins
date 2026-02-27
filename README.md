# wins

A personal CLI for capturing engineering wins and getting AI-powered summaries of your work.

## Features

- Log wins with timestamps and tags
- Sync merged GitHub PRs automatically
- AI-generated summaries, theme breakdowns, and narratives (powered by Claude via OpenRouter)

---

## Installation

```bash
cd ~/Dev/wins
npm install
npm run build
npm link
```

This makes `wins` available globally in your terminal.

---

## Setup

Run the interactive setup wizard:

```bash
wins config init
```

You'll be prompted for:

| Field | Description |
|---|---|
| OpenRouter API Key | From [openrouter.ai/keys](https://openrouter.ai/keys) |
| GitHub Personal Access Token | From [github.com/settings/tokens](https://github.com/settings/tokens) — needs `repo` scope (classic token) |
| GitHub Username | Your GitHub login |
| Repos to track | Comma-separated list, e.g. `org/repo1,org/repo2` |
| Data directory | Where `store.json` lives (default: `~/.wins`) |

Or set individual values:

```bash
wins config set openrouterApiKey sk-or-...
wins config set githubToken ghp_...
wins config set githubUsername yourname
wins config set repos org/repo1,org/repo2
```

View current config:

```bash
wins config get
```

**Config is stored at:** `~/.config/wins/config.json`
**Data is stored at:** `~/.wins/store.json` (or your configured `dataDir`)

---

## Commands

### `wins log`

Log a win manually.

```bash
wins log "shipped the new onboarding flow"
wins log "fixed production bug in checkout" --tag bugfix,backend
wins log "led Q3 planning session" --date 2025-09-15
wins log "launched MVP" --date 2025-06-01 --tag launch
```

Options:
- `--tag <tags>` — comma-separated tags
- `--date <date>` — override the date for retroactive entries (YYYY-MM-DD or ISO 8601)

---

### `wins list`

Print logged wins (and optionally PRs).

```bash
wins list
wins list --since 2025-01-01
wins list --since 2025-01-01 --until 2025-06-30
wins list --prs
wins list --since 2025-06-01 --prs
```

Options:
- `--since <date>` — only show entries on or after this date
- `--until <date>` — only show entries on or before this date
- `--prs` — include synced GitHub PRs in the output

---

### `wins pr sync`

Fetch your merged PRs from GitHub and store them locally.

```bash
wins pr sync
wins pr sync --since 2025-01-01
```

On first run, fetches all merged PRs. On subsequent runs, only fetches since the last sync (incremental). Use `--since` to override.

---

### `wins summary`

AI-generated 3–5 sentence summary of your key accomplishments.

```bash
wins summary
wins summary --since 2025-01-01
wins summary --since 2025-01-01 --until 2025-06-30
```

---

### `wins themes`

AI-identified recurring themes or focus areas, with supporting examples.

```bash
wins themes
wins themes --since 2025-01-01
```

---

### `wins review`

Full AI-generated performance review narrative.

```bash
wins review
wins review --format bullet
wins review --format star
wins review --format prose
wins review --since 2025-01-01 --format bullet
```

Formats:
- `bullet` *(default)* — achievement-oriented bullet points grouped by theme
- `star` — STAR format (Situation, Task, Action, Result)
- `prose` — flowing paragraphs, suitable for submitting to a manager or HR system

---

## Typical workflow

```bash
# Day-to-day: log wins as they happen
wins log "merged dark mode feature" --tag frontend
wins log "unblocked the mobile team on auth issue" --tag collaboration

# Weekly: sync GitHub PRs
wins pr sync

# Review season
wins summary --since 2025-01-01             # quick overview
wins themes --since 2025-01-01              # identify patterns
wins review --since 2025-01-01 --format bullet  # generate review bullets
```

---

## Data

All data is stored as plain JSON — no database, no cloud sync.

- **Config:** `~/.config/wins/config.json`
- **Store:** `~/.wins/store.json` (default, configurable)
