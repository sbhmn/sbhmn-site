// Cache-busting for the files scripts fetch themselves (models, the paper's prints, sounds, font data): the URL with
// its content stamp (?v=<hash>), read from the page's import map, which dev/stamp.mjs writes with every file under
// /assets in it. Scripts need nothing: their imports (static, dynamic, relative) go through the import map on their
// own. A page without the map (the dev labs) or a browser without import.meta.resolve gets the plain URL.
//   import { v } from '/assets/v.js';   fetch(v('/assets/3d/paper.json'))
export const v = (url) => {
  try { return import.meta.resolve(url); } catch (e) { return url; }
};
