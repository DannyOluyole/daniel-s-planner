// Eko Nights · Cloud Functions
// The verified service record. Players can't write their own rank, XP or case stats: these functions do,
// after checking each case against the server's clock and the rules below.
//
// What this can and can't stop: the game itself runs on the player's device, so the server can't watch every
// clue. It checks what it can (who started which case and when, how long it took, how many arrests a case
// allows, how many cases a day) and computes XP itself. That stops edited stats, instant wins and farming.
// It doesn't stop a skilled cheater who plays at a believable pace; that would need the server to run the cases.
// The game has no prizes, so the aim is a fair, fun leaderboard: honest players should never be caught by these checks.

const { onCall, HttpsError } = require('firebase-functions/https');
const { setGlobalOptions } = require('firebase-functions/options');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto');
const { checkName } = require('./names');

initializeApp();
const db = getFirestore();
setGlobalOptions({ region: 'europe-west1', maxInstances: 100 });

// App Check is enforced in production. The local emulator has no App Check, so it is skipped there.
const ENFORCE_APP_CHECK = process.env.FUNCTIONS_EMULATOR !== 'true';
const call = fn => onCall({ enforceAppCheck: ENFORCE_APP_CHECK }, async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first.');
  return fn(req.auth.uid, req.data || {});
});

const RANKS = [[0, 'Constable'], [150, 'Corporal'], [400, 'Sergeant'], [800, 'Inspector'], [1400, 'ASP'], [2200, 'DSP'], [3200, 'SP'], [4500, 'CSP']];
const rankOf = xp => RANKS.filter(([x]) => xp >= x).pop()[1];
// gang: most arrests a case allows. min: fewest real minutes a solve can take. base: XP for a solve.
const TYPES = {
  robbery: { gang: 3, min: 4, base: 250 }, kidnap: { gang: 3, min: 4, base: 350 }, homicide: { gang: 1, min: 5, base: 350 },
  romance: { gang: 1, min: 3, base: 300 }, yahoo: { gang: 1, min: 4, base: 350 }, contract: { gang: 2, min: 5, base: 350 },
  leak: { gang: 1, min: 3, base: 350 }, finale: { gang: 1, min: 3, base: 400 },
};
const NO_ARREST_NEEDED = ['kidnap', 'leak']; // solved by a rescue or a confrontation, not an arrest
const LIMITS = { startsPerHour: 15, casesPerDay: 40, invitesPer10Min: 10, backupPerPairPerDay: 3, flagAfter: 3, strikesExpireMs: 7 * 24 * 3600e3, renameEveryMs: 24 * 3600e3 };
const SKINS = ['#a06a45', '#8a5a3c', '#6e4429', '#5a3620', '#4a2e1c', '#3d2516'];

const rating = s => {
  const c = s.cases || 0, f = s.failed || 0;
  return Math.max(0, Math.min(100, Math.round((c + 1) / (c + f + 2) * 60 + Math.min(30, c * 2) - Math.min(10, (s.falseArrests || 0) * 2))));
};
const int = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v) || 0)));
const dayKey = () => new Date().toISOString().slice(0, 10);
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randCode = n => Array.from({ length: n }, () => CODE_CHARS[crypto.randomInt(CODE_CHARS.length)]).join('');
const FRESH = { xp: 0, cases: 0, failed: 0, arrests: 0, raids: 0, homicides: 0, falseArrests: 0, byType: {}, rank: 'Constable', flagged: false, suspicious: 0 };

// ---------- officer registration: checked name, unique friend code
exports.registerOfficer = call(async (uid, d) => {
  const chk = checkName(d.first, d.last);
  const skin = SKINS.includes(d.skin) ? d.skin : SKINS[2];
  const gender = d.gender === 'f' ? 'f' : 'm';
  const ref = db.doc('officers/' + uid);
  return db.runTransaction(async t => {
    const cur = await t.get(ref);
    const o = cur.exists ? cur.data() : null;
    let code = o && o.code;
    for (let i = 0; i < 8 && !code; i++) {
      const c = 'EKO-' + randCode(5);
      const taken = await t.get(db.doc('codes/' + c));
      if (!taken.exists) { t.set(db.doc('codes/' + c), { uid }); code = c; }
    }
    if (!code) throw new HttpsError('unavailable', 'Please try again.');
    const now = Date.now();
    let name = o && o.name, ok = true, message = null, renamed = false;
    if (!chk.ok) { ok = false; message = chk.reason; }
    else {
      const wanted = chk.first + ' ' + chk.last;
      if (wanted !== name) {
        const placeholder = !name || name.startsWith('Officer ');
        if (!placeholder && o.renamedAt && now - o.renamedAt < LIMITS.renameEveryMs) { ok = false; message = 'You can change your online name once a day.'; }
        else { name = wanted; renamed = true; }
      }
    }
    if (!name) name = 'Officer ' + code.slice(4);
    const base = o ? {} : Object.assign({}, FRESH, { rating: rating({}), createdAt: now });
    t.set(ref, Object.assign(base, { name, code, skin, gender, seen: now }, renamed && o && o.name ? { renamedAt: now } : {}), { merge: true });
    return { ok, name, code, message };
  });
});

// ---------- a case starts: the server records the case and the time
exports.startCase = call(async (uid, d) => {
  const T = TYPES[d.type];
  if (!T) throw new HttpsError('invalid-argument', 'Unknown case type.');
  const seed = int(d.seed, 1, 2147483646);
  const o = d.opt || {};
  const opt = { free: !!o.free, hard: !!o.hard, story: !!o.story };
  const me = db.doc('officers/' + uid);
  return db.runTransaction(async t => {
    const mine = await t.get(me);
    if (!mine.exists) throw new HttpsError('failed-precondition', 'Register your officer first.');
    const od = mine.data(), now = Date.now(), hour = Math.floor(now / 3600e3);
    const starts = od.hourKey === hour ? (od.hourStarts || 0) : 0;
    if (starts >= LIMITS.startsPerHour) throw new HttpsError('resource-exhausted', 'Too many new cases this hour.');
    let squadHost = null, hostTicket = null, caseStartedAt = null;
    if (d.squadHost) {
      squadHost = String(d.squadHost);
      const host = await t.get(db.doc('officers/' + squadHost));
      hostTicket = host.exists ? host.data().openTicket : null;
      const ht = hostTicket ? await t.get(db.doc('tickets/' + hostTicket)) : null;
      if (!ht || !ht.exists || ht.data().status !== 'open' || ht.data().seed !== seed || ht.data().type !== d.type)
        throw new HttpsError('failed-precondition', 'That squad case is closed.');
      caseStartedAt = ht.data().caseStartedAt || ht.data().startedAt; // squad-mates are timed from when the case began
    }
    const prev = od.openTicket ? await t.get(db.doc('tickets/' + od.openTicket)) : null;
    const ref = db.collection('tickets').doc();
    if (prev && prev.exists && prev.data().status === 'open') t.update(prev.ref, { status: 'expired', closedAt: now });
    t.set(ref, { uid, type: d.type, seed, opt, startedAt: now, caseStartedAt: caseStartedAt || now, status: 'open', squadHost, hostTicket });
    t.update(me, { openTicket: ref.id, hourKey: hour, hourStarts: starts + 1 });
    return { ticketId: ref.id };
  });
});

// ---------- a case ends: the server checks the claim and computes the XP
exports.closeCase = call(async (uid, d) => {
  const tref = db.doc('tickets/' + String(d.ticketId || 'none'));
  const me = db.doc('officers/' + uid);
  const outcome = ['closed', 'timeout', 'abandoned'].includes(d.outcome) ? d.outcome : 'abandoned';
  const c = d.claim || {};
  return db.runTransaction(async t => {
    const [tk, mine] = await Promise.all([t.get(tref), t.get(me)]);
    if (!tk.exists || tk.data().uid !== uid || !mine.exists) throw new HttpsError('not-found', 'No such case.');
    const k = tk.data();
    if (k.status !== 'open') return { accepted: false, reason: 'already_closed', xp: 0 };
    const T = TYPES[k.type], od = mine.data(), now = Date.now();
    const minutes = (now - (k.caseStartedAt || k.startedAt)) / 60000;
    // Strikes wear off: a week without a refused claim clears them and puts the officer back on the leaderboard.
    const strikesExpired = od.suspiciousAt && now - od.suspiciousAt > LIMITS.strikesExpireMs;
    const strikes = strikesExpired ? 0 : (od.suspicious || 0);
    const success = !!c.success && outcome === 'closed';
    const caught = int(c.caught, 0, T.gang), falseArrests = int(c.falseArrests, 0, 10);
    const backup = success && typeof c.backup === 'string' && c.backup !== uid ? c.backup : null;
    // all reads before any writes
    let bDoc = null, pairDoc = null, bInbox = null;
    const pairRef = backup ? db.doc(`credits/${uid}_${backup}_${dayKey()}`) : null;
    if (backup) {
      bDoc = await t.get(db.doc('officers/' + backup));
      pairDoc = await t.get(pairRef);
      bInbox = await t.get(db.doc('inbox/' + backup));
    }
    const today = dayKey(), dayCases = od.dayKey === today ? (od.dayCases || 0) : 0;
    let accepted = true, reason = null, xp = 0;
    if (success && minutes < T.min * (k.opt && k.opt.hard ? 1.25 : 1)) { accepted = false; reason = 'too_fast'; }
    else if (success && caught < 1 && !NO_ARREST_NEEDED.includes(k.type) && !c.paid) { accepted = false; reason = 'no_arrest'; }
    else if (success && dayCases >= LIMITS.casesPerDay) reason = 'daily_cap';
    const upd = {};
    if (accepted) {
      if (success && !reason) xp = Math.max(60, T.base + caught * 50 - falseArrests * 40);
      else if (!success) xp = Math.max(0, caught * 25 - falseArrests * 40);
      const st = { cases: (od.cases || 0) + (success ? 1 : 0), failed: (od.failed || 0) + (success ? 0 : 1), falseArrests: (od.falseArrests || 0) + falseArrests };
      const byType = Object.assign({}, od.byType || {});
      if (success) byType[k.type] = (byType[k.type] || 0) + 1;
      Object.assign(upd, st, {
        xp: (od.xp || 0) + xp, arrests: (od.arrests || 0) + caught, raids: (od.raids || 0) + (success && c.raid ? 1 : 0),
        homicides: (od.homicides || 0) + (success && k.type === 'homicide' ? 1 : 0), byType,
        rating: rating(st), dayKey: today, dayCases: dayCases + (success ? 1 : 0),
      });
      upd.rank = rankOf(upd.xp);
      if (strikesExpired) { upd.suspicious = 0; upd.flagged = false; }
    } else {
      upd.suspicious = strikes + 1;
      upd.suspiciousAt = now;
      upd.flagged = upd.suspicious >= LIMITS.flagAfter;
    }
    if (od.openTicket === tref.id) upd.openTicket = null;
    t.update(me, upd);
    t.update(tref, { status: accepted ? (success ? 'solved' : 'failed') : 'rejected', closedAt: now, minutes: Math.round(minutes * 10) / 10, xp, reason, claim: { success, caught, falseArrests, evidence: int(c.evidence, 0, 60) } });
    let backupXp = 0;
    if (accepted && success && !reason && backup && bDoc.exists) {
      const n = pairDoc.exists ? pairDoc.data().n : 0;
      if (n < LIMITS.backupPerPairPerDay) {
        backupXp = 60;
        const bd = bDoc.data();
        t.set(pairRef, { n: n + 1, at: now });
        t.update(bDoc.ref, { xp: (bd.xp || 0) + backupXp, rank: rankOf((bd.xp || 0) + backupXp) });
        const notices = ((bInbox.exists && bInbox.data().notices) || []).slice(-19);
        notices.push({ id: tref.id, from: od.name, title: String(c.title || 'a case').slice(0, 80), xp: backupXp, at: now });
        t.set(bInbox.ref, { notices }, { merge: true });
      }
    }
    return { accepted, reason, xp, backupXp, stats: accepted ? { xp: upd.xp, rank: upd.rank, rating: upd.rating, cases: upd.cases } : null };
  });
});

// ---------- squad invites: only to online officers, only from an open squad, limited per 10 minutes
exports.sendInvite = call(async (uid, d) => {
  const to = String(d.to || '');
  if (!to || to === uid) throw new HttpsError('invalid-argument', 'Pick another officer.');
  const me = db.doc('officers/' + uid), them = db.doc('officers/' + to), inbox = db.doc('inbox/' + to);
  return db.runTransaction(async t => {
    const [o, r, ib] = await Promise.all([t.get(me), t.get(them), t.get(inbox)]);
    if (!o.exists || !r.exists) throw new HttpsError('not-found', 'Officer not found.');
    const od = o.data(), now = Date.now(), win = Math.floor(now / 600000);
    const n = od.invWin === win ? (od.invN || 0) : 0;
    if (n >= LIMITS.invitesPer10Min) throw new HttpsError('resource-exhausted', 'Too many invites. Wait a few minutes.');
    if (!od.openTicket || !od.open) throw new HttpsError('failed-precondition', 'Open your case to a squad first.');
    if (!r.data().seen || now - r.data().seen > 6 * 60000) throw new HttpsError('failed-precondition', 'That officer is not online.');
    const invites = ((ib.exists && ib.data().invites) || []).filter(i => i.from !== uid && now - i.at < 3 * 3600e3).slice(-9);
    invites.push({ from: uid, name: od.name, rank: od.rank, title: String(od.onCase || 'a case').slice(0, 80), at: now });
    t.set(inbox, { invites }, { merge: true });
    t.update(me, { invWin: win, invN: n + 1 });
    return { ok: true };
  });
});
