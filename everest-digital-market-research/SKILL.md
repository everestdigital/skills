---
disable-model-invocation: true
name: everest-digital-market-research
description: >-
  Internal Everest Paris skill — market research using the Exa API, scoped to the
  French micro-business market (TPE, artisans, commerçants). Use when researching
  French web agency competitors, discovering artisan/TPE prospects in Île-de-France
  or other French regions, monitoring the French digital agency market, or enriching
  prospect/competitor data. Triggers on: "recherche concurrents agences web France",
  "trouve des prospects TPE artisans", "veille concurrentielle Simplébo Nocodefactory",
  "prospects plombiers électriciens Île-de-France", "tendances marché agences web France",
  "enrichis ces URLs concurrents". Requires EXA_API_KEY.
---

# Everest Digital — Market Research (France)

> Internal skill for Everest Paris. Requires `EXA_API_KEY` in the environment and `exa-js` installed (`npm install exa-js dotenv`).

Market research via [Exa API](https://exa.ai) scoped to the French micro-business market. Target clients are TPE/artisans (plombiers, électriciens, menuisiers, restaurants, coiffeurs) — low digital maturity, sparse online presence, often listed only on Pages Jaunes or Google Maps.

## When to Use

- Research French web agency competitors (Simplébo, Nocodefactory, and others)
- Discover TPE/artisan prospects in a French region (Île-de-France, PACA, etc.)
- Monitor French digital agency market news and regulatory changes (e.g. facturation électronique)
- Enrich competitor or prospect URLs with structured data

## API Concepts

**Search types:**
- `auto` (~1s) — default
- `deep` (4–15s) — structured competitor output; **prefer for profiling**
- `deep-reasoning` (12–40s) — synthesis across sources; **prefer for trend monitoring**

**Categories:**
- `company` — use for agencies and SaaS platforms
- `people` — use for founders and contacts
- `news` — use for trend monitoring
- Omit category for individual artisans/TPE — they appear on directory pages, not company profiles

**Content modes:**
- `highlights: true` — cheapest (10x); use for prospect lists
- `output_schema` — structured JSON; use for competitor profiling and automation

**`output_schema` rules:** max depth 2 · max 10 properties · no citation fields

## Instructions

### 1. Competitor Profiling (French web agencies)

```javascript
import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

const result = await exa.search(
  "agences web françaises spécialisées création site internet TPE artisans PME",
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
              positioning: { type: "string", description: "Proposition de valeur en une phrase" },
              target_market: { type: "string", description: "Secteurs, taille d'entreprise, géographie ciblés" },
              price_range: { type: "string", description: "Tarifs si publics, sinon 'non communiqué'" }
            }
          }
        }
      }
    }
  }
);

console.log(JSON.stringify(result.output?.content, null, 2));
```

**Queries utiles:**
```javascript
"agences web Île-de-France spécialisées artisans TPE site internet"
"concurrents Simplébo Nocodefactory agences web TPE France"
"plateforme création site micro-entreprise abonnement mensuel France"
```

### 2. Prospect Discovery (TPE/artisans)

Omit `category` — les artisans et TPE apparaissent sur des pages d'annuaires, pas comme entreprises.

```javascript
const result = await exa.search(
  "plombiers électriciens artisans [RÉGION] site web vitrine",
  {
    type: "auto",
    numResults: 50,
    contents: {
      highlights: { numSentences: 2, highlightsPerUrl: 2 }
    }
  }
);

const prospects = result.results.map((r) => ({
  title: r.title,
  url: r.url,
  excerpt: r.highlights?.[0] ?? ""
}));

console.log(JSON.stringify(prospects, null, 2));
```

**Queries par métier:**
```javascript
// Bâtiment
"plombiers électriciens menuisiers [région] artisans locaux"
"couvreurs peintres carreleurs [ville] petite entreprise"

// Restauration
"restaurants boulangeries boucheries [ville] TPE site web"

// Beauté / bien-être
"coiffeurs esthéticiennes [ville] salon indépendant"

// Commerce
"fleuristes boutiques commerces indépendants [ville]"
```

Pour les campagnes à volume (60–80 prospects/mois) : scraper Google Maps (Outscraper) en premier, puis utiliser Exa pour enrichir et qualifier chaque URL.

### 3. Veille concurrentielle (marché français)

```javascript
const result = await exa.search(
  "marché agences web France TPE PME tendances 2025 2026",
  {
    type: "deep-reasoning",
    category: "news",
    numResults: 10,
    maxAgeHours: 168,
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
              implications: { type: "string", description: "Impact pour une agence web ciblant les TPE" }
            }
          }
        }
      }
    }
  }
);

console.log(JSON.stringify(result.output?.content, null, 2));
```

**Queries réglementaires et sectorielles:**
```javascript
"obligation facturation électronique TPE France 2026 2027"
"intelligence artificielle impact agences web création site France"
"Simplébo Nocodefactory actualités levée de fonds partenariats 2025"
"taux équipement site internet TPE artisans France statistiques"
```

Pour la veille hebdo : `maxAgeHours: 168` sur un schedule Make ou cron.

### 4. Enrichissement de données

```javascript
// Enrichir des URLs connues (concurrents ou prospects)
const contents = await exa.getContents(
  ["https://www.simplebo.fr", "https://www.nocodefactory.io"],
  {
    highlights: { numSentences: 5, highlightsPerUrl: 3 },
    text: { maxCharacters: 8000 }
  }
);

// Trouver le fondateur / contact commercial
const people = await exa.search(
  "fondateur dirigeant [NOM AGENCE] LinkedIn",
  {
    type: "auto",
    category: "people",
    numResults: 3,
    contents: { highlights: true }
  }
);
```

## Intégration Make / n8n

Appel direct via HTTP Request (pas besoin de Node.js) :

```
POST https://api.exa.ai/search
x-api-key: {{EXA_API_KEY}}
Content-Type: application/json

{
  "query": "agences web TPE Île-de-France",
  "type": "deep",
  "category": "company",
  "numResults": 20
}
```

Stocker `EXA_API_KEY` dans le gestionnaire de secrets Make/n8n — ne jamais le hardcoder.

## À éviter

- Ne jamais mettre `EXA_API_KEY` dans le code source
- Ne pas utiliser `output_schema` pour les listes de prospects — utiliser `highlights` (10x moins cher)
- Ne pas utiliser `category: "company"` pour les artisans individuels — omettre la catégorie
- Ne pas combiner `category: "company"` avec `excludeDomains` — non supporté
- Ne pas combiner `category: "people"` avec `startPublishedDate` — non supporté
- Ne pas ajouter de champs citation dans `output_schema` — déjà dans `output.grounding`
