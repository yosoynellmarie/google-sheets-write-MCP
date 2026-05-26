# Google Sheets MCP Server

A custom MCP (Model Context Protocol) server that allows Claude to write rows to Google Sheets.

## Features

- **append_rows**: Append one or more rows to any Google Sheet you specify by name or ID
- Sheet name resolution: Can reference sheets by exact name or spreadsheet ID
- Flexible row format: Accepts rows as arrays or objects (with keys as column headers)
- Automatic tab validation: Verifies the tab exists and lists available tabs on error

## Prerequisites

- Node.js installed
- Google Cloud project with Sheets API and Drive API enabled
- Service account created and `credentials.json` in the project root
- Target Google Sheet shared with the service account email address

## Setup

Dependencies are already installed via npm install. To verify:

```bash
npm list @modelcontextprotocol/sdk googleapis google-auth-library
```

## How It Works

1. **Authentication**: Uses service account credentials from `credentials.json` to authenticate with Google APIs
2. **Sheet Lookup**: If given a sheet name, resolves it to the sheet ID via Google Drive API
3. **Tab Validation**: Finds the specified tab in the sheet and returns an error with available tabs if not found
4. **Row Append**: Converts rows to values and appends them using the Sheets API `append()` method

## Registering with Claude Code

Once the server is running, register it with Claude Code using:

```bash
claude code register "Google Sheets" --command "node /Users/daniellacortez/dev/index.js"
```

Or, add it to your Claude Code settings directly:

1. Open `.claude/settings.json` in your home directory
2. Add the MCP server to the `mcpServers` array:

```json
{
  "mcpServers": {
    "google-sheets": {
      "command": "node",
      "args": ["/Users/daniellacortez/dev/index.js"]
    }
  }
}
```

3. Restart Claude Code

## Using the Tool

Once registered, Claude can call the `append_rows` tool. Examples:

### Append a single row as an array:

```
Append to my "Job Tracker" sheet, tab "Applications", this row: ["Google", "2026-05-25", "Applied", "software_engineer@google.com"]
```

### Append rows as objects (with column headers):

```
Add these applications to my job tracker sheet:
- Company: LinkedIn, Date: 2026-05-24, Status: Interview Scheduled
- Company: Microsoft, Date: 2026-05-20, Status: Rejected
```

The tool will convert these to the appropriate format and append them.

### Use a sheet ID instead of name:

If you have the sheet ID from the URL (the long alphanumeric string), you can use it directly:

```
Append to sheet "1a2b3c4d5e6f7g8h9i0j", tab "Data"...
```

## Tool Parameters

- **sheet_name_or_id** (required): The exact name of the Google Sheet or its spreadsheet ID
- **tab_name** (optional): The name of the worksheet tab. Defaults to "Sheet1"
- **rows** (required): An array of rows, each row can be:
  - An array of values: `[["value1", "value2", "value3"]]`
  - An object with column headers: `[{"Company": "Google", "Date": "2026-05-25", "Status": "Applied"}]`

## Troubleshooting

**"Sheet not found"**: Make sure you're using the exact sheet name and that the service account has access to it.

**"Tab not found"**: The error message will list all available tabs in the sheet. Use the exact tab name.

**"Permission denied"**: Ensure the sheet is shared with the service account email address from your `credentials.json`.

**"Invalid credentials"**: Verify `credentials.json` exists and contains valid service account credentials.

## Next Steps

- Integrate with Claude's email reading capabilities to auto-populate your job tracker from application confirmations
- Add more tools (e.g., `read_sheet`, `update_rows`, `delete_rows`)
- Add formatting options (bold, colors, etc.) for better sheet organization
