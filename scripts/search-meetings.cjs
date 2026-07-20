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
    if (arg === '--query' && i + 1 < argv.length) { args.query = argv[++i]; }
    else if (arg === '--from' && i + 1 < argv.length) { args.from = argv[++i]; }
    else if (arg === '--to' && i + 1 < argv.length) { args.to = argv[++i]; }
    else if (arg === '--name' && i + 1 < argv.length) { args.name = argv[++i]; }
    else if (arg === '--list') { args.list = true; }
  }
  return args;
}

function dateInRange(dateStr, from, to) {
  if (!from && !to) return true;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

function nameMatches(meetingName, filter) {
  if (!filter) return true;
  return meetingName.toLowerCase().includes(filter.toLowerCase());
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function searchFile(filePath, regex, contextLines) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches = [];

  for (let i = 0; i < lines.length; i++) {
    if (regex.test(lines[i])) {
      const start = Math.max(0, i - contextLines);
      const end = Math.min(lines.length - 1, i + contextLines);
      const context = lines.slice(start, end + 1);
      matches.push({
        line: i + 1,
        match: lines[i].trim(),
        context: context.join('\n'),
      });
    }
  }

  return matches;
}

function searchMeetings() {
  const args = parseArgs(process.argv);

  if (!args.query && !args.list) {
    console.error('Usage: search-meetings.cjs --query <search term> [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--name <filter>]');
    console.error('       search-meetings.cjs --list [--from YYYY-MM-DD] [--to YYYY-MM-DD] [--name <filter>]');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log(JSON.stringify({ results: [], total: 0 }));
    return;
  }

  const searchFiles = ['transcript.md', 'summary.md', 'action-points.md'];
  const results = [];
  const regex = args.query ? new RegExp(escapeRegex(args.query), 'gi') : null;

  // Traverse meetings/{YYYY-MM}/{DD}/{name}/
  const yearMonths = fs.readdirSync(OUTPUT_DIR).filter(d => /^\d{4}-\d{2}$/.test(d));

  for (const ym of yearMonths) {
    const ymPath = path.join(OUTPUT_DIR, ym);
    if (!fs.statSync(ymPath).isDirectory()) continue;

    const days = fs.readdirSync(ymPath).filter(d => /^\d{2}$/.test(d));

    for (const day of days) {
      const dayPath = path.join(ymPath, day);
      if (!fs.statSync(dayPath).isDirectory()) continue;

      const dateStr = `${ym}-${day}`;
      if (!dateInRange(dateStr, args.from, args.to)) continue;

      const names = fs.readdirSync(dayPath);

      for (const name of names) {
        const meetingPath = path.join(dayPath, name);
        if (!fs.statSync(meetingPath).isDirectory()) continue;

        if (!nameMatches(name, args.name)) continue;

        if (args.list) {
          const files = fs.readdirSync(meetingPath).filter(f => f !== 'metadata.json');
          results.push({
            date: dateStr,
            name,
            path: meetingPath,
            files,
          });
          continue;
        }

        for (const filename of searchFiles) {
          const filePath = path.join(meetingPath, filename);
          if (!fs.existsSync(filePath)) continue;

          const matches = searchFile(filePath, regex, 2);
          if (matches.length > 0) {
            results.push({
              date: dateStr,
              meeting: name,
              file: filename,
              filePath,
              matches,
            });
          }
        }
      }
    }
  }

  results.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateB.localeCompare(dateA);
  });

  const totalMatches = results.reduce((sum, r) => sum + (r.matches ? r.matches.length : 0), 0);

  console.log(JSON.stringify({ query: args.query, results, total: totalMatches }, null, 2));
}

searchMeetings();
