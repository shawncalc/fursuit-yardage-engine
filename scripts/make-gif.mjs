/**
 * One-shot generator for docs/demo.gif: drives the demo page through a few
 * representative states with puppeteer-core + system Chrome, reads pixels
 * via an in-page canvas (RGBA, no PNG decoding needed), then encodes a
 * looping GIF with gifenc.
 *
 *   node scripts/make-gif.mjs
 */

import puppeteer from 'puppeteer-core';
import gifenc from 'gifenc';
const { GIFEncoder, quantize, applyPalette } = gifenc;
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const STATES = [
  { name: 'full suit', suitType: 'full-digitigrade', lt: false },
  { name: 'tail only', suitType: 'tail-only', lt: true },
  { name: 'partial', suitType: 'partial', lt: false },
  { name: 'head only', suitType: 'head-only', lt: false },
  { name: 'plantigrade', suitType: 'full-plantigrade', lt: false },
];

const WIDTH = 960;
const HEIGHT = 1080;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  defaultViewport: { width: WIDTH, height: 1200, deviceScaleFactor: 1 },
});

const page = await browser.newPage();
await page.goto('file:///' + join(root, 'demo/index.html').replace(/\\/g, '/'));
await page.waitForFunction(() => document.getElementById('totalYards').textContent !== '–');

const frames = [];
for (const state of STATES) {
  await page.select('#suitType', state.suitType);
  await page.evaluate((lt) => {
    document.getElementById('largeTail').checked = lt;
    document.getElementById('largeTail').dispatchEvent(new Event('change'));
    window.scrollTo(0, 0);
  }, state.lt);
  await new Promise((r) => setTimeout(r, 400));
  const shot = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT }, type: 'png' });
  frames.push(shot);
  console.log(`captured: ${state.name}`);
}
await browser.close();

// Decode PNGs with pngjs (tiny, zero transitive deps) and encode the GIF.
const { PNG } = await import('pngjs');
const gif = GIFEncoder();
for (const pngBuf of frames) {
  const png = PNG.sync.read(pngBuf);
  const { data, width, height } = png;
  const palette = quantize(data, 256);
  const index = applyPalette(data, palette);
  gif.writeFrame(index, width, height, { palette, delay: 1600 });
}
gif.finish();
const out = join(root, 'docs/demo.gif');
writeFileSync(out, gif.bytes());
console.log(`wrote ${out}`);
