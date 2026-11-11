// Draws a contribution card in light and dark versions.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";

const USER = process.env.GH_USER;
const TOKEN = process.env.GH_TOKEN;
const OUT = "assets/live";

// Layout: every position is worked out from these numbers
const W = 880, M = 40, GAP = 24, CELL_GAP = 3;
const KICKER_Y = 60, NUM_Y = 120, LABEL_Y = 146, MONTH_Y = 188, GRID_Y = 200;

const THEMES = {
  light: { card: "#f0eee9", empty: "#ffffff", levels: ["#ecffb2", "#7cee6a", "#39594d", "#152717"],
           ink: "#212121", muted: "#73738a", kicker: "#39594d" },
  dark:  { card: "#17171c", empty: "#24242c", levels: ["#23402c", "#39594d", "#5fae5a", "#7cee6a"],
           ink: "#ffffff", muted: "#9a9aae", kicker: "#7cee6a" },
};
const LEVEL = { NONE: -1, FIRST_QUARTILE: 0, SECOND_QUARTILE: 1, THIRD_QUARTILE: 2, FOURTH_QUARTILE: 3 };
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

// Optional: put the font files here so they're built into the SVG (otherwise it uses system fonts)
const fontFace = (name, file) => existsSync(file)
  ? `@font-face{font-family:'${name}';src:url(data:font/woff2;base64,${readFileSync(file).toString("base64")}) format('woff2');}` : "";
const FONTS = fontFace("Space Grotesk", "assets/fonts/SpaceGrotesk-Medium.woff2")
            + fontFace("JetBrains Mono", "assets/fonts/JetBrainsMono-Medium.woff2");

const query = `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{
  totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`;
const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: { Authorization: `bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({ query, variables: { login: USER } }),
});
const json = await res.json();
if (json.errors) throw new Error(JSON.stringify(json.errors));
const cal = json.data.user.contributionsCollection.contributionCalendar;
const weeks = cal.weeks;
const days = weeks.flatMap((w) => w.contributionDays);

// Streaks
let longest = 0, run = 0;
for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
let current = 0, i = days.length - 1;
if (days[i].contributionCount === 0) i--;            // today doesn't break the streak yet
for (; i >= 0 && days[i].contributionCount > 0; i--) current++;

// Grid sizes, worked out to fill the inner width
const inner = W - 2 * M;
const step = (inner + CELL_GAP) / weeks.length;
const cell = step - CELL_GAP;
const gridH = 7 * step - CELL_GAP;
const LEGEND_Y = GRID_Y + gridH + 36;
const H = LEGEND_Y + M - 4;
const colW = (inner - 2 * GAP) / 3;
const fmt = (n) => n.toLocaleString("en-US");

const stats = [
  [fmt(cal.totalContributions), "CONTRIBUTIONS · 12 MONTHS"],
  [`${longest}d`, "LONGEST STREAK"],
  [`${current}d`, "CURRENT STREAK"],
];

function render(t) {
  const color = (lvl) => (LEVEL[lvl] < 0 ? t.empty : t.levels[LEVEL[lvl]]);
  const r = Math.max(2, cell * 0.28).toFixed(1);

  const cells = weeks.map((w, wi) => w.contributionDays.map((d) => {
    const row = new Date(d.date + "T00:00:00Z").getUTCDay();
    return `<rect class="c" style="animation-delay:${wi * 14}ms" x="${(M + wi * step).toFixed(2)}" y="${(GRID_Y + row * step).toFixed(2)}" width="${cell.toFixed(2)}" height="${cell.toFixed(2)}" rx="${r}" fill="${color(d.contributionLevel)}"><title>${d.contributionCount} on ${d.date}</title></rect>`;
  }).join("")).join("");

  let prev = -1, lastX = -Infinity, months = "";
  weeks.forEach((w, wi) => {
    const m = new Date(w.contributionDays[0].date + "T00:00:00Z").getUTCMonth();
    const x = M + wi * step;
    if (m !== prev && x - lastX >= 3 * step) { months += `<text class="m" x="${x.toFixed(2)}" y="${MONTH_Y}">${MONTHS[m]}</text>`; lastX = x; }
    prev = m;
  });

  const statsSvg = stats.map(([n, l], si) => {
    const x = M + si * (colW + GAP);
    return `<text class="n" x="${x}" y="${NUM_Y}">${n}</text><text class="m" x="${x}" y="${LABEL_Y}">${l}</text>`;
  }).join("");

  const sw = 11, sg = 4, right = W - M, moreW = 34;
  const legendCells = [t.empty, ...t.levels].map((c, li) =>
    `<rect x="${right - moreW - (5 - li) * (sw + sg)}" y="${LEGEND_Y - sw + 1}" width="${sw}" height="${sw}" rx="3" fill="${c}"/>`).join("");
  const updated = new Date().toISOString().slice(0, 10);

  // Transparent inset so the card edge lines up with the other 1200-wide cards (12px inset)
  const P = +(W * 12 / 1176).toFixed(2), OW = +(W + 2 * P).toFixed(2), OH = +(H + 2 * P).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OW}" height="${OH}" viewBox="-${P} -${P} ${OW} ${OH}" role="img" aria-label="${fmt(cal.totalContributions)} contributions in the last year, longest streak ${longest} days, current streak ${current} days">
<style>${FONTS}
.k{font:500 12px 'JetBrains Mono',ui-monospace,Menlo,monospace;letter-spacing:.1em;fill:${t.kicker}}
.n{font:500 44px 'Space Grotesk',Inter,'Segoe UI',Arial,sans-serif;letter-spacing:-.03em;fill:${t.ink}}
.m{font:500 11px 'JetBrains Mono',ui-monospace,Menlo,monospace;letter-spacing:.08em;fill:${t.muted}}
.c{animation:f .6s ease both}@keyframes f{from{opacity:0}}
</style>
<rect width="${W}" height="${H}" rx="24" fill="${t.card}"/>
<text class="k" x="${M}" y="${KICKER_Y}">ACTIVITY · SHIPPING IN PUBLIC</text>
${statsSvg}${months}${cells}
<text class="m" x="${M}" y="${LEGEND_Y}">UPDATED ${updated}</text>
<text class="m" x="${right - moreW - 5 * (sw + sg) - 8}" y="${LEGEND_Y}" text-anchor="end">LESS</text>
${legendCells}
<text class="m" x="${right}" y="${LEGEND_Y}" text-anchor="end">MORE</text>
</svg>`;
}

mkdirSync(OUT, { recursive: true });
for (const [name, t] of Object.entries(THEMES)) writeFileSync(`${OUT}/contributions-${name}.svg`, render(t));
console.log(`Done: ${cal.totalContributions} contributions, streak ${current}/${longest}`);
