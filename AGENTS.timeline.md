# Timeline Generation Mode

Generates interactive Gantt-style timeline HTML from Google Sheets.

## When to use

- User asks to create a timeline or Gantt chart from spreadsheet data

## Prerequisites

MCP server must be authenticated (see `AGENTS.md` for setup).

## Workflow

```bash
# 1. Fetch sheet data from MCP
node scripts/fetch-sheet.cjs <SPREADSHEET_ID> <RANGE_NAME> .tmp/timeline-data.json

# 2. Build and generate self-contained HTML
npx tsx scripts/generate.ts \
  --data-file .tmp/timeline-data.json \
  --title "<TIMELINE_TITLE>" \
  --sheet-name "<SHEET_NAME>" \
  --tab-name "<TAB_NAME>" \
  --extra-fields <COMMA_SEPARATED_FIELDS> \
  --sheet-url "https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>"
```

Output is written to `output/<SHEET_NAME>/<TAB_NAME>/timeline.html`.

## Parameters

- `<SPREADSHEET_ID>`: Google Sheets spreadsheet ID (from URL)
- `<RANGE_NAME>`: Sheet/tab name to read (e.g., `Página1`)
- `<TIMELINE_TITLE>`: Display title for the timeline
- `<SHEET_NAME>`: Output folder name
- `<TAB_NAME>`: Tab name for output path
- `<COMMA_SEPARATED_FIELDS>`: Format `<filter_cols>;<popup_cols>`. E.g., `categoria,prioridade;categoria` means filter by `categoria` and `prioridade`, show only `categoria` in popup. If only one part given (no `;`), same cols apply to both.

## LLM-driven field selection

The LLM should ask the user which extra columns to use as filters and which to show in the popup. Use the `question` tool to ask. Then pass the result via `--extra-fields` in the format `<filter>;<popup>`.

## Source Conventions

Data is read from a Google Sheet where:
- Column `Tarefa` → task name
- Column `Inicio` → start date (Brazilian `DD/MM/YY` or `DD/MM/YYYY`)
- Column `Fim` → end date (nullable)
- Column `Previsto` → planned/due date (nullable)
- Any other column → extra field (pass via `--extra-fields`)
