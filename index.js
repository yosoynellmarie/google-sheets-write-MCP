#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
// Load service account credentials
const credentialsPath = path.join(__dirname, "credentials.json");
const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));

// Initialize Google APIs with service account
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
});

const sheets = google.sheets({ version: "v4", auth });
const drive = google.drive({ version: "v3", auth });

// Helper function to resolve sheet name to sheet ID
async function resolveSheetId(sheetNameOrId) {
  // If it looks like a sheet ID (long alphanumeric), return as-is
  if (/^[a-zA-Z0-9-_]{20,}$/.test(sheetNameOrId)) {
    return sheetNameOrId;
  }

  // Otherwise, search for a sheet by name
  const response = await drive.files.list({
    q: `name='${sheetNameOrId.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    spaces: "drive",
    fields: "files(id, name)",
    pageSize: 1,
  });

  if (!response.data.files || response.data.files.length === 0) {
    throw new Error(`Sheet "${sheetNameOrId}" not found in Google Drive`);
  }

  return response.data.files[0].id;
}

// Helper function to get sheet metadata and find tab by name
async function findTabRange(sheetId, tabName) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const sheet = metadata.data.sheets.find((s) => s.properties.title === tabName);
  if (!sheet) {
    const availableTabs = metadata.data.sheets
      .map((s) => s.properties.title)
      .join(", ");
    throw new Error(
      `Tab "${tabName}" not found. Available tabs: ${availableTabs}`
    );
  }

  return sheet.properties.title;
}

// Helper function to convert row objects to values array
function rowObjectToValues(rowObj) {
  if (Array.isArray(rowObj)) {
    return rowObj;
  }

  // For object rows, return values in key order
  return Object.values(rowObj);
}

// Helper function to get sheet headers
async function getSheetHeaders(sheetId, tabName) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  });

  const sheet = metadata.data.sheets.find((s) => s.properties.title === tabName);
  if (!sheet) {
    throw new Error(`Tab "${tabName}" not found`);
  }

  // Get first row to find headers
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!1:1`,
  });

  return response.data.values[0] || [];
}

// Helper function to find row by matching a column value
async function findRowByColumnValue(sheetId, tabName, matchColumn, matchValue) {
  const headers = await getSheetHeaders(sheetId, tabName);
  const columnIndex = headers.findIndex(
    (h) => h && h.toLowerCase() === matchColumn.toLowerCase()
  );

  if (columnIndex === -1) {
    throw new Error(
      `Column "${matchColumn}" not found. Available columns: ${headers.join(", ")}`
    );
  }

  // Get all rows
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tabName}!A:Z`,
  });

  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((row) => row[columnIndex] === matchValue);

  if (rowIndex === -1) {
    throw new Error(
      `No row found with ${matchColumn} = "${matchValue}". Are you sure this value exists?`
    );
  }

  return { rowIndex: rowIndex + 1, columnIndex, headers }; // +1 because sheet rows are 1-indexed
}

// Tool implementation
async function appendRows(args) {
  const {
    sheet_name_or_id: sheetNameOrId,
    tab_name: tabName = "Sheet1",
    rows,
  } = args;

  if (!sheetNameOrId) {
    throw new Error("sheet_name_or_id is required");
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("rows must be a non-empty array");
  }

  try {
    // Resolve sheet name to ID if needed
    const sheetId = await resolveSheetId(sheetNameOrId);
    console.error(`[DEBUG] Resolved sheet "${sheetNameOrId}" to ID: ${sheetId}`);

    // Verify tab exists
    const validatedTabName = await findTabRange(sheetId, tabName);
    console.error(`[DEBUG] Found tab: ${validatedTabName}`);

    // Convert row objects to values
    const values = rows.map(rowObjectToValues);
    console.error(`[DEBUG] Converted ${values.length} rows to append`);

    // Append rows to the sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${validatedTabName}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    console.error(`[DEBUG] Successfully appended rows to sheet`);
    return {
      type: "text",
      text: `Successfully appended ${response.data.updates.updatedRows} row(s) to "${validatedTabName}" in sheet "${sheetNameOrId}". Updated range: ${response.data.updates.updatedRange}`,
    };
  } catch (error) {
    console.error(`[ERROR] Failed to append rows: ${error.message}`);
    console.error(`[ERROR] Full error:`, error);
    throw new Error(`Failed to append rows: ${error.message}`);
  }
}

// Tool implementation for deleting a row
async function deleteRow(args) {
  const {
    sheet_name_or_id: sheetNameOrId,
    tab_name: tabName = "Sheet1",
    match_column: matchColumn,
    match_value: matchValue,
  } = args;

  if (!sheetNameOrId) {
    throw new Error("sheet_name_or_id is required");
  }

  if (!matchColumn || !matchValue) {
    throw new Error("match_column and match_value are required to find the row");
  }

  try {
    // Resolve sheet name to ID if needed
    const sheetId = await resolveSheetId(sheetNameOrId);
    console.error(
      `[DEBUG] Resolved sheet "${sheetNameOrId}" to ID: ${sheetId}`
    );

    // Find the row by matching column value
    const { rowIndex } = await findRowByColumnValue(
      sheetId,
      tabName,
      matchColumn,
      matchValue
    );
    console.error(
      `[DEBUG] Found row ${rowIndex} with ${matchColumn} = "${matchValue}" to delete`
    );

    // Delete the row
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    });

    const sheet = metadata.data.sheets.find((s) => s.properties.title === tabName);
    const sheetId_num = sheet.properties.sheetId;

    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId_num,
                dimension: "ROWS",
                startIndex: rowIndex - 1, // -1 because API is 0-indexed
                endIndex: rowIndex, // Delete just this one row
              },
            },
          },
        ],
      },
    });

    console.error(`[DEBUG] Successfully deleted row`);
    return {
      type: "text",
      text: `Successfully deleted the row where ${matchColumn} = "${matchValue}" from tab "${tabName}".`,
    };
  } catch (error) {
    console.error(`[ERROR] Failed to delete row: ${error.message}`);
    console.error(`[ERROR] Full error:`, error);
    throw new Error(`Failed to delete row: ${error.message}`);
  }
}

// Tool implementation for updating a cell
async function updateRow(args) {
  const {
    sheet_name_or_id: sheetNameOrId,
    tab_name: tabName = "Sheet1",
    match_column: matchColumn,
    match_value: matchValue,
    update_column: updateColumn,
    new_value: newValue,
  } = args;

  if (!sheetNameOrId) {
    throw new Error("sheet_name_or_id is required");
  }

  if (!matchColumn || !matchValue) {
    throw new Error("match_column and match_value are required to find the row");
  }

  if (!updateColumn || newValue === undefined) {
    throw new Error("update_column and new_value are required");
  }

  try {
    // Resolve sheet name to ID if needed
    const sheetId = await resolveSheetId(sheetNameOrId);
    console.error(
      `[DEBUG] Resolved sheet "${sheetNameOrId}" to ID: ${sheetId}`
    );

    // Find the row by matching column value
    const { rowIndex, columnIndex, headers } = await findRowByColumnValue(
      sheetId,
      tabName,
      matchColumn,
      matchValue
    );
    console.error(
      `[DEBUG] Found row ${rowIndex} with ${matchColumn} = "${matchValue}"`
    );

    // Find the column to update
    const updateColumnIndex = headers.findIndex(
      (h) => h && h.toLowerCase() === updateColumn.toLowerCase()
    );

    if (updateColumnIndex === -1) {
      throw new Error(
        `Column "${updateColumn}" not found. Available columns: ${headers.join(", ")}`
      );
    }

    // Convert row index to A1 notation
    const cellColumn = String.fromCharCode(65 + updateColumnIndex); // A=65
    const cellAddress = `${tabName}!${cellColumn}${rowIndex}`;

    console.error(`[DEBUG] Updating cell ${cellAddress} to "${newValue}"`);

    // Update the cell
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: cellAddress,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[newValue]],
      },
    });

    console.error(`[DEBUG] Successfully updated cell`);
    return {
      type: "text",
      text: `Successfully updated ${updateColumn} to "${newValue}" for the row where ${matchColumn} = "${matchValue}" in tab "${tabName}".`,
    };
  } catch (error) {
    console.error(`[ERROR] Failed to update row: ${error.message}`);
    console.error(`[ERROR] Full error:`, error);
    throw new Error(`Failed to update row: ${error.message}`);
  }
}

// Initialize MCP server with tools capability
const server = new Server(
  { name: "google-sheets-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Register list_tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "append_rows",
        description:
          "Append rows to a Google Sheet. Specify the sheet by name or ID, and the tab name. Rows can be arrays or objects with keys as column headers.",
        inputSchema: {
          type: "object",
          properties: {
            sheet_name_or_id: {
              type: "string",
              description:
                "The name or ID of the Google Sheet. If a name, must be exact. If an ID, must be the long alphanumeric identifier from the sheet URL.",
            },
            tab_name: {
              type: "string",
              description:
                'The name of the worksheet tab to append to (e.g., "Sheet1"). Defaults to "Sheet1".',
              default: "Sheet1",
            },
            rows: {
              type: "array",
              description:
                "Array of rows to append. Each row can be an array of values or an object with keys as column headers. Objects will be converted to arrays using their value order.",
              items: {
                oneOf: [
                  {
                    type: "array",
                    items: {
                      type: ["string", "number", "boolean", "null"],
                    },
                  },
                  {
                    type: "object",
                  },
                ],
              },
            },
          },
          required: ["sheet_name_or_id", "rows"],
        },
      },
      {
        name: "update_row",
        description:
          "Update a cell in a Google Sheet by finding a row that matches a column value. Useful for updating application status, interview dates, or other fields for existing entries.",
        inputSchema: {
          type: "object",
          properties: {
            sheet_name_or_id: {
              type: "string",
              description:
                "The name or ID of the Google Sheet. If a name, must be exact. If an ID, must be the long alphanumeric identifier from the sheet URL.",
            },
            tab_name: {
              type: "string",
              description:
                'The name of the worksheet tab to update (e.g., "Sheet1"). Defaults to "Sheet1".',
              default: "Sheet1",
            },
            match_column: {
              type: "string",
              description:
                "The column to search in (e.g., 'Company'). The tool will find the first row where this column matches the match_value.",
            },
            match_value: {
              type: "string",
              description:
                "The value to search for in the match_column (e.g., 'Google'). This identifies which row to update.",
            },
            update_column: {
              type: "string",
              description:
                "The column to update (e.g., 'Status'). This is where the new_value will be written.",
            },
            new_value: {
              type: "string",
              description:
                "The new value to write to the update_column (e.g., 'Interview Scheduled'). Can be any text, including dropdown values.",
            },
          },
          required: [
            "sheet_name_or_id",
            "match_column",
            "match_value",
            "update_column",
            "new_value",
          ],
        },
      },
      {
        name: "delete_row",
        description:
          "Delete a row from a Google Sheet by finding a row that matches a column value. Useful for removing rejected applications or duplicate entries.",
        inputSchema: {
          type: "object",
          properties: {
            sheet_name_or_id: {
              type: "string",
              description:
                "The name or ID of the Google Sheet. If a name, must be exact. If an ID, must be the long alphanumeric identifier from the sheet URL.",
            },
            tab_name: {
              type: "string",
              description:
                'The name of the worksheet tab to delete from (e.g., "Sheet1"). Defaults to "Sheet1".',
              default: "Sheet1",
            },
            match_column: {
              type: "string",
              description:
                "The column to search in (e.g., 'Company'). The tool will find the first row where this column matches the match_value and delete it.",
            },
            match_value: {
              type: "string",
              description:
                "The value to search for in the match_column (e.g., 'Google'). This identifies which row to delete.",
            },
          },
          required: [
            "sheet_name_or_id",
            "match_column",
            "match_value",
          ],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error(`[DEBUG] Tool request received: ${request.params.name}`);
  console.error(`[DEBUG] Arguments:`, JSON.stringify(request.params.arguments, null, 2));

  if (request.params.name === "append_rows") {
    try {
      const result = await appendRows(request.params.arguments);
      console.error(`[DEBUG] Tool call succeeded`);
      return result;
    } catch (error) {
      console.error(`[ERROR] Tool call failed with error:`, error);
      return {
        type: "text",
        text: `Error: ${error.message}`,
        isError: true,
      };
    }
  } else if (request.params.name === "update_row") {
    try {
      const result = await updateRow(request.params.arguments);
      console.error(`[DEBUG] Tool call succeeded`);
      return result;
    } catch (error) {
      console.error(`[ERROR] Tool call failed with error:`, error);
      return {
        type: "text",
        text: `Error: ${error.message}`,
        isError: true,
      };
    }
  } else if (request.params.name === "delete_row") {
    try {
      const result = await deleteRow(request.params.arguments);
      console.error(`[DEBUG] Tool call succeeded`);
      return result;
    } catch (error) {
      console.error(`[ERROR] Tool call failed with error:`, error);
      return {
        type: "text",
        text: `Error: ${error.message}`,
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Run server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Google Sheets MCP server running on stdio");
}

main().catch(console.error);
