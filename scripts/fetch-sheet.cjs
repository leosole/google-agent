#!/usr/bin/env node
// Fetch sheet data from workspace-mcp and save as JSON.
// Usage: node scripts/fetch-sheet.cjs <spreadsheet_id> <range_name> [output_file] [session_file]

const http = require('http')
const fs = require('fs')
const path = require('path')

const SPREADSHEET_ID = process.argv[2]
const RANGE_NAME = process.argv[3] || 'Página1'
const OUTPUT = process.argv[4] || path.join(__dirname, '..', '.tmp', 'timeline-data.json')
const SESSION_FILE = process.argv[5]

if (!SPREADSHEET_ID) {
  console.error('Usage: node fetch-sheet.cjs <spreadsheet_id> [range_name] [output_file]')
  process.exit(1)
}

const SESSION_ID = SESSION_FILE && fs.existsSync(SESSION_FILE)
  ? fs.readFileSync(SESSION_FILE, 'utf8').trim()
  : 'default-session'

function mcpCall(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params })
    const req = http.request({
      hostname: '127.0.0.1', port: 8000, path: '/mcp', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Content-Length': Buffer.byteLength(body),
        'mcp-session-id': SESSION_ID
      }
    }, res => {
      let buf = ''
      res.on('data', c => buf += c)
      res.on('end', () => {
        const lines = buf.trim().split('\n')
        const jsonLine = lines.find(l => l.startsWith('data:'))
        if (jsonLine) resolve(JSON.parse(jsonLine.slice(5)))
        else reject(new Error('No data line in response'))
      })
    })
    req.write(body)
    req.end()
  })
}

mcpCall('tools/call', {
  name: 'read_sheet_values',
  arguments: { spreadsheet_id: SPREADSHEET_ID, range_name: RANGE_NAME }
}).then(result => {
  const text = result.result.content[0].text
  const lines = text.split('\n').filter(l => l.startsWith('Row'))
  const rows = lines.map(l => {
    const m = l.match(/\[(.*?)\]/)
    return m ? m[1].split(',').map(s => s.trim().replace(/^'(.*)'$/, '$1')) : []
  })
  const headers = rows[0]
  const tasks = rows.slice(1).map(r => {
    const obj = {}
    r.forEach((v, i) => {
      const h = headers[i]
      if (h === 'Tarefa') obj.name = v
      else if (h === 'Inicio') obj.start = v
      else if (h === 'Fim') obj.end = v || null
      else if (h === 'Previsto') obj.due = v || null
      else obj[h] = v
    })
    return obj
  })
  const dir = path.dirname(OUTPUT)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(tasks), 'utf8')
  console.log(OUTPUT)
}).catch(e => { console.error('Fetch failed:', e.message); process.exit(1) })
