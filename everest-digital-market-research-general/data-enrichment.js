/**
 * data-enrichment.js
 * Extract structured facts from a list of URLs (competitors, prospects, sources).
 *
 * Usage: node scripts/data-enrichment.js
 * Adapt URLS to the pages you want to enrich.
 */

import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

// ── Adapt this list ──────────────────────────────────────────────────────────
const URLS = [
  "https://www.competitor-one.com",
  "https://www.competitor-two.com",
  // Add more URLs here
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
