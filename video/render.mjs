/**
 * render.mjs — Render VeloTradefiVideo locally using Node.js
 * Usage: node render.mjs
 *
 * Requires: @remotion/bundler, @remotion/renderer, remotion
 */
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const entry = resolve(__dirname, "src/index.ts");

const bundleLocation = await bundle({
  entryPoint: entry,
});

const composition = await selectComposition({
  serveUrl: bundleLocation,
  id: "VeloTradefiVideo",
});

console.log(`Rendering: ${composition.id} — ${composition.durationInFrames} frames @ ${composition.fps}fps`);

await renderMedia({
  composition,
  serveUrl: bundleLocation,
  codec: "h264",
  outputLocation: resolve(__dirname, "out/velo-tradefi.mp4"),
});

console.log("Done → out/velo-tradefi.mp4");
