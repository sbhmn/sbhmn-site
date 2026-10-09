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

// The intro tells us when the page shows (start) and when it plays again (pause).
document.addEventListener('sbhmn:reveal', () => stage?.start());
document.addEventListener('sbhmn:intro-start', () => stage?.stop());
boot();
