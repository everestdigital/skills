/**
 * competitor-profile.js
 * Find and profile service providers (agencies, SaaS platforms) targeting
 * the micro-business segment in your market.
 *
 * Usage: node scripts/competitor-profile.js
 * Output: JSON to stdout
 *   node scripts/competitor-profile.js > results/competitors.json
 */

import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

// ── Adapt this query to your market ─────────────────────────────────────────
const QUERY =
  "web agencies specializing in website creation for small businesses tradespeople artisans under 5 employees";
// ────────────────────────────────────────────────────────────────────────────

const result = await exa.search(QUERY, {
  type: "deep",
  category: "company",
  numResults: 20,
  output_schema: {
    type: "object",
    required: ["competitors"],
    properties: {
      competitors: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "url", "positioning", "target_market", "price_range"],
          properties: {
            name: { type: "string" },
            url: { type: "string" },
            positioning: {
              type: "string",
              description: "Their core value proposition in one sentence"
            },
            target_market: {
              type: "string",
              description: "Who they target: trades, sectors, company size, geography"
            },
            price_range: {
              type: "string",
              description: "Pricing if publicly visible, otherwise 'not disclosed'"
            }
          }
        }
      }
    }
  }
});

console.log(JSON.stringify(result.output?.content, null, 2));
