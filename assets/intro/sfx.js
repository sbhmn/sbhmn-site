// The intro's sound effects: real recordings (all CC0, freesound.org; see assets/audio/sfx.json and dev/make-sfx.mjs),
// fetched as soon as the intro starts and decoded once the visitor's first touch has unlocked audio.
//
//   const sfx = createSfx();           // starts fetching every clip
//   sfx.attach(audioContext);          // on the first pointerdown / key (browsers need a gesture), decodes them all
//   sfx.play('lid-slam', { gain, rate, delay, pan });
//   sfx.any(['lick1', 'lick2', 'lick3'], { gain }); // a random one of several, never the same twice in a row
// Every play gets a little random pitch and level variation (vary: 0.06 by default) so repeats don't sound pasted.
// A clip that hasn't decoded yet is simply skipped.
const NAMES = [
  'throw', 'paper-in', 'lid-slam', 'lid-clap', 'squeeze', 'lick1', 'lick2', 'lick3', 'slurp', 'drip1', 'drip2', 'drip3',
  'shake', 'bang', 'growl', 'thud1', 'thud2', 'spit1', 'spit2', 'splat1', 'splat2', 'splat3',
  'crinkle1', 'crinkle2', 'crinkle3', 'crinkle4',
];

export function createSfx({ base = '/assets/audio/', volume = 0.85 } = {}) {
  const raw = new Map(NAMES.map((n) => [n, fetch(`${base}${n}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null)]));
  const buffers = new Map();
  let ctx = null, master = null, last = '';
  return {
    attach(ac) {
      if (!ac || ctx === ac) return;
      ctx = ac;
      master = ac.createGain(); master.gain.value = volume; master.connect(ac.destination);
      for (const [name, p] of raw) p.then((ab) => ab && ac.decodeAudioData(ab.slice(0))).then((b) => { if (b) buffers.set(name, b); }).catch(() => {});
    },
    play(name, { gain = 1, rate = 1, delay = 0, pan = 0, vary = 0.06 } = {}) {
      const b = buffers.get(name);
      if (!ctx || !b || ctx.state === 'closed') return;
      try {
        const src = ctx.createBufferSource();
        src.buffer = b;
        src.playbackRate.value = rate * (1 + (Math.random() * 2 - 1) * vary);
        const g = ctx.createGain();
        g.gain.value = Math.max(0, gain * (1 + (Math.random() * 2 - 1) * vary));
        src.connect(g);
        if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p).connect(master); }
        else g.connect(master);
        src.start(ctx.currentTime + delay);
      } catch (e) { /* a sound never breaks the show */ }
    },
    any(names, opts) {
      const pool = names.length > 1 ? names.filter((n) => n !== last) : names;
      last = pool[Math.floor(Math.random() * pool.length)];
      this.play(last, opts);
    },
  };
}
