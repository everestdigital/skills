---
name: everest-digital-market-research-general
description: >-
  Market research using the Exa API. Use when the user asks to: research competitors,
  discover prospects, monitor market trends, enrich company or people data, profile
  businesses, find leads, or automate research pipelines. Triggers on: "research
  competitors with Exa", "find prospects", "monitor market trends", "enrich company
  data", "competitor profiling", "prospect discovery", "market intelligence", "lead
  research", "trend monitoring". Requires EXA_API_KEY.
---

# Market Research with Exa

> Requires `EXA_API_KEY` in the environment and `exa-js` installed (`npm install exa-js dotenv`).

Use the [Exa API](https://exa.ai) — a search engine built for AI agents — to run structured market research. Four use cases: competitor profiling, prospect discovery, trend monitoring, and data enrichment.

## When to Use

- User wants to find and profile competitors (agencies, SaaS, platforms)
- User wants to discover prospects or leads (businesses, artisans, local shops)
- User wants to monitor market news and trends
- User wants to extract structured data from a list of URLs or find contacts

## API Concepts

**Search types** — choose based on depth:
- `auto` (~1s) — default, balanced
- `fast` (~450ms) — quick lookups
- `deep` (4–15s) — multi-constraint queries, structured output; **prefer for competitor profiling**
- `deep-reasoning` (12–40s) — cross-source synthesis; **prefer for trend monitoring**

**Category filters:**
- `company` — 50M+ company profiles; use for agencies, SaaS, businesses
- `people` — 1B+ profiles; use for founder/contact enrichment
- `news` — current events; use for trend monitoring
- Omit category for individual artisans/sole traders — they appear on directories, not company profiles

**Content modes:**
- `highlights: true` — cheapest (10x vs text); use for prospect lists and quick facts
- `text: { maxCharacters: N }` — full page content; use for deep analysis
- `output_schema` — structured JSON output; use for pipelines and automation

**`output_schema` rules:** max nesting depth 2 · max 10 properties · never add citation fields (already in `output.grounding`)

## Instructions

### 1. Competitor Profiling

Generate a script that searches for competitors using `type: "deep"` and `category: "company"` with an `output_schema`. Adapt the query to the user's market, geography, and service type.

```javascript
import Exa from "exa-js";
import * as dotenv from "dotenv";
dotenv.config();

const exa = new Exa(process.env.EXA_API_KEY);

const result = await exa.search(
  "web agencies specializing in [SERVICE] for [TARGET MARKET] in [GEOGRAPHY]",
  {
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
              positioning: { type: "string", description: "Core value proposition in one sentence" },
              target_market: { type: "string", description: "Who they target: sectors, size, geography" },
              price_range: { type: "string", description: "Pricing if public, otherwise 'not disclosed'" }
            }
          }
        }
      }
    }
  }
);

console.log(JSON.stringify(result.output?.content, null, 2));
```

### 2. Prospect Discovery

Use `type: "auto"` with `highlights` (not `output_schema` — 10x cheaper for lists). Omit `category` for sole traders and artisans.

```javascript
const result = await exa.search(
  "[TRADE/BUSINESS TYPE] [GEOGRAPHY] local business",
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

For large-scale lists (100+/month): scrape Google Maps or directories first (e.g. Outscraper), then use `exa.getContents()` to enrich and qualify each URL.

### 3. Trend Monitoring

Use `type: "deep-reasoning"` + `category: "news"` + `maxAgeHours`. Set `maxAgeHours: 168` for weekly cadence.

```javascript
const result = await exa.search(
  "[INDUSTRY] trends [YEAR] market shifts [COUNTRY]",
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
              implications: { type: "string", description: "Impact on service providers in this market" }
            }
          }
        }
      }
    }
  }
);

console.log(JSON.stringify(result.output?.content, null, 2));
```

`maxAgeHours` reference: `0` = always livecrawl · `24` = daily · `168` = weekly · `-1` = cache only (fastest)

### 4. Data Enrichment

Use `exa.getContents()` to extract facts from known URLs. Use `category: "people"` to find founders or contacts.

```javascript
// Enrich known URLs
const contents = await exa.getContents(
  ["https://example.com", "https://competitor.com"],
  {
    highlights: { numSentences: 4, highlightsPerUrl: 3 },
    text: { maxCharacters: 8000 }
  }
);

// Find founder/contact
const people = await exa.search("founder CEO [COMPANY NAME] LinkedIn", {
  type: "auto",
  category: "people",
  numResults: 3,
  contents: { highlights: true }
});
```

## Make / n8n Integration

Call the Exa REST API directly from an HTTP Request node — no Node.js required:

```
POST https://api.exa.ai/search
x-api-key: {{EXA_API_KEY}}
Content-Type: application/json

{
  "query": "...",
  "type": "deep",
  "category": "company",
  "numResults": 20
}
```

Store `EXA_API_KEY` in Make/n8n's secret manager — never hardcode it.

## Pitfalls

- Never put `EXA_API_KEY` in source code
- Don't use `output_schema` for large prospect lists — use `highlights` (10x cheaper)
- Don't use `category: "company"` for individual artisans — omit it
- Don't combine `category: "company"` with `excludeDomains` — unsupported
- Don't combine `category: "people"` with `startPublishedDate` — unsupported
- Don't add citation fields to `output_schema` — already in `output.grounding`
