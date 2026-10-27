// Officer name checks. Names are shown to every player, so they are checked on the server.
// Extend these lists as you see real names come in. Matching ignores case, accents, spaces,
// and common letter swaps (0→o, 1→i, 3→e, 4→a, 5→s, 7→t, @→a, $→s).
const { playerNameRisk } = require('./politicians'); // copied from build/politicians.js by build_site.py

// Blocked anywhere inside a name: strong profanity and slurs.
const ANYWHERE = [
  'fuck', 'fvck', 'phuck', 'shit', 'sh1t', 'bitch', 'biatch', 'cunt', 'pussy', 'whore', 'slut', 'bastard',
  'nigger', 'nigga', 'faggot', 'retard', 'rapist', 'penis', 'vagina', 'porn',
  'ashawo', 'olosho', 'nyash', 'dindin',
];
// Blocked only as a whole first name or surname: words that are rude alone but appear inside ordinary names.
const WHOLE = [
  'dick', 'cock', 'anal', 'ewu', 'gbola', 'ass', 'arse', 'sex', 'tit', 'tits', 'cum', 'hoe', 'toto', 'oko', 'mumu', 'werey', 'ode', 'oloshi', 'olodo',
  'yeye', 'idiot', 'stupid', 'dumb', 'hitler', 'isis', 'boko', 'haram', 'yahoo', 'scam', 'fraud',
];
// Names that would let a player pass as staff or as a story character.
const RESERVED = ['admin', 'administrator', 'moderator', 'mod', 'staff', 'support', 'official', 'system', 'claude', 'anthropic', 'harmattan', 'division', 'police'];

const LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };
const fold = s => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[013457@$!]/g, c => LEET[c]);
const squash = s => fold(s).replace(/[^a-z]/g, '').replace(/(.)\1{2,}/g, '$1$1');

// Letters (any alphabet), apostrophes, hyphens and single spaces, 2 to 16 characters.
const SHAPE = /^[\p{L}][\p{L}'’\- ]{0,14}[\p{L}]$/u;

function tidy(part) {
  return String(part || '').trim().replace(/\s+/g, ' ').slice(0, 16)
    .split(' ').map(w => w.charAt(0).toLocaleUpperCase() + w.slice(1)).join(' ');
}

// Returns {ok:true, first, last} or {ok:false, reason}.
function checkName(first, last) {
  const f = tidy(first), l = tidy(last);
  if (!SHAPE.test(f) || !SHAPE.test(l)) return { ok: false, reason: 'Names need 2 to 16 letters. Hyphens and apostrophes are fine.' };
  const all = squash(f + l);
  if (ANYWHERE.some(w => all.includes(w))) return { ok: false, reason: 'That name is not allowed.' };
  const words = (f + ' ' + l).split(/[\s'’-]+/).map(squash).filter(Boolean);
  if (words.some(w => WHOLE.includes(w))) return { ok: false, reason: 'That name is not allowed.' };
  if (words.some(w => RESERVED.includes(w))) return { ok: false, reason: 'That name is reserved.' };
  if (playerNameRisk(f, l)) return { ok: false, reason: 'That name is too close to a real politician\'s. Please choose another name.' };
  return { ok: true, first: f, last: l };
}

module.exports = { checkName };
