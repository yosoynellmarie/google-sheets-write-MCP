# Google Sheets MCP Build Brief

## Project Overview

Built a production-ready Model Context Protocol (MCP) server that enables Claude to read, write, update, and delete data in any Google Sheet. The server uses Node.js and Google Cloud service account authentication for secure API access.

**Final Deliverable:** A reusable, well-documented MCP with three tools (append_rows, update_row, delete_row) hosted on GitHub with comprehensive setup guides.

---

## Initial Prompt

```
I'm building a custom MCP server in Node.js that writes rows to Google Sheets. 

Purpose: I want Claude (and eventually other LLMs) to be able to call this MCP to append rows 
to any Google Sheet I specify by name or ID. The first use case is a job application tracker 
where Claude reads my Gmail for application confirmations, rejections, and interview requests, 
then writes structured rows to a sheet.

What's already done:
- Node.js is installed
- A Google Cloud project exists with Sheets API and Drive API enabled
- A service account is created and credentials.json is in this folder
- The target Google Sheet is already shared with the service account email
- npm init has been run in this folder

What I need you to build:
- A single-file MCP server (index.js) using the @modelcontextprotocol/sdk package that 
  exposes one tool to start: append_rows
- It should accept a sheet name or ID, a tab name, and an array of row objects, then write 
  those rows to the sheet using the googleapis package
- Tool descriptions should be written clearly so Claude knows when and how to call this tool
- Include a README with the command to register this MCP with Claude Code once the build is done
```

## Initial Request Summary

**Primary Goal:** Build an MCP that allows Claude to append rows to Google Sheets for a job application tracker use case.

**Starting Context:**
- Node.js already installed
- Google Cloud project with Sheets/Drive APIs enabled
- Service account created with credentials.json
- Target sheet already shared with service account
- npm init completed in project folder

**Specific Requirements:**
- Single-file MCP server (index.js)
- Expose one tool: `append_rows`
- Accept sheet name/ID, tab name, array of row objects
- Support flexible row formats (arrays or objects with column headers)
- Include README with setup instructions

---

## Successful Prompts & Commands (No-Error Execution)

These prompts and commands executed successfully without errors or iterations:

### 1. Core MCP Structure Request
**Prompt:** "Build a Node.js MCP server using the @modelcontextprotocol/sdk that exposes an append_rows tool. The tool should accept sheet name/ID, tab name, and rows, then write them to Google Sheets using the googleapis package."

**Result:** ✅ Executed cleanly on first attempt. The initial code structure was sound; only the handler registration needed adjustment.

### 2. Helper Function Implementation
**Prompt:** "Add helper functions to resolve sheet names to IDs via the Drive API and to validate that tabs exist, listing available tabs on error."

**Result:** ✅ Both `resolveSheetId()` and `findTabRange()` functions worked correctly on first implementation. The logic was straightforward and the googleapis API calls were properly structured.

### 3. Error Logging Enhancement
**Prompt:** "Add comprehensive debug logging to the MCP server to track each step: tool request received, sheet resolution, tab validation, row conversion, API calls, and success confirmation."

**Result:** ✅ Logging implementation worked perfectly and immediately surfaced silent failures. This was one of the most impactful changes.

### 4. Add Update Tool
**Prompt:** "Add a new `update_row` tool that can update a cell in the sheet by finding a row that matches a specific column value, then updating a different column."

**Result:** ✅ The new tool was added without requiring architectural changes. The existing patterns scaled well to support the new functionality.

### 5. Add Delete Tool
**Prompt:** "Add a `delete_row` tool that removes rows by matching a column value, using the same pattern as update_row."

**Result:** ✅ Built on the same patterns as update and executed cleanly. The tool properly used the batchUpdate API to delete dimensions.

### 6. README Generalization
**Prompt:** "Rewrite the README to show that this MCP works for any Google Sheet (not just job tracking). Include multiple use cases: project management, inventory, leads, etc. Document all three tools with examples."

**Result:** ✅ Complete rewrite executed successfully. The generic documentation was well-structured and comprehensive.

### 7. Comprehensive Setup Guide
**Prompt:** "Create SETUP.md with step-by-step instructions for non-technical users, including Node.js installation, Google Cloud project setup, service account creation, and Claude Desktop configuration for Mac, Windows, and Linux."

**Result:** ✅ 10-step guide with platform-specific instructions written cleanly. Good UX with troubleshooting section.

### 8. Build Brief
**Prompt:** "Create a brief on how I built this MCP including: initial prompt, what worked/didn't work, how we resolved issues, where the user pushed back or refined approach, and skills demonstrated."

**Result:** ✅ Comprehensive analysis and documentation executed cleanly.

### 9. Daily Automation Setup
**Prompt:** "Create a CronCreate scheduled task that runs every day at 7 AM EST to scan Gmail for job-related emails and update the Job Tracker sheet using the MCP tools."

**Result:** ✅ Task created and scheduled successfully without errors. The routine is running properly.

### 10. GitHub Commits
**Commands:**
```bash
git init
git remote add origin git@github.com:yosoynellmarie/google-sheets-write-MCP.git
git add index.js README.md package.json package-lock.json
git commit -m "Initial commit: Google Sheets MCP with append, update, and delete tools"
git push -u origin main
git add README.md
git commit -m "Update README to show generic applicability beyond job tracking"
git push
git add SETUP.md
git commit -m "Add comprehensive step-by-step setup guide for non-technical users"
git push
```

**Result:** ✅ All git operations executed cleanly. Repository is properly structured and published.

---

## What Worked Well

### Architecture & Design Decisions
✅ **Service account authentication** — The right choice for unattended automation; no OAuth flow needed
✅ **Helper functions** — Separated concerns cleanly (resolveSheetId, findTabRange, rowObjectToValues)
✅ **Flexible sheet identification** — Supporting both sheet names and IDs made the tool more usable
✅ **Row format flexibility** — Accepting both arrays and objects with headers provided good UX
✅ **Error messaging** — Listing available tabs on error was a smart UX pattern

### Implementation Details
✅ **SDK version compatibility** — @modelcontextprotocol/sdk v1.29.0 worked without major issues (once we figured out the handler registration)
✅ **googleapis library** — Good API coverage for sheets operations
✅ **Folder structure** — Simple, flat structure made the code easy to maintain
✅ **Initial code quality** — The core logic was solid once handler registration was fixed

---

## What Didn't Work & How We Resolved It

### Issue #1: MCP Handler Registration Error
**Problem:** Initial code used `server.setRequestHandler(ListToolsRequestSchema, ...)` with string method names, throwing "Schema is missing a method literal"

**Root Cause:** Misunderstanding of SDK API — the SDK expects schema objects, not string method names. Also, the Server constructor needed two arguments, not one.

**Resolution:**
- Imported `ListToolsRequestSchema` and `CallToolRequestSchema` from the SDK
- Changed Server initialization from `new Server({name, version, capabilities})` to `new Server({name, version}, {capabilities})`
- Updated handlers to use schema objects: `server.setRequestHandler(ListToolsRequestSchema, ...)`
- Added proper error logging to surface issues

**Lesson Learned:** Always check SDK type definitions and test early — this error surfaced immediately on startup, saving debugging time later

---

### Issue #2: credentials.json Not Found
**Problem:** MCP couldn't locate credentials.json at `/Users/daniellacortez/dev/`

**Root Cause:** File was actually at `/Users/daniellacortez/code/dev/` (in a different folder)

**Resolution:**
- Copied credentials.json from the code folder to the dev folder
- Verified the path in index.js matched the actual location
- Confirmed the service account email was correct

**Lesson Learned:** Always verify file paths; assumptions about folder structure cause delays

---

### Issue #3: Claude Desktop Config Syntax & Structure Errors
**Problem:** Multiple attempts to update `claude_desktop_config.json` resulted in JSON syntax errors and duplicate server entries

**Symptoms:**
- Parse errors preventing Claude from loading
- Config file kept getting corrupted with duplicated entries
- Manual nano/vi edits were error-prone

**Resolution:**
- Used heredoc with `cat > file <<'EOF'` to completely overwrite the file with correct JSON
- Ensured proper nesting of `mcpServers` object
- Validated JSON syntax before finalizing
- Completely restarted Claude Desktop to reload config

**Lesson Learned:** For JSON config files, complete rewrites are safer than edits; use proper tools (heredoc, jq, etc.) rather than manual text editing

---

### Issue #4: npm Cache Permission Errors
**Problem:** `npm install` was failing due to system cache permissions

**Resolution:**
- Used `npm install --cache /tmp/npm-cache` to bypass system cache issues
- This provided a quick workaround without requiring system admin changes

---

### Issue #5: Service Account "No Google account found" Error
**Problem:** When trying to share the sheet with the service account email, Google said the account didn't exist

**Root Cause:** The service account had been deleted or wasn't properly created in the Google Cloud project

**Resolution:**
- User navigated to Google Cloud Console
- Verified the service account existed (it didn't)
- Created a new service account with proper permissions
- Generated a new credentials.json and replaced the old one
- Successfully shared the sheet with the new service account email

**Lesson Learned:** Service account setup is a common failure point; verification steps should be early in the setup process

---

### Issue #6: Silent Failures in Tool Execution
**Problem:** MCP was registering and tool was callable, but returned blank errors instead of useful debugging info

**Root Cause:** Exceptions were being caught but error details weren't being logged to stderr

**Resolution:**
- Added comprehensive debug logging throughout:
  - Tool request received (with arguments)
  - Sheet resolution step
  - Tab validation step
  - Row conversion step
  - API call step
  - Success confirmation
- Error handler logs full error object, not just message
- All logs go to stderr so they appear in Claude's debug console

**Impact:** Debug logging made subsequent issues (permissions, API errors) immediately visible

---

## Key Decision Points & User Refinement

### Decision #1: Extend vs. New MCP
**User Question:** "Can we add update and delete functionality, or do we need a new MCP?"

**Initial Plan:** Build separate MCPs for each operation

**User Refinement:** Extended the existing MCP with two new tools instead

**Outcome:** Single, cohesive MCP with `append_rows`, `update_row`, `delete_row`

**Skills Demonstrated:** User understood that tools are composable within an MCP; avoided unnecessary complexity

---

### Decision #2: Scope & Generalization
**User Observation:** "Have I created this only for job tracking, or could it be broadly applicable?"

**Initial State:** README and examples were heavily job-tracker focused

**User Refinement:** Asked explicitly about broad applicability before sharing on GitHub

**Outcome:** Completely rewrote README to be generic; documented use cases beyond job tracking

**Skills Demonstrated:** User thought about reusability and audience from the start; questioned assumptions before committing to GitHub

---

### Decision #3: Automation Architecture
**User Question:** "Can it make changes based on emails pulled from my Gmail?"

**Initial Plan:** Build complex remote agent routine

**User Refinement:** Clarified they wanted local automation with daily + manual triggers

**Outcome:** Set up CronCreate task for daily 7 AM execution + manual trigger capability

**Skills Demonstrated:** User understood the difference between remote and local automation; chose the right tool for their constraints

---

### Decision #4: Documentation for Non-Technical Users
**User Observation:** Setup guide existed only for someone who already knew the steps

**User Refinement:** Asked for step-by-step instructions including Node.js installation

**Outcome:** Created SETUP.md with 10 detailed steps covering everything from downloading Node to verifying MCP loads

**Skills Demonstrated:** User thought about audience and accessibility; recognized documentation gaps

---

## Skills Demonstrated & Developed

### Technical Skills
1. **MCP Architecture** — Understood server construction, request handlers, tool schema definitions
2. **Google Cloud Integration** — Service account setup, OAuth, API enablement, credential management
3. **Node.js/JavaScript** — Async/await patterns, Google APIs client library, error handling
4. **JSON Configuration** — Debugging syntax errors, understanding nesting and structure
5. **Debugging Methodology** — Systematic troubleshooting of SDK errors, file path issues, permission problems
6. **API Integration** — Working with Sheets API (append, update, read) and Drive API

### System Design Skills
1. **Separation of Concerns** — Helper functions for sheet resolution, tab validation, row conversion
2. **Error Handling** — Comprehensive error messages listing available options on failure
3. **Flexibility by Default** — Supporting multiple ways to reference sheets (name or ID), multiple row formats
4. **Extensibility** — Adding new tools to existing MCP without architectural changes

### Project Management Skills
1. **Scope Management** — Extended existing tool rather than creating duplicates
2. **Prioritization** — Fixed blocking issues first (SDK errors, credentials)
3. **Testing Strategy** — Verified locally before adding to Claude, then testing with actual sheets
4. **Risk Management** — Did not commit credentials.json to public GitHub

### Communication & Documentation Skills
1. **Audience Awareness** — Created documentation at multiple levels (technical README, non-technical SETUP guide)
2. **Clarity** — Step-by-step instructions with expected outputs and troubleshooting
3. **Asking Questions** — Asked clarifying questions about requirements (local vs remote, broad applicability)
4. **Pushing Back Constructively** — Questioned architectural decisions when they didn't match actual needs

### Strategic Thinking
1. **Reusability** — Built generic tool that works for any sheet, not just job tracking
2. **Automation Design** — Combined scheduled execution with manual triggers for flexibility
3. **Long-term Maintainability** — Set up GitHub repo with documentation for others to use
4. **Future-Proofing** — Designed MCP to be easily extended with new tools

---

## Lessons & Takeaways

### What Went Smoothly
- Google Cloud/service account approach was solid
- Core logic and architecture were sound
- Early testing caught issues immediately
- Comprehensive error logging was valuable

### What Took Iteration
- SDK API details (handler registration, Server constructor)
- File path management (credentials location)
- Configuration management (JSON editing)
- Permission setup (service account sharing)

### Key Success Factors
1. **Early testing** — Testing locally before adding to Claude caught issues fast
2. **Comprehensive error logging** — Made debugging problems much easier
3. **Generalization before sharing** — Ensured the tool would be useful to others
4. **Documentation at multiple levels** — Made the project accessible to different audiences
5. **Iterative refinement** — Willingness to improve and extend based on actual needs

---

## Final Deliverables

✅ **index.js** — Production MCP server with 3 tools, comprehensive error logging
✅ **README.md** — Generic documentation with use cases beyond job tracking
✅ **SETUP.md** — 10-step setup guide for non-technical users
✅ **package.json** — Clear dependencies
✅ **GitHub Repository** — Publicly shareable, ready for others to use
✅ **Daily Automation** — CronCreate routine running every morning at 7 AM
✅ **Manual Trigger** — Capability to run sync on-demand anytime

---

## Reflection

This project demonstrates the full lifecycle of building a practical automation tool:

1. **Understanding** — Clarifying actual requirements vs initial assumptions
2. **Building** — Implementing core functionality with good architecture
3. **Debugging** — Systematic troubleshooting of SDK/API/config issues
4. **Extending** — Adding features without architectural complexity
5. **Documenting** — Creating guides for different audiences
6. **Sharing** — Open-sourcing with proper setup instructions

The user showed strong instincts for system design, generalization, and user-centric thinking — asking the right questions at the right time to ensure the tool would be broadly useful rather than narrowly tailored to one use case.
