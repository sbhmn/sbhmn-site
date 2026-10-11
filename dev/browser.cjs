// The headless browser the dev scripts drive (playwright-core), picked per platform:
//   Windows: Edge (channel msedge), WebGL on the GPU through D3D11.
//   elsewhere (macOS, Linux, a cloud container): Chromium, WebGL on SwiftShader (the CPU, no GPU needed): $CHROME_PATH
//   if set, else $PLAYWRIGHT_BROWSERS_PATH/chromium if there is one (Claude Code's cloud containers), else Playwright's
//   own (cd dev && npx playwright-core install chromium).
// The packages (playwright-core, sharp) come from dev/node_modules (cd dev && npm install), or failing that from
// C:/Ideas/Shapeshot/node_modules.
//   const { launch, dep } = require('./browser.cjs');  const b = await launch();  const sharp = dep('sharp');
const fs = require('fs');
const path = require('path');

const dep = (name) => {
  try { return require(name); } catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') throw e;
    try { return require(`C:/Ideas/Shapeshot/node_modules/${name}`); }
    catch { throw new Error(`no ${name}: cd dev && npm install`, { cause: e }); }
  }
};
const { chromium } = dep('playwright-core');

const pw = process.env.PLAYWRIGHT_BROWSERS_PATH && path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, 'chromium');
const launch = () => chromium.launch(process.platform === 'win32'
  ? { channel: 'msedge', headless: true, args: ['--use-angle=d3d11', '--enable-unsafe-swiftshader'] }
  : {
    headless: true,
    executablePath: process.env.CHROME_PATH || (pw && fs.existsSync(pw) ? pw : undefined),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });

module.exports = { launch, dep };
