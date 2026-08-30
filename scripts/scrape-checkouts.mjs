/**
 * Scrape des routes de checkout depuis dartscheckoutassistant.com.
 *
 * Pour chaque score de 2 à 170 (hors bogey numbers), récupère la page
 * `score-remaining-{n}` (ou un slug alternatif hérité, cf. ALT_SLUGS), parse les
 * lignes "Throw:" / "Backup:" / "Option:" et écrit `src/data/checkouts.js` avec
 * les routes au format fléchette du projet.
 *
 * Usage : node scripts/scrape-checkouts.mjs
 *
 * Les routes optimales sont des faits ; la curation backup/options provient de
 * dartscheckoutassistant.com (mention affichée dans l'app).
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../src/data/checkouts.js");

// Impossibles à finir en 3 fléchettes (double-out).
const BOGEY = new Set([159, 162, 163, 165, 166, 168, 169]);

// Scores dont le slug standard renvoie 404 : le site les publie sous un slug
// alternatif hérité (chemin complet après /the-outs/).
const ALT_SLUGS = {
  2: "2-60/2-2",
  3: "2-60/3-2",
  10: "2-60/10-2",
  40: "2-60/40-2",
  146: "131-160/score-remaining-144-2", // URL au libellé erroné, contenu = checkout de 146
};

function rangeFor(n) {
  if (n <= 60) return "2-60";
  if (n <= 90) return "61-90";
  if (n <= 130) return "91-130";
  if (n <= 160) return "131-160";
  return "161-170";
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** "Treble 20" | "Double Bull" | "Single 12 leaves 40" -> objet fléchette du projet. */
function parseDart(token) {
  const t = token.trim();
  if (/double\s+bull/i.test(t) || /^bull(seye)?$/i.test(t) || /inner\s+bull/i.test(t)) {
    return { type: "bull", sector: null, pts: 50, label: "Bull" };
  }
  if (/single\s+bull/i.test(t) || /outer\s+bull/i.test(t)) {
    return { type: "bull", sector: null, pts: 25, label: "Outer" };
  }
  const m = t.match(/(single|double|treble|triple)\s+(\d{1,2})/i);
  if (!m) return null;
  const kind = m[1].toLowerCase();
  const sector = Number(m[2]);
  if (kind === "single") return { type: "single", sector, pts: sector, label: String(sector) };
  if (kind === "double") return { type: "double", sector, pts: sector * 2, label: `D${sector}` };
  return { type: "triple", sector, pts: sector * 3, label: `T${sector}` };
}

/** "Treble 20, Double 20" -> [dart, dart] */
function parseRoute(words) {
  return words
    .split(",")
    .map(parseDart)
    .filter(Boolean);
}

function routeKey(darts) {
  return darts.map((d) => d.label).join("-");
}

function validFinish(darts, score) {
  if (!darts.length || darts.length > 3) return false;
  const sum = darts.reduce((s, d) => s + d.pts, 0);
  const last = darts[darts.length - 1];
  return sum === score && (last.type === "double" || (last.type === "bull" && last.pts === 50));
}

function extractContent(htmlText) {
  const cleaned = htmlText.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
  const m = cleaned.match(/entry-content[^>]*>([\s\S]*?)<(?:footer|\/article)/);
  if (!m) return "";
  return m[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/&#8211;|&#8212;/g, "-")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseEntry(text, score) {
  const lines = [...text.matchAll(/(Throw|Backup|Option)\s*:\s*([^(]*?)\s*\(/g)];

  const seen = new Set();
  const finishes = []; // { label, route } — vraies sorties en double
  let backup = null; // { darts, leaves } — peut être un lancer de préparation

  for (const [, label, words] of lines) {
    const route = parseRoute(words);
    if (!route.length) continue;
    const key = routeKey(route);
    if (seen.has(key)) continue;

    const leavesMatch = words.match(/leaves?\s+(\d+)/i);
    const leaves = leavesMatch ? Number(leavesMatch[1]) : null;
    const isFinish = leaves === null && validFinish(route, score);

    if (isFinish) {
      seen.add(key);
      finishes.push({ label, route });
    } else if (label === "Backup" && !backup) {
      // "Backup:" qui pose un reste plutôt que de finir : gardé pour la révision,
      // ignoré au quiz (seules les sorties valides comptent).
      seen.add(key);
      backup = { darts: route, leaves: leaves ?? score - route.reduce((s, d) => s + d.pts, 0) };
    }
  }

  if (!finishes.length) return null;

  const primaryIdx = finishes.findIndex((f) => f.label === "Throw");
  const [primaryEntry] = finishes.splice(primaryIdx >= 0 ? primaryIdx : 0, 1);

  if (!backup) {
    const backupIdx = finishes.findIndex((f) => f.label === "Backup");
    if (backupIdx >= 0) backup = { darts: finishes.splice(backupIdx, 1)[0].route, leaves: null };
  }

  return {
    primary: primaryEntry.route,
    backup,
    options: finishes.map((f) => f.route),
  };
}

async function fetchScore(n) {
  const alt = ALT_SLUGS[n];
  const url = alt
    ? `https://dartscheckoutassistant.com/the-outs/${alt}/`
    : `https://dartscheckoutassistant.com/the-outs/${rangeFor(n)}/score-remaining-${n}/`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) return null;
  // Le site redirige certains slugs standard manquants (ex: -2 -> -20) : on rejette.
  if (!alt && !res.url.includes(`score-remaining-${n}/`)) return null;
  const text = extractContent(await res.text());
  if (!text) return null;
  return parseEntry(text, n);
}

async function main() {
  const checkouts = {};
  for (let n = 2; n <= 170; n++) {
    if (BOGEY.has(n)) continue;

    let entry = null;
    for (let attempt = 0; attempt < 3 && !entry; attempt++) {
      try {
        entry = await fetchScore(n);
      } catch (err) {
        console.warn(`  retry ${n}: ${err.message}`);
        await sleep(500);
      }
    }
    if (!entry) {
      console.warn(`${n}  MANQUANT (aucune donnée)`);
      continue;
    }
    checkouts[n] = entry;
    const extra = [entry.backup && "backup", entry.options.length && `${entry.options.length} opt`]
      .filter(Boolean)
      .join(", ");
    console.log(`${n}  ${routeKey(entry.primary)}${extra ? `  [${extra}]` : ""}`);
    await sleep(150);
  }

  const scores = Object.keys(checkouts).map(Number).sort((a, b) => a - b);
  const entries = scores
    .map((s) => `  "${s}": ${JSON.stringify(checkouts[s])},`)
    .join("\n");
  const body = [
    "/**",
    " * Table des routes de checkout (finish en double-out), scores 2 à 170.",
    " * Généré par scripts/scrape-checkouts.mjs — données : dartscheckoutassistant.com",
    " * Ne pas éditer à la main : relancer le script.",
    " *",
    " * Chaque entrée : { primary: Dart[], backup: { darts: Dart[], leaves: number|null }|null, options: Dart[][] }",
    " *   backup.leaves : reste laissé par un lancer de préparation (null = c'est une sortie).",
    " * Dart = { type: 'single'|'double'|'triple'|'bull', sector: number|null, pts: number, label: string }",
    " */",
    "export const CHECKOUTS = {",
    entries,
    "}",
    "",
    `export const CHECKOUT_SCORES = ${JSON.stringify(scores)}`,
    "",
    "export const CHECKOUT_DATA_SOURCE = 'dartscheckoutassistant.com'",
    "",
  ].join("\n");

  await writeFile(OUT, body);
  console.log(`\n✓ ${scores.length} checkouts → ${OUT}`);
}

main();
