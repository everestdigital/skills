# n8n Integration Guide

This guide walks you through setting up automated market research workflows using n8n self-hosted, the Exa API, and your existing stack (HubSpot, Slack, Notion).

---

## Prerequisites

- n8n self-hosted running on your Oracle Cloud VPS
- An Exa API key (from [dashboard.exa.ai](https://dashboard.exa.ai))
- HubSpot connected to n8n
- Slack workspace with at least two channels: one for competitor alerts, one for trend digests
- Notion connected to n8n

---

## Step 1 — Store your Exa API key in n8n

Never paste your API key directly into a workflow node. n8n has a built-in Credentials Manager that encrypts secrets at rest.

1. In your n8n instance, go to **Settings → Credentials**
2. Click **Add Credential**
3. Search for **Header Auth**
4. Fill in:
   - **Name:** `Exa API Key` (you'll reference this by name in every HTTP Request node)
   - **Name (header):** `x-api-key`
   - **Value:** your Exa API key
5. Click **Save**

That's it. You'll select this credential in every Exa HTTP Request node — if your key changes, update it once here and all workflows update automatically.

---

## Understanding n8n basics

Before building workflows, here are the four node types you'll use throughout this guide:

| Node | Role |
|------|------|
| **Schedule Trigger** | Starts a workflow automatically at a defined interval (daily, weekly, etc.) |
| **HTTP Request** | Calls the Exa API — this is where your search query lives |
| **Code** | Transforms the raw JSON response from Exa into the shape you need |
| **HubSpot / Slack / Notion** | Pushes results to your tools |

A workflow is simply a chain of nodes. Data flows left to right — each node receives the output of the previous one.

---

## Workflow 1 — Weekly Competitor Monitor → Notion

**What it does:** Every Monday morning, searches for web agencies targeting TPE/artisans in Île-de-France, and saves a structured report to a Notion database.

**When to use it:** Ongoing competitive intelligence. You open Notion on Monday and have a fresh view of what competitors are doing.

### Build it

**Step 1 — Add a Schedule Trigger node**

1. Create a new workflow
2. Add a **Schedule Trigger** node
3. Set it to **Every Week**, on **Monday** at **08:00**

**Step 2 — Add an HTTP Request node**

1. Add an **HTTP Request** node after the trigger
2. Configure it:
   - **Method:** POST
   - **URL:** `https://api.exa.ai/search`
   - **Authentication:** select **Header Auth** → choose your `Exa API Key` credential
   - **Body Content Type:** JSON
   - **Body:**
```json
{
  "query": "agences web Île-de-France spécialisées TPE artisans site internet abonnement mensuel",
  "type": "deep",
  "category": "company",
  "numResults": 20,
  "outputSchema": {
    "type": "object",
    "required": ["competitors"],
    "properties": {
      "competitors": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["name", "url", "positioning", "target_market", "price_range"],
          "properties": {
            "name": { "type": "string" },
            "url": { "type": "string" },
            "positioning": { "type": "string" },
            "target_market": { "type": "string" },
            "price_range": { "type": "string" }
          }
        }
      }
    }
  }
}
```

**Step 3 — Add a Code node to extract results**

Exa returns results inside `output.content.competitors`. This node extracts and flattens them:

```javascript
const body = $input.first().json;
const competitors = body.output?.content?.competitors ?? [];

return competitors.map(c => ({
  json: {
    name: c.name,
    url: c.url,
    positioning: c.positioning,
    target_market: c.target_market,
    price_range: c.price_range,
    retrieved_at: new Date().toISOString()
  }
}));
```

**Step 4 — Add a Notion node**

1. Add a **Notion** node
2. Connect your Notion account
3. **Operation:** Create Page
4. **Database:** select your competitors database (create one in Notion first with columns: Name, URL, Positioning, Target Market, Price Range, Retrieved At)
5. Map each field from the Code node output to the corresponding Notion property

**Step 5 — Test and activate**

Click **Test Workflow** to run it once manually and verify data appears in Notion. Then toggle **Active** to enable the weekly schedule.

---

## Workflow 2 — Weekly Trend Digest → Slack

**What it does:** Every Friday afternoon, searches for market news affecting micro-businesses and their digital service providers, then posts a digest to a Slack channel.

**When to use it:** Staying on top of regulatory changes (e.g. facturation électronique), competitor funding rounds, digital adoption statistics — without manually searching.

### Build it

**Step 1 — Schedule Trigger**

- **Every Week**, on **Friday** at **17:00**

**Step 2 — HTTP Request node**

```json
{
  "query": "agences web TPE PME artisans France tendances numériques facturation électronique 2026",
  "type": "deep-reasoning",
  "category": "news",
  "numResults": 8,
  "contents": {
    "maxAgeHours": 168
  },
  "outputSchema": {
    "type": "object",
    "required": ["trends"],
    "properties": {
      "trends": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["trend", "source", "implications"],
          "properties": {
            "trend": { "type": "string" },
            "source": { "type": "string" },
            "implications": { "type": "string" }
          }
        }
      }
    }
  }
}
```

**Step 3 — Code node to format the Slack message**

```javascript
const body = $input.first().json;
const trends = body.output?.content?.trends ?? [];

const lines = trends.map((t, i) =>
  `*${i + 1}. ${t.trend}*\n_Source: ${t.source}_\n${t.implications}`
);

const message = `*📊 Veille marché — ${new Date().toLocaleDateString('fr-FR')}*\n\n` + lines.join('\n\n');

return [{ json: { message } }];
```

**Step 4 — Slack node**

1. Add a **Slack** node
2. Connect your Slack workspace
3. **Operation:** Send Message
4. **Channel:** your market watch channel (e.g. `#veille-marché`)
5. **Message:** `{{ $json.message }}`
6. Enable **Markdown** formatting

---

## Workflow 3 — Prospect Discovery → HubSpot

**What it does:** On demand (or weekly), searches for artisans and local businesses in a target area, then creates contacts in HubSpot for follow-up.

**When to use it:** Before a prospecting campaign — you get a fresh batch of leads directly in your CRM pipeline.

### Build it

**Step 1 — Trigger**

Use a **Manual Trigger** for on-demand runs, or a **Schedule Trigger** for weekly batches.

**Step 2 — HTTP Request node**

```json
{
  "query": "plombiers électriciens menuisiers artisans Île-de-France site web vitrine",
  "type": "auto",
  "numResults": 50,
  "contents": {
    "highlights": true
  }
}
```

> Note: No `category` filter here — individual artisans and sole traders rarely appear in the company index. Using `type: "auto"` without a category returns directory listings, Pages Jaunes entries, and personal business sites where these prospects actually appear.

**Step 3 — Code node to extract and deduplicate**

```javascript
const results = $input.first().json.results ?? [];

return results
  .filter(r => r.url && r.title)
  .map(r => ({
    json: {
      name: r.title,
      website: r.url,
      excerpt: r.highlights?.[0] ?? '',
      source: 'exa-prospection',
      created_at: new Date().toISOString()
    }
  }));
```

**Step 4 — HubSpot node**

1. Add a **HubSpot** node
2. Connect your HubSpot account
3. **Operation:** Create Contact (or Create Company if the result looks like a business)
4. Map:
   - **Company Name** → `name`
   - **Website** → `website`
   - **Description** → `excerpt`
   - **Lead Source** → `source` (use a fixed value: `Exa Prospection`)
5. In your HubSpot pipeline, set the initial stage to your first prospecting stage

**Tip:** Add an **IF** node before HubSpot to filter out results that don't look like real prospects (e.g. where `excerpt` is empty, or `url` contains `facebook.com` or `pagesjaunes.fr`).

---

## Workflow 4 — Competitor Enrichment on Demand

**What it does:** Given a list of competitor URLs, fetches structured content from each and saves enriched profiles to Notion.

**When to use it:** When you discover a new competitor and want a quick profile without manual research.

### Build it

**Step 1 — Manual Trigger with input**

Use a **Manual Trigger**. Before running, hardcode the URLs to enrich directly in the next node.

**Step 2 — Code node to define URLs**

```javascript
const urls = [
  "https://www.competitor-one.fr",
  "https://www.competitor-two.fr"
];

return urls.map(url => ({ json: { url } }));
```

**Step 3 — HTTP Request node (Contents API)**

This calls the Exa Contents API, not the Search API:

- **Method:** POST
- **URL:** `https://api.exa.ai/contents`
- **Body:**
```json
{
  "ids": ["{{ $json.url }}"],
  "highlights": true,
  "text": { "maxCharacters": 8000 }
}
```

**Step 4 — Code node to extract**

```javascript
const result = $input.first().json.results?.[0];
if (!result) return [];

return [{
  json: {
    url: result.url,
    highlights: (result.highlights ?? []).join(' | '),
    text_preview: (result.text ?? '').slice(0, 500),
    enriched_at: new Date().toISOString()
  }
}];
```

**Step 5 — Notion node**

Save to your competitors database, updating the existing page if the URL already exists, or creating a new one.

---

## Tips and gotchas

**Exa response structure — always check `output.content` vs `results`**

- When you use `outputSchema`: your data is in `body.output.content`
- When you use `contents.highlights` without schema: your data is in `body.results`
- Mixing them up is the most common source of empty outputs

**Rate limits**

Exa doesn't publish hard rate limits, but for automated workflows:
- Space out runs — don't hit the API more than once every few seconds
- For large prospect batches, add a **Wait** node (2–3 seconds) between calls if you're looping

**HubSpot duplicates**

n8n's HubSpot node doesn't deduplicate by default. If you run the prospect workflow weekly, you'll create duplicate contacts. Options:
- Use HubSpot's **Search** node first to check if the URL already exists
- Or add a **Filter** node that only creates a contact if `website` isn't already in your CRM

**Testing without burning API credits**

Use `type: "fast"` and `numResults: 3` when testing a new workflow. Switch to `type: "deep"` and higher `numResults` only once the flow is validated end-to-end.
