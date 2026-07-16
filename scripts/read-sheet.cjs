#!/usr/bin/env node
// Read data from a Google Sheet.
// Usage: node scripts/read-sheet.cjs <spreadsheet_id> [range_name]

const http = require('http');

const SPREADSHEET_ID = process.argv[2];
const RANGE_NAME = process.argv[3] || 'Página1';

if (!SPREADSHEET_ID) {
  console.error('Usage: node read-sheet.cjs <spreadsheet_id> [range_name]');
  process.exit(1);
}

function mcpCall(method, params, sessionId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Content-Length': Buffer.byteLength(body)
    };
    if (sessionId) headers['mcp-session-id'] = sessionId;

    const req = http.request({
      hostname: '127.0.0.1', port: 8000, path: '/mcp', method: 'POST',
      headers
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        const sessionId = res.headers['mcp-session-id'];
        const lines = buf.trim().split('\n');
        const jsonLine = lines.find(l => l.startsWith('data:'));
        if (jsonLine) {
          const result = JSON.parse(jsonLine.slice(5));
          result._sessionId = sessionId;
          resolve(result);
        } else {
          reject(new Error('No data line: ' + buf));
        }
      });
    });
    req.write(body);
    req.end();
  });
}

async function main() {
  const initResult = await mcpCall('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'read-sheet', version: '1.0' }
  });
  const sessionId = initResult._sessionId;
  await mcpCall('notifications/initialized', {}, sessionId);

  const readResult = await mcpCall('tools/call', {
    name: 'read_sheet_values',
    arguments: {
      spreadsheet_id: SPREADSHEET_ID,
      range_name: RANGE_NAME
    }
  }, sessionId);

  if (readResult.result && readResult.result.content) {
    readResult.result.content.forEach(c => console.log(c.text));
  } else {
    console.log(JSON.stringify(readResult, null, 2));
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
