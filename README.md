# Google Sheets MCP Server

A custom MCP (Model Context Protocol) server that enables Claude to read, write, update, and delete data in any Google Sheet. Works with any spreadsheet for any use case.

## Features

- **`append_rows`** — Add one or more rows to any Google Sheet
- **`update_row`** — Update existing cells by matching a column value
- **`delete_row`** — Delete rows by matching a column value
- **Sheet/tab flexibility** — Reference sheets by name or spreadsheet ID
- **Flexible row format** — Supports arrays or objects (with column headers)
- **Automatic validation** — Verifies sheets and tabs exist, with helpful error messages
- **Service account auth** — Uses Google Cloud credentials for secure access

## Use Cases

- Job application tracking
- Project management and status updates
- Inventory or asset management
- Lead tracking and CRM operations
- Data collection and processing
- Automated report generation
- Any custom workflow that needs Google Sheets integration

## Prerequisites

- Node.js installed
- Google Cloud project with Sheets API and Drive API enabled
- Service account created with `credentials.json` in the project directory
- Target Google Sheet shared with the service account email address

## Setup

1. Install dependencies:
```bash
npm install
```

2. Verify the required packages:
```bash
npm list @modelcontextprotocol/sdk googleapis google-auth-library
```

3. Ensure `credentials.json` is in the same directory as `index.js`

## How It Works

1. **Authentication** — Uses service account credentials from `credentials.json`
2. **Sheet Resolution** — Converts sheet names to IDs via Google Drive API
3. **Tab Validation** — Verifies the specified tab exists
4. **Data Operations** — Appends, updates, or deletes rows using the Sheets API

## Registering with Claude Code

Add this MCP to your Claude Code settings:

1. Open `.claude/settings.json` in your home directory
2. Add to the `mcpServers` array:

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["/path/to/google-sheets-mcp/index.js"]
    }
  }
}
```

3. Restart Claude Code

## Tools

### 1. `append_rows` — Add new rows

Append one or more rows to any sheet.

**Parameters:**
- `sheet_name_or_id` (required) — Sheet name or ID
- `tab_name` (optional) — Tab name, defaults to "Sheet1"
- `rows` (required) — Array of rows (arrays or objects)

**Examples:**

```
"Add this row to my 'Project Tracker' sheet: ['Task Name', 'Status', 'Owner']"
```

```
"Append to my inventory sheet:
- Item: Widget, Quantity: 50, Location: Warehouse A
- Item: Gadget, Quantity: 25, Location: Warehouse B"
```

### 2. `update_row` — Update existing cells

Update a cell by finding the row that matches a column value.

**Parameters:**
- `sheet_name_or_id` (required) — Sheet name or ID
- `tab_name` (optional) — Tab name, defaults to "Sheet1"
- `match_column` (required) — Column to search in (e.g., "Name")
- `match_value` (required) — Value to match (e.g., "John")
- `update_column` (required) — Column to update (e.g., "Status")
- `new_value` (required) — New value to write

**Examples:**

```
"Update the Status to 'Completed' for the row where Task is 'Setup Database'"
```

```
"For the item named 'Widget' in inventory, change the Quantity to 100"
```

### 3. `delete_row` — Remove rows

Delete a row by finding it with a column value match.

**Parameters:**
- `sheet_name_or_id` (required) — Sheet name or ID
- `tab_name` (optional) — Tab name, defaults to "Sheet1"
- `match_column` (required) — Column to search in
- `match_value` (required) — Value to match

**Examples:**

```
"Delete the row where Company is 'Acme Corp' from my leads sheet"
```

```
"Remove the task named 'Old Project' from my project tracker"
```

## Row Formats

### Array format:
```
[["value1", "value2", "value3"]]
```

### Object format (with column headers):
```
[{"Name": "John", "Email": "john@example.com", "Status": "Active"}]
```

## Referencing Sheets

**By name (exact match):**
```
"Update my 'Sales Pipeline' sheet"
```

**By ID (from URL):**
```
"Append to sheet '1a2b3c4d5e6f7g8h9i0j'"
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Sheet not found" | Use the exact sheet name or verify the service account has access |
| "Tab not found" | Error message lists available tabs — use the exact tab name |
| "Permission denied" | Share the sheet with the service account email from `credentials.json` |
| "Invalid credentials" | Verify `credentials.json` exists and contains valid service account credentials |
| "Column not found" | Check the exact spelling of the column name |

## Configuration

The service account email and project ID are read from `credentials.json`. To use this MCP with a different Google account:

1. Generate a new service account in Google Cloud Console
2. Download the JSON key file
3. Replace `credentials.json` with the new file
4. Share your Google Sheets with the new service account email

## Example Workflows

**Job Application Tracker:**
```
Append a new application: Google, Applied, 2026-05-25
Update status to "Interview Scheduled" for Google
```

**Project Management:**
```
Add task: "Design Database", "In Progress", "Alice"
Update the status of "Design Database" to "Complete"
Delete the "Deprecated Feature" task
```

**Inventory Management:**
```
Add new item: Widget, 50 units, Warehouse A
Update quantity for Widget to 40
Remove discontinued items
```

## Extending the MCP

The server can be extended with additional tools:
- `read_sheet` — Fetch sheet data
- `batch_update` — Update multiple cells
- `format_cells` — Apply formatting (bold, colors, etc.)
- `create_chart` — Generate charts from data

## License

MIT
