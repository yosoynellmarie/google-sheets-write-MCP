# Google Sheets MCP — Complete Setup Guide

This guide walks you through setting up the Google Sheets MCP from scratch, even if you're not technical. Follow each step in order.

## Step 1: Install Node.js

The MCP server runs on Node.js, which you need to install first.

### On Mac:
1. Go to https://nodejs.org
2. Click the **LTS** (Long Term Support) button — this is the stable version
3. Open the downloaded `.pkg` file
4. Follow the installation wizard (click "Continue" through all screens)
5. When done, open Terminal and verify it worked by typing:
   ```bash
   node --version
   ```
   You should see a version number like `v20.x.x`

### On Windows:
1. Go to https://nodejs.org
2. Click the **LTS** button
3. Open the downloaded `.msi` installer
4. Follow the installation wizard
5. When done, open Command Prompt and type:
   ```bash
   node --version
   ```
   You should see a version number

### On Linux:
```bash
# Ubuntu/Debian:
sudo apt update
sudo apt install nodejs npm

# Verify:
node --version
```

---

## Step 2: Get the MCP Code

You have two options:

### Option A: Clone from GitHub (Recommended)
If you have Git installed:
```bash
git clone git@github.com:yosoynellmarie/google-sheets-write-MCP.git
cd google-sheets-write-MCP
```

### Option B: Download as ZIP
1. Go to https://github.com/yosoynellmarie/google-sheets-write-MCP
2. Click the green **Code** button
3. Click **Download ZIP**
4. Extract the ZIP file
5. Open Terminal/Command Prompt and navigate to the folder:
   ```bash
   cd path/to/google-sheets-write-MCP
   ```

---

## Step 3: Install Dependencies

In the terminal (in the MCP folder), run:
```bash
npm install
```

This downloads all the required packages. You'll see a progress bar — wait for it to complete.

---

## Step 4: Set Up Google Cloud Project

You need a Google Cloud project to authenticate with Google Sheets.

### 4a. Create a Google Cloud Project
1. Go to https://console.cloud.google.com
2. If you don't have a Google Cloud account, click **Sign up**
3. At the top, click the project dropdown (next to "Google Cloud")
4. Click **NEW PROJECT**
5. Name it something like "Google Sheets MCP"
6. Click **CREATE**
7. Wait for the project to be created (1-2 minutes)

### 4b. Enable Required APIs
1. In the Google Cloud Console, use the search bar at the top
2. Search for **"Google Sheets API"**
3. Click the result and click **ENABLE**
4. Search for **"Google Drive API"**
5. Click the result and click **ENABLE**

---

## Step 5: Create a Service Account

A service account is like a robot account that will access your Google Sheets.

1. In Google Cloud Console, go to **Service Accounts** (use the search bar)
2. Click **CREATE SERVICE ACCOUNT**
3. Fill in the form:
   - **Service account name:** `sheets-mcp-writer` (or any name you like)
   - **Service account ID:** Auto-fills, you can leave it as is
   - **Description:** "MCP server for Google Sheets" (optional)
4. Click **CREATE AND CONTINUE**
5. On the next screen, you can skip the optional steps — click **CONTINUE**
6. Click **DONE**

### Create a Key for the Service Account
1. You'll see your service account listed. Click on it to open it
2. Go to the **KEYS** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON**
5. Click **CREATE**
6. A file called `credentials.json` will download to your computer

**IMPORTANT:** Keep this file secret. Don't share it or commit it to public GitHub repositories.

---

## Step 6: Add the Credentials File

1. Take the downloaded `credentials.json` file
2. Copy it into the MCP folder (same folder as `index.js` and `README.md`)
3. That's it — the MCP will now find it automatically

---

## Step 7: Share Your Google Sheet with the Service Account

The service account needs permission to access your Google Sheets.

### 7a. Find the Service Account Email
1. Open `credentials.json` with a text editor
2. Look for the line that says `"client_email"`
3. Copy that email address (it looks like `sheets-mcp-writer@...iam.gserviceaccount.com`)

### 7b. Share Your Sheet
1. Open the Google Sheet you want to use with the MCP
2. Click the **Share** button (top-right)
3. Paste the service account email into the "Add people" field
4. Change the permission to **Editor** (from the dropdown)
5. Uncheck "Notify people" (the service account won't receive emails)
6. Click **Share**

Done! The service account now has access to your sheet.

---

## Step 8: Test the MCP Locally

Before setting it up in Claude, test it manually.

1. Open Terminal/Command Prompt
2. Navigate to the MCP folder
3. Run:
   ```bash
   node index.js
   ```
4. You should see:
   ```
   Google Sheets MCP server running on stdio
   ```
5. Press `Ctrl+C` to stop it

If you see an error, see the **Troubleshooting** section below.

---

## Step 9: Add the MCP to Claude Desktop

### 9a. Find the Config File
The config file location depends on your OS:

**On Mac:**
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

**On Windows:**
```
C:\Users\[YourUsername]\AppData\Local\Claude\claude_desktop_config.json
```

**On Linux:**
```
~/.config/Claude/claude_desktop_config.json
```

### 9b. Edit the Config
1. Open the config file with a text editor
2. Find the `"mcpServers"` section (if it doesn't exist, create it)
3. Add this inside `mcpServers`:
   ```json
   "google-sheets": {
     "command": "node",
     "args": ["/path/to/google-sheets-write-MCP/index.js"]
   }
   ```
   **Replace `/path/to/google-sheets-write-MCP` with the actual path to your MCP folder**
   
   Example on Mac:
   ```json
   "google-sheets": {
     "command": "node",
     "args": ["/Users/daniella/google-sheets-write-MCP/index.js"]
   }
   ```

4. Save the file
5. **Completely close and reopen Claude Desktop**

### 9c. Verify It's Loaded
1. Open Claude Desktop
2. Open Claude Code or start a chat
3. Look for the MCP tools listed (you should see `append_rows`, `update_row`, `delete_row`)

---

## Step 10: Start Using It!

You can now ask Claude to:
- _"Add a new row to my 'Project Tracker' sheet"_
- _"Update the status to 'Done' for the task named 'Design Database'"_
- _"Remove the row where Company is 'Acme Corp'"_

The MCP will handle talking to Google Sheets automatically!

---

## Troubleshooting

### "credentials.json not found"
- Make sure `credentials.json` is in the same folder as `index.js`
- Check the file name — it must be exactly `credentials.json`
- If it's `credentials (1).json` or similar, rename it

### "No Google account found" when sharing
- The service account email might be wrong
- Check the `client_email` in your `credentials.json` file
- Try sharing again with the correct email

### "Permission denied" errors
- Make sure the sheet is shared with the service account email
- Check that the permission level is **Editor** (not Viewer)
- Wait 1-2 minutes after sharing for permissions to sync

### "Tab not found"
- Check the exact spelling of the tab name
- Tab names are case-sensitive
- Look at your sheet — what is the exact name of the tab?

### The MCP won't load in Claude
- Make sure Claude Desktop is completely closed, not just minimized
- Check the file path in `claude_desktop_config.json` — it must be correct
- On Mac, paths starting with `~` sometimes cause issues — use the full path instead

### Still stuck?
- Check that Node.js is installed: `node --version`
- Check that dependencies are installed: `npm list`
- Look at the error message carefully — it usually tells you what's wrong

---

## Next Steps

Once you have the MCP working, you can:

- **Automate your workflow** — Set up Claude to automatically read your email and update sheets
- **Create custom prompts** — Tell Claude exactly how to parse and update your data
- **Integrate with other services** — Combine with other MCPs for more powerful automation

See the `README.md` for more details on the available tools and use cases.
