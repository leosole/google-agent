# Presentation Mode

Creates Google Slides presentations by combining two independent sources:

- **Presentation Template** — provides layout, branding, colors, typography, spacing, graphics, icons, positioning, slide sequence, placeholders, and overall visual identity.
- **Spreadsheet** — provides facts, numbers, titles, text, chart data, tables, metrics, categories, and any information that should appear in the presentation.

Never confuse these two responsibilities. The spreadsheet is not a presentation design. The template is not the source of business information. The final presentation is the combination of both.

## Critical Rule: Template is Visual Only

The template deck is used ONLY for its visual appearance (layout, colors, fonts, graphics, positioning). **All original content from the template must be replaced.** The final presentation contains ONLY information from:

1. **The spreadsheet** — facts, numbers, data, metrics
2. **User-provided information** — titles, descriptions, context, insights

**Never keep template content in the final presentation.** The template's text, titles, data, and conclusions are examples only — they must all be replaced with the actual content from the spreadsheet and user instructions.

## When to use

- User asks to create a new slide deck/presentation
- User asks to edit or update an existing presentation
- User asks to generate slides from spreadsheet data

## Required Information

Before creating a presentation, gather the following from the user (if not already provided):

1. **Presentation name** — Title for the new deck
2. **Presentation template** — An existing Google Slides deck to use as a base (visual only)
3. **Data source** (optional) — A Google Sheet with data to populate the slides
4. **Additional context** (optional) — Any other information, titles, descriptions, or insights the user wants included

Use the `question` tool to ask for missing information.

## Required Workflow

### Step 1 — Read the spreadsheet

Inspect all worksheets. Understand: columns, relationships, categories, metrics, summaries, charts, trends, notes. Infer what information belongs together. Do not immediately start creating slides.

### Step 2 — Analyze the template

Open the template presentation. Study every slide. Determine: slide purpose, layout, placeholder locations, font sizes, color palette, images, icons, recurring elements, master layouts, visual hierarchy, animations (if available), speaker notes (if relevant). Treat the template as the visual specification. Do not overwrite the template.

### Step 3 — Create a new presentation

Always create a NEW presentation. Never modify the original template. Use `copy_drive_file` to duplicate the template. The new presentation should inherit the template's visual identity.

### Step 4 — Reuse slides whenever possible

Each template slide already has a purpose (title, agenda, executive summary, KPI dashboard, timeline, roadmap, comparison, risks, recommendations, closing, etc.). Reuse the existing slide whenever possible. Replace ALL content — do not keep any of the template's original text. Do not redesign the slide. Prefer editing copies of existing template slides over creating new slides from scratch. For each template slide, identify its semantic role, duplicate it into the new presentation, and replace all placeholders with content from the spreadsheet and user instructions.

### Step 5 — Replace placeholders

For every placeholder, determine what information from the spreadsheet or user instructions best fits that placeholder:

- A title placeholder should receive a title
- A metric card should receive one metric
- A table should receive tabular information
- A chart placeholder should receive a chart representing the spreadsheet data
- A comparison block should receive comparable values
- A timeline should receive chronological information

Never place data arbitrarily. Never keep template content.

### Step 6 — Preserve design

The following must remain unchanged whenever possible: layouts, alignment, spacing, colors, typography, margins, branding, backgrounds, icons, decorative elements, visual hierarchy. Changing these should be considered a last resort.

### Step 7 — Adapt only when necessary

If the spreadsheet contains more information than fits: duplicate an existing layout, continue using the same design, preserve consistency. If the spreadsheet contains less information: remove unnecessary placeholders, keep visual balance, never fill slides with meaningless text.

### Step 8 — Handle charts intelligently

If the template contains charts: reuse their style, replace only the data. If charts must be created: match the template style, choose chart types appropriate for the data.

### Step 9 — Handle tables intelligently

Do not dump spreadsheet tables directly into slides. Summarize. Condense. Highlight important values. Only include large tables when the template specifically expects one.

### Step 10 — Preserve slide flow

Maintain the logical order of the template whenever possible. Do not reorder slides unless the spreadsheet clearly requires it.

### Step 11 — Delete unmodified slides

After replacing all content, review every slide in the presentation. **Delete any slide that still contains original template content** (text, data, conclusions, or references that were not replaced with spreadsheet/user data). Only keep slides that have been fully updated with new content. Use `batch_update_presentation` with `delete_object` requests to remove unwanted slides.

## Decision Rules

When there is a conflict between the spreadsheet/user input and the template:

**Visual decisions** — Follow the template. Examples: fonts, colors, positioning, spacing, layout, icons, backgrounds.

**Content decisions** — Follow the spreadsheet and user instructions. Examples: titles, numbers, descriptions, metrics, dates, percentages, names.

**Structural decisions** — Prefer the template structure. Only create additional slides if there is genuinely more information than can fit.

## Content Quality

Do not merely copy spreadsheet cells. Transform raw data into presentation-quality content: concise titles, executive summaries, highlighted insights, grouped information, meaningful charts, readable tables, consistent terminology. Assume the audience is reading slides, not spreadsheets. Incorporate user-provided context and insights alongside spreadsheet data.

## Layout Adaptation

A template is not rigid. If the amount of content changes: resize text carefully, duplicate layouts when needed, split overloaded slides, maintain the template's visual language. Do not sacrifice readability simply to preserve a one-to-one mapping.

## Things to Never Do

- Do NOT create a presentation from scratch when a template exists
- Do NOT replace carefully designed slides with plain tables
- Do NOT ignore the spreadsheet
- Do NOT ignore the template's visual design
- Do NOT keep the template's original content in the final presentation
- Do NOT remove branding
- Do NOT invent business data
- Do NOT invent conclusions unsupported by the spreadsheet or user input
- Do NOT use generic layouts if an appropriate template slide already exists

## Success Criteria

A successful presentation should satisfy all of the following:

- Someone familiar with the template immediately recognizes its design
- Someone familiar with the spreadsheet recognizes that the presentation accurately represents its information
- The presentation looks professionally designed rather than auto-generated
- Every slide has a clear purpose
- Content is adapted to the slide instead of copied verbatim
- New slides, if required, look indistinguishable from the original template
- The original template remains untouched
- The resulting presentation feels like the template was filled with new content, not recreated
- **No original template content remains** — all text has been replaced with spreadsheet/user data

## MCP Tools Available

When workspace-mcp is running with slides enabled:

| Tool | Purpose |
|------|---------|
| `copy_drive_file` | Copy a presentation (PRIMARY — always use this to create new decks from templates) |
| `get_presentation` | Get presentation structure, slide IDs, and overall layout |
| `get_page` | Get details about a specific slide (elements, positions, text) |
| `batch_update_presentation` | Modify text content, duplicate slides, replace placeholders, **delete slides** |
| `read_sheet_values` | Read data from Google Sheets |
| `search_drive_files` | Find presentations and spreadsheets by name |

## Reusable Scripts

Located in `scripts/` folder. All scripts use MCP session management and can be chained together.

| Script | Usage | Purpose |
|--------|-------|---------|
| `copy-presentation.cjs` | `node scripts/copy-presentation.cjs <template_id> <new_name>` | Copy a template to create a new presentation |
| `get-presentation.cjs` | `node scripts/get-presentation.cjs <presentation_id>` | Get slide IDs and text content |
| `get-slide.cjs` | `node scripts/get-slide.cjs <presentation_id> <slide_id>` | Get details about a specific slide |
| `read-sheet.cjs` | `node scripts/read-sheet.cjs <spreadsheet_id> [range]` | Read data from Google Sheets |
| `batch-update.cjs` | `node scripts/batch-update.cjs <presentation_id> <requests.json>` | Apply batch updates (replace text or delete slides) |

### Script Workflow

1. **Copy template**: `node scripts/copy-presentation.cjs <template_id> "New Name"`
2. **Read data**: `node scripts/read-sheet.cjs <spreadsheet_id>`
3. **Get structure**: `node scripts/get-presentation.cjs <new_presentation_id>`
4. **Get slide details**: `node scripts/get-slide.cjs <presentation_id> <slide_id>`
5. **Apply updates**: Create a JSON file with requests, then run `node scripts/batch-update.cjs <presentation_id> <requests.json>`

### Request Formats

**Text replacement:**
```json
[
  {
    "replaceAllText": {
      "containsText": { "text": "old text", "matchCase": true },
      "replaceText": "new text"
    }
  }
]
```

**Slide deletion:**
```json
[
  {
    "deleteObject": {
      "objectId": "slide_id_from_get_presentation"
    }
  }
]
```

**Combined operations:**
```json
[
  {
    "replaceAllText": {
      "containsText": { "text": "Title", "matchCase": true },
      "replaceText": "New Title"
    }
  },
  {
    "deleteObject": {
      "objectId": "unwanted_slide_id"
    }
  }
]
```
