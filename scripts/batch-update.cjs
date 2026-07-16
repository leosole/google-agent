#!/usr/bin/env node
// Batch update a presentation: replace text or delete slides.
// Usage: node scripts/batch-update.cjs <presentation_id> <requests_file>

const http = require('http');
const fs = require('fs');

const PRESENTATION_ID = process.argv[2];
const REQUESTS_FILE = process.argv[3];

if (!PRESENTATION_ID || !REQUESTS_FILE) {
  console.error('Usage: node batch-update.cjs <presentation_id> <requests_file>');
  console.error('Requests file should be a JSON array of batch update requests.');
  console.error('Example for text replacement:');
  console.error('  [{"replaceAllText": {"containsText": {"text": "old"}, "replaceText": "new"}}]');
  console.error('Example for slide deletion:');
  console.error('  [{"deleteObject": {"objectId": "slide_id"}}]');
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
    clientInfo: { name: 'batch-update', version: '1.0' }
  });
  const sessionId = initResult._sessionId;
  await mcpCall('notifications/initialized', {}, sessionId);

  const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));

  const updateResult = await mcpCall('tools/call', {
    name: 'batch_update_presentation',
    arguments: {
      presentation_id: PRESENTATION_ID,
      requests: requests
    }
  }, sessionId);

  if (updateResult.result && updateResult.result.content) {
    updateResult.result.content.forEach(c => console.log(c.text));
  } else {
    console.log(JSON.stringify(updateResult, null, 2));
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
