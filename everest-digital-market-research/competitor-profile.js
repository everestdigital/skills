/**
 * competitor-profile.js
 * Trouve et profile les agences web françaises sur le segment TPE/artisans.
 *
 * Usage: node scripts/competitor-profile.js
 * Output: JSON vers stdout — rediriger vers un fichier si besoin
 *   node scripts/competitor-profile.js > results/competitors.json
 */

import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

const result = await exa.search(
  "agences web françaises spécialisées création site internet TPE artisans PME abonnement mensuel",
  {
    type: "deep",
    category: "company",
    numResults: 20,
    output_schema: {
      type: "object",
      required: ["agencies"],
      properties: {
        agencies: {
          type: "array",
          items: {
            type: "object",
            required: ["name", "url", "positioning", "target_market", "price_range"],
            properties: {
              name: { type: "string" },
              url: { type: "string" },
              positioning: {
                type: "string",
                description: "Proposition de valeur principale en une phrase"
              },
              target_market: {
                type: "string",
                description: "Secteurs, taille d'entreprise, zone géographique ciblés"
              },
              price_range: {
                type: "string",
                description: "Fourchette tarifaire si visible, sinon 'non communiqué'"
              }
            }
          }
        }
      }
    }
  }
);

console.log(JSON.stringify(result.output?.content, null, 2));
