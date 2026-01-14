/**
 * LiquidCrypto Smart Sheet Bridge
 * =============================
 * INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code and paste this entire file
 * 4. Save the project as "SmartSheetBridge"
 * 5. Refresh your spreadsheet to see the "LiquidCrypto" menu
 */

// Configuration - Replace with your deployed LiquidCrypto API URL if self-hosting
const CONFIG = {
    API_ENDPOINT: 'https://api.liquidcrypto.com/agent/bridge', // Placeholder
    API_KEY: 'YOUR_API_KEY_HERE' // Optional: if you require auth
};

/**
 * Creates the custom menu when the spreadsheet opens.
 */
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('LiquidCrypto')
        .addItem('✨ Run Agent Analysis', 'runAnalysis')
        .addSeparator()
        .addItem('🔄 Sync to Dashboard', 'syncData')
        .addItem('⚙️ Configure Bridge', 'showConfiguration')
        .addToUi();
}

/**
 * Collects data from the active sheet and sends it to the AI Agent for analysis.
 * The Agent can then write back results using the Google Sheets API.
 */
function runAnalysis() {
    const ui = SpreadsheetApp.getUi();
    const sheet = SpreadsheetApp.getActiveSheet();

    // Show a toast to indicate work is starting
    sheet.toast('Preparing data for AI Agent...', 'LiquidCrypto', 3);

    // Get the active range or the whole data range if single cell selected
    let range = sheet.getActiveRange();
    if (range.getNumRows() === 1 && range.getNumColumns() === 1) {
        range = sheet.getDataRange();
    }

    const payload = {
        action: 'analyze',
        docId: SpreadsheetApp.getActiveSpreadsheet().getId(),
        sheetName: sheet.getName(),
        rangeA1: range.getA1Notation(),
        headers: range.offset(0, 0, 1).getValues()[0], // Assume first row is headers
        sampleData: range.offset(1, 0, Math.min(5, range.getNumRows() - 1)).getValues(), // First 5 rows preview
        userEmail: Session.getActiveUser().getEmail()
    };

    // callAgent(payload); // Implement the actual fetch call

    // Mock response for user feedback
    ui.alert('Agent Request Sent! \n\nThe agent is analyzing your data. Updates will appear shortly.');
}

/**
 * Syncs the entire sheet context to the LiquidCrypto Dashboard.
 */
function syncData() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();

    const payload = {
        action: 'sync',
        docId: SpreadsheetApp.getActiveSpreadsheet().getId(),
        data: data,
        timestamp: new Date().toISOString()
    };

    // callAgent(payload);
    sheet.toast('Data synced to LiquidCrypto Dashboard', 'Success');
}

/**
 * Settings dialog for configuring API keys etc.
 */
function showConfiguration() {
    const html = HtmlService.createHtmlOutput(`
    <style>body { font-family: sans-serif; padding: 10px; }</style>
    <h3>Bridge Configuration</h3>
    <p>Status: <strong>Active</strong></p>
    <p>Connected to: LiquidCrypto OS</p>
    <button onclick="google.script.host.close()">Close</button>
  `)
        .setTitle('LiquidCrypto Settings')
        .setWidth(300)
        .setHeight(200);

    SpreadsheetApp.getUi().showModalDialog(html, 'LiquidCrypto Configuration');
}

/**
 * Helper to make the HTTP request to the Agent API
 */
function callAgent(payload) {
    try {
        const options = {
            'method': 'post',
            'contentType': 'application/json',
            'payload': JSON.stringify(payload),
            'muteHttpExceptions': true
        };

        // Uncomment when API is ready
        // UrlFetchApp.fetch(CONFIG.API_ENDPOINT, options);

    } catch (e) {
        Logger.log('Error calling agent: ' + e.toString());
        SpreadsheetApp.getUi().alert('Connection Error: ' + e.toString());
    }
}
