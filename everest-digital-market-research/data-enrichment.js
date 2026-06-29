/**
 * data-enrichment.js
 * Extrait des informations structurées depuis une liste d'URLs (concurrents, prospects).
 *
 * Usage: node scripts/data-enrichment.js
 * Adapter URLS selon les cibles à enrichir.
 */

import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

// ── Adapter cette liste ──────────────────────────────────────────────────────
const URLS = [
  "https://www.simplebo.fr",
  "https://www.nocodefactory.io",
  // Ajouter d'autres URLs ici
];
// ────────────────────────────────────────────────────────────────────────────

const contents = await exa.getContents(URLS, {
  highlights: { numSentences: 4, highlightsPerUrl: 3 },
  text: { maxCharacters: 8000 }
});

const enriched = contents.results.map((r) => ({
  url: r.url,
  highlights: r.highlights ?? [],
  text_preview: r.text?.slice(0, 400) ?? ""
}));

console.log(JSON.stringify(enriched, null, 2));
