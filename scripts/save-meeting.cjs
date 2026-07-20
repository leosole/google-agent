#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT_DIR, 'output', 'meetings');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--name' && i + 1 < argv.length) { args.name = argv[++i]; }
    else if (arg === '--date' && i + 1 < argv.length) { args.date = argv[++i]; }
    else if (arg === '--type' && i + 1 < argv.length) { args.type = argv[++i]; }
    else if (arg === '--file' && i + 1 < argv.length) { args.file = argv[++i]; }
    else if (arg === '--participants' && i + 1 < argv.length) { args.participants = argv[++i]; }
    else if (arg === '--tags' && i + 1 < argv.length) { args.tags = argv[++i]; }
    else if (arg === '--content' && i + 1 < argv.length) { args.content = argv[++i]; }
  }
  return args;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getMeetingDir(name, dateStr) {
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  const day = String(date.getDate()).padStart(2, '0');
  return path.join(OUTPUT_DIR, yearMonth, day, slugify(name));
}

function getFileExtension(type) {
  if (type === 'metadata') return 'json';
  return 'md';
}

function getFilename(type) {
  const map = {
    transcript: 'transcript.md',
    summary: 'summary.md',
    actions: 'action-points.md',
    metadata: 'metadata.json',
  };
  return map[type] || `${type}.md`;
}

function readContentFromFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    console.error(`File not found: ${resolved}`);
    process.exit(1);
  }
  return fs.readFileSync(resolved, 'utf-8');
}

function readContentFromStdin() {
  const chunks = [];
  const fd = fs.openSync('/dev/stdin', 'r');
  const buf = Buffer.alloc(1024);
  let bytesRead;
  while ((bytesRead = fs.readSync(fd, buf, 0, 1024)) > 0) {
    chunks.push(buf.slice(0, bytesRead));
  }
  fs.closeSync(fd);
  return Buffer.concat(chunks).toString('utf-8').trim();
}

function buildMetadata(args) {
  return {
    name: args.name,
    date: args.date || new Date().toISOString().slice(0, 10),
    participants: args.participants ? args.participants.split(',').map(s => s.trim()) : [],
    tags: args.tags ? args.tags.split(',').map(s => s.trim()) : [],
    createdAt: new Date().toISOString(),
  };
}

function main() {
  const args = parseArgs(process.argv);

  if (!args.name) {
    console.error('Usage: save-meeting.cjs --name <meeting-name> --type <transcript|summary|actions|metadata> [--date YYYY-MM-DD] [--file <path>] [--content <string>] [--participants "A,B"] [--tags "x,y"]');
    process.exit(1);
  }

  if (!args.type) {
    console.error('Error: --type is required (transcript|summary|actions|metadata)');
    process.exit(1);
  }

  const validTypes = ['transcript', 'summary', 'actions', 'metadata'];
  if (!validTypes.includes(args.type)) {
    console.error(`Error: --type must be one of: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  const meetingDir = getMeetingDir(args.name, args.date);
  fs.mkdirSync(meetingDir, { recursive: true });

  let content;

  if (args.type === 'metadata') {
    const metaPath = path.join(meetingDir, 'metadata.json');
    let existing = {};
    if (fs.existsSync(metaPath)) {
      existing = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
    const metadata = { ...existing, ...buildMetadata(args) };
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2) + '\n');
    console.log(JSON.stringify({ saved: metaPath, metadata }));
    return;
  }

  if (args.file) {
    content = readContentFromFile(args.file);
  } else if (args.content) {
    content = args.content;
  } else {
    content = readContentFromStdin();
  }

  if (!content) {
    console.error('Error: No content provided. Use --file, --content, or pipe via stdin.');
    process.exit(1);
  }

  const filename = getFilename(args.type);
  const filePath = path.join(meetingDir, filename);
  fs.writeFileSync(filePath, content);

  console.log(JSON.stringify({ saved: filePath, type: args.type, meetingDir }));
}

main();
