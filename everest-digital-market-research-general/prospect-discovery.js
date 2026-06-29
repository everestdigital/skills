/**
 * prospect-discovery.js
 * Identify micro-businesses, artisans, and local shops that are potential clients.
 *
 * Usage: node scripts/prospect-discovery.js
 * Adapt QUERY and NUM_RESULTS to your campaign.
 */

import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

// ── Adapt these variables ────────────────────────────────────────────────────
const QUERY = "plumbers electricians roofers [your city/region] local business website";
const NUM_RESULTS = 50;
// ────────────────────────────────────────────────────────────────────────────

const result = await exa.search(QUERY, {
  type: "auto",
  // No category filter — micro-businesses rarely have standalone company profiles
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
console.error(`\n→ ${prospects.length} prospects found`);
