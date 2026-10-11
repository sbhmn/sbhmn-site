// The intro's sound effects: real recordings, all CC0 (public domain) from freesound.org (ids below), cut into short
// mono clips, peak-levelled, MP3. The cuts are found from the waveform (onsets, peaks, the busiest window), so the
// script can be re-run on the same previews.
//   node dev/make-sfx.mjs <folder with the downloaded previews, named <id>-<cue>.mp3> assets/audio
// The big wet ones (slurp, splash1-3, goo1-2) are layered by dev/make-sfx-wet.mjs, which runs on its own sources;
// each script keeps the other's entries in sfx.json. The owner's own picks (growl, letter-bang, unfold) are cut by
// dev/make-sfx-picks.mjs from dev/sfx-src: run it after this one (this one still makes the old growl, 676482).
// splat1 was re-levelled by hand afterwards: the levelling here reads the peak at 22 kHz, which missed a few
// single-sample spikes in its transient, and the MP3 decoded to +3.5 dBFS with samples past full scale. The shipped
// file is that one through a limiter (ceiling 0.8) and a fresh MP3 encode (mono, 44.1 kHz, 96 kbps): peak ~0.85
// (-1.4 dBFS), its body about as loud as splat2 (a plain volume cut left it ~5 dB quieter). Its source previews aren't on disk any more, so this script can't be re-run end to end;
// if it ever is, check splat1's decoded peak again.
// Sources (freesound.org/s/<id>, all "Creative Commons 0"):
//   352719 woosh · 334198 paper bin toss · 482207 plastic garbage container lid slams · 271666 tomato squish ·
//   469933/469934/469932 tongue licks · 387904 water drops · 104661 plastic garbage can kicks ·
//   464576 bin knocked over · 676482 beast growl · 275160 thud · 449955 wooden thud · 155901 spit ·
//   237387 spitting · 719129/515619/515620 splats · 572104 crumpled sheet of paper
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [raw, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const files = Object.fromEntries(readdirSync(raw).map((f) => [f.split('-')[0], join(raw, f)]));
const SR = 22050, HOP = 0.005; // analysis: 22 kHz mono, 5 ms envelope

function pcm(id) {
  const b = execFileSync('ffmpeg', ['-v', 'error', '-i', files[id], '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
function envelope(x) {
  const h = Math.round(HOP * SR), e = new Float32Array(Math.floor(x.length / h));
  for (let i = 0; i < e.length; i++) { let s = 0; for (let j = 0; j < h; j++) { const v = x[i * h + j]; s += v * v; } e[i] = Math.sqrt(s / h); }
  return e;
}
const peakOf = (x, t0, t1) => { let p = 0; for (let i = Math.max(0, Math.floor(t0 * SR)); i < Math.min(x.length, t1 * SR); i++) p = Math.max(p, Math.abs(x[i])); return p || 1; };
const maxOf = (e) => e.reduce((m, v) => Math.max(m, v), 0);

// the sound's own extent: from just before it rises to after it has died away
function extent(e, lo = 0.04, tail = 0.02) {
  const m = maxOf(e); let a = 0, b = e.length - 1;
  while (a < e.length && e[a] < lo * m) a++;
  while (b > a && e[b] < tail * m) b--;
  return [Math.max(0, a * HOP - 0.01), (b + 1) * HOP + 0.03];
}
// the strongest hits: local maxima of the envelope's rise, at least `gap` s apart, strongest first
function hits(e, gap = 0.25, rel = 0.25) {
  const m = maxOf(e), on = [];
  for (let i = 2; i < e.length - 2; i++) {
    const rise = e[i] - Math.min(e[i - 2], e[i - 1]);
    if (e[i] >= rel * m && rise > 0.12 * m && e[i] >= e[i - 1] && e[i] >= e[i + 1]) on.push({ t: i * HOP, v: e[i] });
  }
  on.sort((a, b) => b.v - a.v);
  const keep = [];
  for (const h of on) if (keep.every((k) => Math.abs(k.t - h.t) >= gap)) keep.push(h);
  return keep;
}
// the busiest stretch: the window with the most energy
function busiest(e, dur) {
  const w = Math.round(dur / HOP); let s = 0, best = 0, at = 0;
  for (let i = 0; i < e.length; i++) { s += e[i] * e[i]; if (i >= w) s -= e[i - w] * e[i - w]; if (i >= w - 1 && s > best) { best = s; at = i - w + 1; } }
  return at * HOP;
}

const made = [];
function cut(id, name, t0, dur, { fadeIn = 0.004, fadeOut = 0.06, peak = 0.89, rate = 1 } = {}) {
  const x = pcm(id);
  const p = peakOf(x, t0, t0 + dur);
  const af = [`afade=t=in:st=0:d=${fadeIn}`, `afade=t=out:st=${Math.max(0, dur - fadeOut).toFixed(3)}:d=${fadeOut}`, `volume=${(peak / p).toFixed(3)}`];
  if (rate !== 1) af.unshift(`asetrate=44100*${rate},aresample=44100`);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', t0.toFixed(3), '-t', dur.toFixed(3), '-i', files[id], '-ac', '1', '-ar', '44100', '-af', af.join(','), '-b:a', '96k', join(out, `${name}.mp3`)]);
  made.push({ name, id, t0: +t0.toFixed(3), dur: +dur.toFixed(3) });
}
function whole(id, name, opts) { const [a, b] = extent(envelope(pcm(id))); cut(id, name, a, b - a, opts); }

// one-shots, the whole sound
whole('352719', 'throw');
whole('334198', 'paper-in');
whole('271666', 'squeeze');
whole('469933', 'lick1'); whole('469934', 'lick2'); whole('469932', 'lick3');
whole('676482', 'growl', { fadeOut: 0.25 });
whole('275160', 'thud1'); whole('449955', 'thud2');
whole('155901', 'spit1'); whole('237387', 'spit2');
whole('719129', 'splat1'); whole('515619', 'splat2'); whole('515620', 'splat3');
whole('464576', 'bang', { fadeOut: 0.2 });

// the lid: the hardest slam in the take for the slam, a softer one for the clap
{
  const e = envelope(pcm('482207')), h = hits(e, 0.6, 0.3);
  cut('482207', 'lid-slam', Math.max(0, h[0].t - 0.02), 0.9, { fadeOut: 0.25 });
  const soft = h.find((k) => k.v < h[0].v * 0.8) ?? h[1] ?? h[0];
  cut('482207', 'lid-clap', Math.max(0, soft.t - 0.015), 0.55, { fadeOut: 0.18 });
}
// drops: four separate plips
{
  const e = envelope(pcm('387904')), h = hits(e, 0.18, 0.2).slice(0, 4).sort((a, b) => a.t - b.t);
  h.forEach((k, i) => cut('387904', `drip${i + 1}`, Math.max(0, k.t - 0.008), 0.16, { fadeOut: 0.07 }));
}
// the fit: the most violent 1.9 s of the can being kicked about
{
  const e = envelope(pcm('104661')), at = busiest(e, 1.9);
  cut('104661', 'shake', at, 1.9, { fadeIn: 0.02, fadeOut: 0.12 });
}
// paper: eight short crinkles, one per stop-motion frame (cycled)
{
  const e = envelope(pcm('572104')), h = hits(e, 0.15, 0.15).slice(0, 8).sort((a, b) => a.t - b.t);
  h.forEach((k, i) => cut('572104', `crinkle${i + 1}`, Math.max(0, k.t - 0.01), 0.14, { fadeOut: 0.05 }));
}
// sfx.json: our entries, plus the ones dev/make-sfx-wet.mjs made (kept as they are)
const json = join(out, 'sfx.json'), mine = new Set(made.map((m) => m.name));
const others = existsSync(json) ? JSON.parse(readFileSync(json, 'utf8')).clips.filter((c) => !mine.has(c.name) && c.layers) : [];
writeFileSync(json, JSON.stringify({ license: 'CC0 1.0 (freesound.org)', clips: [...made, ...others] }, null, 1));
console.log(made.map((m) => `${m.name.padEnd(10)} ${m.id} @${m.t0}s ${m.dur}s`).join('\n'));
