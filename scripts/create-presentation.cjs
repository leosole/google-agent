#!/usr/bin/env node
// Create a presentation by copying a template and modifying content.
// Usage: node scripts/create-presentation.cjs <template_id> <new_name> <data_file> [output_file]

const http = require('http');
const fs = require('fs');
const path = require('path');

const TEMPLATE_ID = process.argv[2];
const NEW_NAME = process.argv[3];
const DATA_FILE = process.argv[4];
const OUTPUT = process.argv[5] || path.join(__dirname, '..', '.tmp', 'presentation-result.json');

if (!TEMPLATE_ID || !NEW_NAME) {
  console.error('Usage: node create-presentation.cjs <template_id> <new_name> [data_file] [output_file]');
  process.exit(1);
}

function mcpCall(method, params, sessionId) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({jsonrpc: '2.0', id: Date.now(), method, params});
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
        if (jsonLine) resolve({data: JSON.parse(jsonLine.slice(5)), sessionId});
        else reject(new Error('No data line in response: ' + buf));
      });
    });
    req.write(body);
    req.end();
  });
}

// Read data file if provided
let data = null;
if (DATA_FILE && fs.existsSync(DATA_FILE)) {
  data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Initialize session and create presentation
mcpCall('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: {name: 'test', version: '1.0'}
}).then(result => {
  const sessionId = result.sessionId;
  console.log('Session ID:', sessionId);
  
  // Step 1: Copy the template
  console.log('Copying template...');
  return mcpCall('tools/call', {
    name: 'copy_drive_file',
    arguments: {
      file_id: TEMPLATE_ID,
      new_name: NEW_NAME
    }
  }, sessionId).then(result => {
    // Extract the new presentation ID from the result
    const text = result.data.result.content[0].text;
    const idMatch = text.match(/New file ID: ([^\n]+)/);
    if (!idMatch) {
      throw new Error('Could not extract new presentation ID');
    }
    const newPresentationId = idMatch[1];
    console.log('New presentation ID:', newPresentationId);
    return {sessionId, newPresentationId};
  });
}).then(({sessionId, newPresentationId}) => {
  // Step 2: Get presentation details
  console.log('Getting presentation details...');
  return mcpCall('tools/call', {
    name: 'get_presentation',
    arguments: {
      presentation_id: newPresentationId
    }
  }, sessionId).then(result => {
    const text = result.data.result.content[0].text;
    console.log('Presentation details:', text);
    return {sessionId, newPresentationId, presentationText: text};
  });
}).then(({sessionId, newPresentationId, presentationText}) => {
  // Step 3: If data is provided, create batch update requests to modify content
  if (data && data.replacements) {
    console.log('Applying content replacements...');
    
    const requests = [];
    
    // For each replacement, find the target text and replace it
    data.replacements.forEach(replacement => {
      // This is a simplified approach - in practice, you'd need to:
      // 1. Find the specific slide and element
      // 2. Replace the text while preserving formatting
      
      // For now, we'll just log the replacement
      console.log(`Would replace "${replacement.find}" with "${replacement.replace}" in slide ${replacement.slideIndex || 'all'}`);
    });
    
    if (requests.length > 0) {
      return mcpCall('tools/call', {
        name: 'batch_update_presentation',
        arguments: {
          presentation_id: newPresentationId,
          requests: requests
        }
      }, sessionId);
    }
  }
  
  return {data: {result: {content: [{text: 'No replacements applied'}]}}};
}).then(result => {
  console.log('Result:', JSON.stringify(result.data, null, 2));
  
  // Save the result
  const dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
  fs.writeFileSync(OUTPUT, JSON.stringify(result.data, null, 2), 'utf8');
  console.log('Result saved to:', OUTPUT);
}).catch(e => console.error('Error:', e.message));
