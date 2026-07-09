# Google Agent Timeline

Interactive Gantt-style timeline viewer generated from Google Sheets data.

## Prerequisites

- Node.js 18+
- Python 3.10+
- `uv`
- `opencode`
- Google Cloud project with Sheets + Drive APIs enabled

## Setup

```bash
cp .env.example .env
# Fill in G_CLIENT_ID, G_CLIENT_SECRET, EMAIL
./scripts/start-workspace-mcp.sh
opencode mcp auth workspace-mcp
```

## Generating a timeline

```bash
# 1. Fetch data from Google Sheets via MCP
node scripts/fetch-sheet.cjs <SPREADSHEET_ID> <RANGE_NAME> .tmp/data.json

# 2. Build and generate self-contained HTML
npx tsx scripts/generate.ts \
  --data-file .tmp/data.json \
  --title "My Timeline" \
  --sheet-name "My Timeline" \
  --tab-name "Página1" \
  --extra-fields categoria \
  --sheet-url "https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>"
```

Output: `output/<SHEET_NAME>/<TAB_NAME>/timeline.html`

## Scripts

- `scripts/fetch-sheet.cjs` — fetch sheet data from workspace-mcp
- `scripts/generate.ts` — build and generate self-contained HTML
- `scripts/start-workspace-mcp.sh` — start MCP server
- `scripts/smoke-test.sh` — MCP integration test
- `scripts/show-login-link.sh` — print OAuth login URL

## Features

- Multi-status task detection (Fazendo, Atrasado, Concluído, Não iniciado)
- Dark mode toggle
- Weekly/monthly/daily granularity
- Status and field filters
- Click-to-view popover with full task details
- Self-contained HTML (works from `file://`)
