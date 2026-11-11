// Puts the stats and top-languages cards in the same 600-wide frame (12px inset) as the
// project cards, so the two sit side by side at 50% with matching edges, gap and height.
import { readFileSync, writeFileSync } from "node:fs";

const FRAME_W = 600, PAD = 12, INNER_W = FRAME_W - 2 * PAD;

for (const name of ["stats", "langs"]) {
  for (const theme of ["light", "dark"]) {
    const file = `assets/live/${name}-${theme}.svg`;
    const svg = readFileSync(file, "utf8").trim();
    if (svg.includes('data-framed="1"')) continue;           // already framed
    const w = +svg.match(/width="([\d.]+)"/)[1];
    const h = +svg.match(/height="([\d.]+)"/)[1];
    const innerH = INNER_W * h / w, frameH = innerH + 2 * PAD;
    // Resize the card's own root <svg> and nest it inside the frame
    const inner = svg.replace(/width="[\d.]+"/, `x="${PAD}" y="${PAD}" width="${INNER_W}"`)
                     .replace(/height="[\d.]+"/, `height="${innerH.toFixed(2)}"`);
    writeFileSync(file, `<svg xmlns="http://www.w3.org/2000/svg" data-framed="1" width="${FRAME_W}" height="${frameH.toFixed(2)}" viewBox="0 0 ${FRAME_W} ${frameH.toFixed(2)}">${inner}</svg>\n`);
  }
}
