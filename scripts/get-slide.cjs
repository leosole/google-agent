#!/usr/bin/env node
// Get details about a specific slide (elements, positions, text).
// Usage: node scripts/get-slide.cjs <presentation_id> <slide_id>

const http = require('http');

const PRESENTATION_ID = process.argv[2];
const SLIDE_ID = process.argv[3];

if (!PRESENTATION_ID || !SLIDE_ID) {
  console.error('Usage: node get-slide.cjs <presentation_id> <slide_id>');
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
    clientInfo: { name: 'get-slide', version: '1.0' }
  });
  const sessionId = initResult._sessionId;
  await mcpCall('notifications/initialized', {}, sessionId);

  const getResult = await mcpCall('tools/call', {
    name: 'get_page',
    arguments: {
      presentation_id: PRESENTATION_ID,
      page_id: SLIDE_ID
    }
  }, sessionId);

  if (getResult.result && getResult.result.content) {
    getResult.result.content.forEach(c => console.log(c.text));
  } else {
    console.log(JSON.stringify(getResult, null, 2));
  }
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
