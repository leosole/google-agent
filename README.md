# Google Agent

Google Workspace MCP agent for Sheets, Drive, and Slides. Generates interactive timelines and presentations.

## Prerequisites

- Node.js 18+
- Python 3.10+
- `uv`
- `opencode`
- Google Cloud project with Sheets + Drive + Slides APIs enabled

## Setup

```bash
cp .env.example .env
# Fill in G_CLIENT_ID, G_CLIENT_SECRET, EMAIL
./scripts/start-workspace-mcp.sh
opencode mcp auth workspace-mcp
```

## Modes

### Timeline Generation

Interactive Gantt-style timeline viewer generated from Google Sheets data.

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

### Presentation Mode

Create Google Slides presentations by combining templates with spreadsheet data.

```bash
# 1. Copy template
node scripts/copy-presentation.cjs <TEMPLATE_ID> "New Presentation Name"

# 2. Read data from spreadsheet
node scripts/read-sheet.cjs <SPREADSHEET_ID>

# 3. Get presentation structure
node scripts/get-presentation.cjs <NEW_PRESENTATION_ID>

# 4. Get slide details
node scripts/get-slide.cjs <PRESENTATION_ID> <SLIDE_ID>

# 5. Apply batch updates (replace text or delete slides)
# Create requests.json with your changes, then:
node scripts/batch-update.cjs <PRESENTATION_ID> requests.json
```

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/start-workspace-mcp.sh` | Start MCP server |
| `scripts/smoke-test.sh` | MCP integration test |
| `scripts/show-login-link.sh` | Print OAuth login URL |
| `scripts/fetch-sheet.cjs` | Fetch sheet data for timelines |
| `scripts/generate.ts` | Build self-contained HTML timeline |
| `scripts/copy-presentation.cjs` | Copy a presentation template |
| `scripts/get-presentation.cjs` | Get presentation structure |
| `scripts/get-slide.cjs` | Get slide details |
| `scripts/read-sheet.cjs` | Read spreadsheet data |
| `scripts/batch-update.cjs` | Apply batch updates to presentation |

## Timeline Features

- Multi-status task detection (Fazendo, Atrasado, Concluído, Não iniciado)
- Dark mode toggle
- Weekly/monthly/daily granularity
- Status and field filters
- Click-to-view popover with full task details
- Self-contained HTML (works from `file://`)

## Presentation Features

- Template-based (visual only — all content replaced)
- Batch text replacement
- Slide deletion for unmodified content
- Supports Sheets + Drive + Slides APIs
