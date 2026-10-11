// The intro's sound effects: real recordings (all CC0, freesound.org; see assets/audio/sfx.json, dev/make-sfx.mjs and,
// for the big wet layered ones, dev/make-sfx-wet.mjs), fetched as soon as the intro starts and decoded once the
// visitor's first touch has unlocked audio. 'slurp' (1.93 s: a long rising suck that runs into the wet smack as the
// tip goes in, at ~1.51-1.55 s, then gulps) is the tongue's only sound. (Its other sounds, lick1-3, drip1-3,
// splash1-3, goo1-2 and squeeze, are still in assets/audio, unused.) 'letter-bang' (0.42 s: a bin hit, the letters
// slamming into it), 'unfold' (2.1 s: paper drawn out with a rustle, the paper unfolding on the glass) and 'wipe1',
// 'wipe2' (~0.9 s each: a squeegee dragged across a window, the hand's two strokes) are the owner's picks, cut from
// the files in dev/sfx-src.
//
//   const sfx = createSfx();           // starts fetching every clip
//   sfx.attach(audioContext);          // on the first pointerdown / key (browsers need a gesture), decodes them all
//   sfx.play('lid-slam', { gain, rate, delay, pan, offset }); // offset: start that far in (s; it fades in 25 ms)
//   const h = sfx.play('slurp'); h?.stop(80);       // play returns a handle (or null): stop(ms) fades it out early
//   sfx.any(['lick1', 'lick2', 'lick3'], { gain }); // a random one of several, never the same twice in a row (its handle)
// Every play gets a little random pitch and level variation (vary: 0.06 by default) so repeats don't sound pasted.
// A clip that hasn't decoded yet is simply skipped.
import { v } from '/assets/v.js';
const NAMES = [
  'throw', 'paper-in', 'lid-slam', 'lid-clap', 'slurp', 'growl', 'thud1', 'thud2', 'spit1', 'spit2', 'splat1', 'splat2',
  'splat3', 'crinkle1', 'crinkle2', 'crinkle3', 'crinkle4', 'letter-bang', 'unfold', 'wipe1', 'wipe2',
];

export function createSfx({ base = '/assets/audio/', volume = 0.85 } = {}) {
  const raw = new Map(NAMES.map((n) => [n, fetch(v(`${base}${n}.mp3`)).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null)]));
  const buffers = new Map();
  let ctx = null, master = null;
  const last = new Map();
  return {
    attach(ac) {
      if (!ac || ctx === ac) return;
      ctx = ac;
      master = ac.createGain(); master.gain.value = volume; master.connect(ac.destination);
      for (const [name, p] of raw) p.then((ab) => ab && ac.decodeAudioData(ab.slice(0))).then((b) => { if (b) buffers.set(name, b); }).catch(() => {});
    },
    play(name, { gain = 1, rate = 1, delay = 0, pan = 0, vary = 0.06, offset = 0 } = {}) {
      const b = buffers.get(name);
      if (!ctx || !b || ctx.state === 'closed') return null;
      try {
        const src = ctx.createBufferSource();
        src.buffer = b;
        src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * vary);
        const g = ctx.createGain(), level = Math.max(0, gain * (1 + (Math.random() * 2 - 1) * vary)), at = ctx.currentTime + delay;
        const off = Math.min(Math.max(0, +offset || 0), b.duration - 0.05);
        g.gain.value = level;
        // (started part way in, it fades in over 25 ms: no click from cutting into the waveform)
        if (off > 0) { g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(level, at + 0.025); }
        src.connect(g);
        if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p).connect(master); }
        else g.connect(master);
        src.start(at, off);
        return {
          stop(ms = 60) {
            try {
              const now = ctx.currentTime;
              g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now);
              g.gain.linearRampToValueAtTime(0, now + ms / 1000); src.stop(now + ms / 1000 + 0.02);
            } catch (e) { /* already ended */ }
          },
        };
      } catch (e) { return null; /* a sound never breaks the show */ }
    },
    any(names, opts) {
      const key = names.join(), prev = last.get(key);    // remembered per list: a lick in between doesn't reset it
      const pool = names.length > 1 ? names.filter((n) => n !== prev) : names;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      last.set(key, pick);
      return this.play(pick, opts);
    },
  };
}
