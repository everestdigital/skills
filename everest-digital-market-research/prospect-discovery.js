/**
 * prospect-discovery.js
 * Identifie des artisans et TPE potentiellement sans présence web moderne.
 *
 * Usage: node scripts/prospect-discovery.js
 * Adapter QUERY et REGION selon la campagne de prospection.
 */

import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

// ── Adapter ces variables selon la campagne ──────────────────────────────────
const QUERY =
  "plombiers électriciens chauffagistes artisans Île-de-France site web vitrine pages jaunes";
const NUM_RESULTS = 50;
// ────────────────────────────────────────────────────────────────────────────

const result = await exa.search(QUERY, {
  type: "auto",
  category: "company",
  numResults: NUM_RESULTS,
  contents: {
    highlights: { numSentences: 2, highlightsPerUrl: 2 }
  }
});

const prospects = result.results.map((r) => ({
  title: r.title,
  url: r.url,
  excerpt: r.highlights?.[0] ?? ""
}));

console.log(JSON.stringify(prospects, null, 2));
console.error(`\n→ ${prospects.length} prospects trouvés`);
