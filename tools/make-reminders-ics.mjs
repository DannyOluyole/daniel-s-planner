// Regenerates daniel-planner-reminders.ics (hourly check-ins for a phone calendar) from the
// DEFAULT_TIMELINE in index.html. Run from the repo root: node tools/make-reminders-ics.mjs
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const html = fs.readFileSync(new URL('index.html', root), 'utf8');
const literal = html.match(/const DEFAULT_TIMELINE = (\{[\s\S]*?\n\});/)[1];
const timeline = new Function('return ' + literal)();
const START_HOUR = Number(html.match(/const DAY_TIMELINE_START_HOUR = (\d+)/)[1]);
const END_HOUR = Number(html.match(/const DAY_TIMELINE_END_HOUR = (\d+)/)[1]);
const PLANNER_URL = 'https://dannyoluyole.github.io/daniel-s-planner/';

const clock = (h) => { const hh = ((h % 24) + 24) % 24; return (hh % 12 || 12) + ':00 ' + (hh >= 12 ? 'PM' : 'AM'); };
const slot = (h) => clock(h) + ' – ' + clock(h + 1);

function checkinText(h) {
  const ended = (h + 23) % 24;
  if (h === START_HOUR) return timeline[h] ? 'Good morning! First up: ' + timeline[h] : 'Good morning! Time to start your day.';
  return timeline[ended] ? 'Did you do: ' + timeline[ended] + ' (' + slot(ended) + ')?' : 'Check in on ' + slot(ended) + '.';
}

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

function fold(line) {
  if (Buffer.byteLength(line) <= 75) return line;
  const parts = [];
  let cur = '', len = 0, limit = 75;
  for (const ch of line) {
    const n = Buffer.byteLength(ch);
    if (len + n > limit) { parts.push(cur); cur = ch; len = n; limit = 74; } else { cur += ch; len += n; }
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const day = now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate());
const stamp = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z';

const hours = [];
for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);
hours.push(0);

const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Daniel Planner//Hourly check-ins//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  'X-WR-CALNAME:Daniel Planner check-ins'];

for (const h of hours) {
  const title = '⏰ ' + clock(h) + ' check-in';
  const body = checkinText(h);
  const endMinutes = '15';
  lines.push(
    'BEGIN:VEVENT',
    'UID:checkin-' + h + '@dannyoluyole.github.io',
    'DTSTAMP:' + stamp,
    'DTSTART:' + day + 'T' + pad(h) + '0000',
    'DTEND:' + day + 'T' + pad(h) + endMinutes + '00',
    'RRULE:FREQ=DAILY',
    'SUMMARY:' + esc(title),
    'DESCRIPTION:' + esc(body + '\n\nOpen your planner to check in:\n' + PLANNER_URL),
    'URL:' + PLANNER_URL,
    'TRANSP:TRANSPARENT',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:' + esc(title + ' - ' + body),
    'TRIGGER:PT0S',
    'END:VALARM',
    'END:VEVENT'
  );
}
lines.push('END:VCALENDAR');

const out = new URL('daniel-planner-reminders.ics', root);
fs.writeFileSync(out, lines.map(fold).join('\r\n') + '\r\n');
console.log('wrote daniel-planner-reminders.ics with', hours.length, 'daily reminders');
