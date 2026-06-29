/**
 * trend-monitoring.js
 * Veille hebdomadaire sur le marché des agences web en France.
 *
 * Usage: node scripts/trend-monitoring.js
 * Idéal en tâche planifiée (cron hebdo ou Make/n8n schedule).
 */

import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

const result = await exa.search(
  "marché agences web France TPE PME tendances intelligence artificielle facturation électronique 2026",
  {
    type: "deep-reasoning",
    category: "news",
    numResults: 10,
    maxAgeHours: 168, // 7 derniers jours
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
                description:
                  "Ce que cette tendance implique pour une agence web positionnée sur les TPE"
              }
            }
          }
        }
      }
    }
  }
);

console.log(JSON.stringify(result.output?.content, null, 2));
