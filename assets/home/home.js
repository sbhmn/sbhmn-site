// The home page's living layer: the spider web behind everything and each game's 3D object in its stage
// (assets/home/stage.js draws them all on one canvas). It waits for the intro (assets/intro.js) to hand over: the
// intro has its own canvas, and two busy canvases at once would only fight for the GPU.
import { createStage } from './stage.js';

const canvas = document.querySelector('.stage-canvas');
const stages = [...document.querySelectorAll('.stage[data-scene]')];
let stage = null;

async function boot() {
  try {
    stage = createStage({ canvas, debug: location.search.includes('debug') });
  } catch (e) {
    return; // no WebGL: the stages keep their still pictures
  }
  const load = (name) => import(`./scenes/${name}.js`);
  // Each scene on its own: one that fails to load leaves the others (and the page) alone.
  await load('background').then((m) => stage.setBackground(m)).catch((e) => console.warn('background', e));
  await Promise.all(stages.map(async (el) => {
    try {
      await stage.addView(el, await load(el.dataset.scene));
      el.classList.add('live');
    } catch (e) {
      console.warn(el.dataset.scene, e); // this stage keeps its picture
    }
  }));
  if (!document.documentElement.classList.contains('intro-on')) stage.start();
}

// The intro tells us when the page goes in under its landed paper (hand-off: draw the page as the paper prints it,
// detail.at seconds in, and hold it while the paper fades off it), when the page shows (start: it comes alive) and when
// the intro plays again (pause, and back to the start: the page it hands over to must be its first moments again).
document.addEventListener('sbhmn:handoff', (e) => stage?.hold(e.detail?.at ?? 0));
document.addEventListener('sbhmn:reveal', () => stage?.start());
document.addEventListener('sbhmn:intro-start', () => {
  if (!stage) return;
  stage.stop();
  if (stage.clock > 0) stage.rewind().catch((e) => console.warn('rewind', e));
});
boot();
