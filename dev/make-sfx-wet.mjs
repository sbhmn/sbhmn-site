// The tongue's big wet sounds, layered from real recordings (all CC0, public domain, from freesound.org): the big slurp
// as it is sucked back in, three heavy wet splashes as it slaps down on the lid, two slimy squelches for the spit
// strings and the tongue peeling off the lid. Runs on its own, after dev/make-sfx.mjs (which makes the other clips):
//   node dev/make-sfx-wet.mjs <folder with the downloaded previews, named <id>-<cue>.mp3> assets/audio
// It writes slurp, splash1-3 and goo1-2 (.mp3) and updates their entries in sfx.json, keeping everyone else's.
// Sources (freesound.org/s/<id>, all "Creative Commons 0"):
//   488578 "Slurping Noodles" by sirTmoney · 339839 "slurp.mp3" ("schmatzendes Monster schluckt / smacking monster")
//   by gnimpl · 789128 "Slurp" by bellick · 445118 "Cartoon - Splat!" by Breviceps · 445109 "Mud Splat" by Breviceps ·
//   394872 "Various Mushy Impacts or Wet Splats.mp3" by deleted_user_6479820 · 679391 "wet thwack" by adviseme333 ·
//   200279 "Icky Worm Slime Monster" by qubodup (CC0 since 15 Aug 2024)
// The regions were picked from spectrograms (onsets, where each slurp, smack and squelch really is; each layer starts
// on its own onset); the levels are set by each layer's own loudness, and every clip is peak-levelled like the others
// (0.89), faded in and out.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [raw, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const files = Object.fromEntries(readdirSync(raw).map((f) => [f.split('-')[0], join(raw, f)]));
const SR = 44100;
const f32 = (b) => new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));

// a region of a recording as mono 44.1 kHz samples (`rate` > 1 plays it higher and shorter)
function region(id, t0, dur, { rate = 1 } = {}) {
  if (!files[id]) throw new Error(`missing source ${id} in ${raw}`);
  const af = [`aresample=${SR}`];
  if (rate !== 1) af.push(`asetrate=${SR}*${rate}`, `aresample=${SR}`);
  return f32(execFileSync('ffmpeg', ['-v', 'error', '-ss', t0.toFixed(3), '-t', dur.toFixed(3), '-i', files[id], '-ac', '1', '-af', af.join(','), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 }));
}
// filtered (Hz, after any speed change, so the cut-offs are where you hear them): `hp` high-pass, `lp` low-pass,
// 12 dB per octave, or 24 with `steep`
function filter(x, { hp = 0, lp = 0, steep = false }) {
  const af = [];
  for (let k = 0; k < (steep ? 2 : 1); k++) { if (hp) af.push(`highpass=f=${hp}`); if (lp) af.push(`lowpass=f=${lp}`); }
  if (!af.length) return x;
  return f32(execFileSync('ffmpeg', ['-v', 'error', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-af', af.join(','), '-f', 'f32le', '-'], { input: Buffer.from(x.buffer), maxBuffer: 1 << 28 }));
}
// played faster and faster: the speed goes from r0 to r1 (so the pitch rises and it hurries, like a noodle sucked in)
function rise(x, [r0, r1]) {
  const n = Math.floor(x.length / ((r0 + r1) / 2)) - 2, y = new Float32Array(n);
  for (let i = 0, p = 0; i < n; i++, p += r0 + ((r1 - r0) * i) / n) { const j = Math.floor(p), f = p - j; y[i] = x[j] * (1 - f) + (x[j + 1] ?? 0) * f; }
  return y;
}
const rms = (x) => { let s = 0; for (const v of x) s += v * v; return Math.sqrt(s / Math.max(1, x.length)) || 1e-9; };
const peak = (x) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0) || 1e-9;
// raised-cosine fades (no clicks at the edges)
function fade(x, fin, fout) {
  const a = Math.round(fin * SR), b = Math.round(fout * SR);
  for (let i = 0; i < a && i < x.length; i++) x[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / a);
  for (let i = 0; i < b && i < x.length; i++) x[x.length - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / b);
  return x;
}
// a gain curve through [time in the layer (s), dB] points, linear in dB between them
function curve(x, pts) {
  for (let i = 0; i < x.length; i++) {
    const t = i / SR; let k = 0;
    while (k < pts.length - 1 && pts[k + 1][0] <= t) k++;
    const [t0, d0] = pts[k], [t1, d1] = pts[Math.min(k + 1, pts.length - 1)];
    const d = t1 > t0 ? d0 + ((d1 - d0) * Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))) : d0;
    x[i] *= 10 ** (d / 20);
  }
  return x;
}
// a look-ahead peak limiter: nothing gets more than `crest` dB above the sound's own RMS (so a single pop or the
// loudest crack doesn't set the level of the whole clip); the gain dips smoothly over `att` s and recovers over `rel` s
function limit(x, crest, { att = 0.003, rel = 0.06 } = {}) {
  const ceil = rms(x) * 10 ** (crest / 20), n = x.length, la = Math.max(1, Math.round(att * SR)), k = 1 - Math.exp(-1 / (rel * SR));
  const g = Float32Array.from(x, (v) => Math.min(1, ceil / (Math.abs(v) || 1e-9)));
  const r = new Float32Array(n);
  for (let i = 0, prev = 1; i < n; i++) {
    let m = 1; for (let j = i; j <= i + la && j < n; j++) m = Math.min(m, g[j]);
    prev = Math.min(m, prev + (1 - prev) * k); r[i] = prev;
  }
  for (let i = 0, s = la; i < n; i++) { s += r[i] - (i >= la ? r[i - la] : 1); x[i] *= s / la; } // mean of the last la
  return x;
}

const made = [];
// layers: { id, t0, dur, at (s into the clip), db (level, relative to the layer's own RMS), rate, rise, hp, lp, steep,
//           fin, fout, env (a gain curve), crest (limit its peaks) }; the mix can have its own env and crest too
function build(name, layers, { dur, fadeIn = 0.005, fadeOut = 0.08, peakTo = 0.89, env, crest } = {}) {
  const parts = layers.map((l) => {
    let x = region(l.id, l.t0, l.dur, l);
    if (l.rise) x = rise(x, l.rise);
    x = filter(x, l);
    if (l.crest) limit(x, l.crest);
    const g = 10 ** ((l.db ?? 0) / 20) / rms(x);
    for (let i = 0; i < x.length; i++) x[i] *= g;
    fade(x, l.fin ?? 0.004, l.fout ?? 0.03);
    if (l.env) curve(x, l.env);
    return { l, x };
  });
  const len = Math.round((dur ?? Math.max(...parts.map(({ l, x }) => (l.at ?? 0) + x.length / SR))) * SR);
  const y = new Float32Array(len);
  for (const { l, x } of parts) { const o = Math.round((l.at ?? 0) * SR); for (let i = 0; i < x.length && o + i < len; i++) y[o + i] += x[i]; }
  if (env) curve(y, env);
  if (crest) limit(y, crest);
  const g = peakTo / peak(y);
  for (let i = 0; i < len; i++) y[i] *= g;
  fade(y, fadeIn, fadeOut);
  // MP3 overshoots a dense (limited) signal's peaks a little: encode, decode, and bring it back down if it went over
  const file = join(out, `${name}.mp3`);
  for (let k = 0; k < 4; k++) {
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-b:a', '96k', file], { input: Buffer.from(y.buffer) });
    const p = peak(f32(execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-'], { maxBuffer: 1 << 28 })));
    if (p <= peakTo * 1.03) break;
    for (let i = 0; i < len; i++) y[i] *= (peakTo / p);
  }
  // (always with `layers`: that is how dev/make-sfx.mjs tells this script's entries from its own)
  made.push({ name, dur: +(len / SR).toFixed(3), layers: layers.map(({ id, t0, dur: d, at = 0, rate, rise: r }) => ({ id, t0, dur: d, at, ...(rate ? { rate } : {}), ...(r ? { rise: r } : {}) })) });
}

// THE BIG SLURP: the tongue sucked back in like a long noodle. Three noodle slurps back to back (overlapping, each a
// little higher, so it is one long suck that rises), the gurgle of a straw in liquid under it for the wetness, a little
// of the monster's throaty gargle at the start, and the monster's wet smack and gulps as the tip vanishes in. The suck
// keeps going (the resonant suck, fading) right into the smack, and the last gulp ends before the clip does. The
// gurgle is fizzy up top (most of its energy is above 8 kHz) and the speed-up pushes the noodles' hiss higher, so both
// are low-passed to keep the suck's body (0.3-3 kHz) in front: about as bright as a plain slurp recording.
build('slurp', [
  { id: '339839', t0: 0.15, dur: 0.5, at: 0, db: -16, fin: 0.08, fout: 0.2, hp: 90 }, // throaty gargle, under the start
  // the three noodle slurps, ever faster (their pops limited)
  { id: '488578', t0: 0.94, dur: 0.72, at: 0.02, db: -5, crest: 9, lp: 9000, rise: [1, 1.05], fin: 0.06, fout: 0.1 },
  { id: '488578', t0: 2.08, dur: 0.6, at: 0.6, db: -4, crest: 9, lp: 9000, rise: [1.05, 1.1], fin: 0.08, fout: 0.08 },
  { id: '488578', t0: 2.94, dur: 0.4, at: 1.08, db: -3, crest: 9, lp: 9000, rise: [1.1, 1.18], fin: 0.06, fout: 0.08 },
  { id: '789128', t0: 0.5, dur: 1.4, at: 0.05, db: -9, hp: 150, lp: 6000, steep: true, fin: 0.1, fout: 0.2 }, // gurgle: bubbles in liquid
  { id: '789128', t0: 26.22, dur: 1.02, at: 0.62, db: -11, hp: 150, lp: 7000, rise: [1.04, 1.16], fin: 0.1, fout: 0.1 }, // resonant suck
  { id: '339839', t0: 1.0, dur: 0.66, at: 1.27, db: -1, fin: 0.004, fout: 0.06 }, // wet burst, the smack, the gulps
], { fadeIn: 0.01, fadeOut: 0.05, env: [[0, -6], [1.3, 0]], crest: 11.5 });

// THE SPLASHES: a heavy wet tongue slapping down on the plastic lid, saliva splashing out
// 1: the sharp crack of a wet thwack + a big cartoon splat (the splatter flies for half a second). The splat's own low
//    thump is thinned (high-passed) and its swell at ~0.4 s held down, so it is one heavy slap and then the spray.
build('splash1', [
  { id: '679391', t0: 0.378, dur: 0.5, at: 0, db: -3, fout: 0.15 },
  { id: '445118', t0: 0.02, dur: 0.76, at: 0.002, db: -2, hp: 140, fout: 0.15, env: [[0, 0], [0.22, 0], [0.36, -5]] },
], { fadeOut: 0.1, crest: 11 });
// 2: a thick squelch: the mud splat's juicy hit, a heavy mushy thump under it, and the long mushy squelch (all three
//    hit together)
build('splash2', [
  { id: '445109', t0: 0.008, dur: 0.34, at: 0, db: -2, fout: 0.1 },
  { id: '394872', t0: 1.328, dur: 0.3, at: 0, db: -6, fout: 0.1 },
  { id: '394872', t0: 5.366, dur: 0.57, at: 0, db: -3, fout: 0.15 },
], { fadeOut: 0.1, crest: 13 });
// 3: a squelch that opens into a splat (the two hits land together, ~35 ms in), then the drool bubbling off it
build('splash3', [
  { id: '394872', t0: 0.215, dur: 0.3, at: 0.028, db: -4, fout: 0.1 },
  { id: '394872', t0: 11.858, dur: 0.48, at: 0, db: -3, fout: 0.12 },
  { id: '789128', t0: 11.3, dur: 0.4, at: 0.2, db: -9, hp: 150, fin: 0.06, fout: 0.15 },
], { fadeOut: 0.1, crest: 13 });

// THE SPIT STRINGS: slimy squelches (stretching, snapping, peeling off the lid)
build('goo1', [{ id: '200279', t0: 10.49, dur: 0.56, at: 0, db: 0, hp: 60, fout: 0.08 }], { fadeOut: 0.06 });
build('goo2', [{ id: '200279', t0: 53.09, dur: 0.42, at: 0, db: 0, hp: 60, fout: 0.08 }], { fadeOut: 0.06 });

// sfx.json: replace our entries, keep the others (make-sfx.mjs's)
const json = join(out, 'sfx.json');
const old = existsSync(json) ? JSON.parse(readFileSync(json, 'utf8')) : { license: 'CC0 1.0 (freesound.org)', clips: [] };
const ours = new Set(made.map((m) => m.name));
old.clips = [...old.clips.filter((c) => !ours.has(c.name)), ...made];
writeFileSync(json, JSON.stringify(old, null, 1));
console.log(made.map((m) => `${m.name.padEnd(8)} ${m.dur}s ${m.layers.map((l) => `${l.id}@${l.t0}`).join(' + ')}`).join('\n'));
