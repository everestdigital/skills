/**
 * trend-monitoring.js
 * Track trends affecting micro-businesses and their service providers.
 * Ideal as a weekly scheduled task (cron or Make/n8n schedule trigger).
 *
 * Usage: node scripts/trend-monitoring.js
 */

import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

// ── Adapt query to your market and country ───────────────────────────────────
const QUERY =
  "digital adoption small business artisans micro-business website trends 2025 2026";
// ────────────────────────────────────────────────────────────────────────────

const result = await exa.search(QUERY, {
  type: "deep-reasoning",
  category: "news",
  numResults: 10,
  maxAgeHours: 168, // last 7 days
  output_schema: {
    type: "object",
    required: ["trends"],
    properties: {
      trends: {
        type: "array",
        items: {
          type: "object",
          required: ["trend", "source", "implications"],
          properties: {
            trend: { type: "string" },
            source: { type: "string" },
            implications: {
              type: "string",
              description: "What this means for a service provider targeting micro-businesses"
            }
          }
        }
      }
    }
  }
});

console.log(JSON.stringify(result.output?.content, null, 2));
