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
    if (arg === '--from' && i + 1 < argv.length) { args.from = argv[++i]; }
    else if (arg === '--to' && i + 1 < argv.length) { args.to = argv[++i]; }
    else if (arg === '--name' && i + 1 < argv.length) { args.name = argv[++i]; }
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

function listMeetings() {
  const args = parseArgs(process.argv);

  if (!fs.existsSync(OUTPUT_DIR)) {
    console.log('[]');
    return;
  }

  const meetings = [];

  // Structure: meetings/{YYYY-MM}/{DD}/{name}/
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

        const files = fs.readdirSync(meetingPath);
        const metaPath = path.join(meetingPath, 'metadata.json');
        let metadata = {};
        if (fs.existsSync(metaPath)) {
          metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        }

        meetings.push({
          date: dateStr,
          name: metadata.name || name,
          slug: name,
          path: meetingPath,
          participants: metadata.participants || [],
          tags: metadata.tags || [],
          files: files.filter(f => f !== 'metadata.json'),
        });
      }
    }
  }

  meetings.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));

  console.log(JSON.stringify(meetings, null, 2));
}

listMeetings();
