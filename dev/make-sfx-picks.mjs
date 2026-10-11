// The owner's own picks (freesound.org; the files, as the owner trimmed them, in dev/sfx-src): cut, faded, peak-
// levelled like the other clips (0.85), mono 44.1 kHz MP3 96 kbps, and their entries in sfx.json (the rest kept).
// Runs after dev/make-sfx.mjs (which would put its own growl back).
//   node dev/make-sfx-picks.mjs [assets/audio]
//   growl        366837 (jofae, "growl and roar"): from 0.1 s (the silence before it off), to the end, faded out
//   letter-bang  440944 (l_q, "bin7"): the first 0.42 s, the ring faded out fast, so five letters 165 ms apart stay
//                five bangs
//   unfold       360646 (mafon2, "paper drawn with rustle"): 0.95-3.05 s, a crinkle at once (the paper smashing into
//                the glass), its loudest rustle near the end (the paper coming flat)
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = process.argv[2] ?? join(ROOT, 'assets/audio');
const SR = 44100;
const PICKS = [
  { name: 'growl', id: '366837', file: '366837-growl-and-roar.mp3', by: 'jofae, "growl and roar"', t0: 0.1, dur: null, fadeIn: 0.01, fadeOut: 0.25 },
  { name: 'letter-bang', id: '440944', file: '440944-bin7.wav', by: 'l_q, "bin7"', t0: 0, dur: 0.42, fadeIn: 0, fadeOut: 0.22, curve: 1.5 },
  { name: 'unfold', id: '360646', file: '360646-paper-drawn-with-rustle.wav', by: 'mafon2, "paper drawn with rustle"', t0: 0.95, dur: 2.1, fadeIn: 0.01, fadeOut: 0.25, curve: 1.5 },
];
const json = join(out, 'sfx.json');
const meta = JSON.parse(readFileSync(json, 'utf8'));
for (const p of PICKS) {
  const src = join(ROOT, 'dev/sfx-src', p.file);
  const b = execFileSync('ffmpeg', ['-v', 'error', '-ss', String(p.t0), ...(p.dur ? ['-t', String(p.dur)] : []), '-i', src, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 28 });
  const x = new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  const dur = x.length / SR;
  let peak = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] *= (p.fadeIn ? Math.min(1, t / p.fadeIn) : 1) * Math.pow(Math.min(1, Math.max(0, (dur - t) / p.fadeOut)), p.curve ?? 1);
    peak = Math.max(peak, Math.abs(x[i]));
  }
  for (let i = 0; i < x.length; i++) x[i] *= 0.85 / (peak || 1);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-b:a', '96k', join(out, `${p.name}.mp3`)], { input: Buffer.from(x.buffer) });
  meta.clips = meta.clips.filter((c) => c.name !== p.name);
  meta.clips.push({ name: p.name, id: p.id, t0: p.t0, dur: +dur.toFixed(3), source: `dev/sfx-src/${p.file} (${p.by}, trimmed by the owner)`, license: 'not checked (freesound.org unreachable from the build machine): see freesound.org/s/' + p.id });
  console.log(`${p.name.padEnd(12)} ${p.id} @${p.t0}s ${dur.toFixed(3)}s`);
}
writeFileSync(json, JSON.stringify(meta, null, 1));
