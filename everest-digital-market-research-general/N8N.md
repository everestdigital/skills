# n8n Integration Guide

This guide walks you through setting up automated market research workflows using n8n self-hosted and the Exa API. It covers four ready-to-use workflows targeting micro-businesses — artisans, tradespeople, local retailers, and very small businesses under 5 employees.

---

## Prerequisites

- n8n self-hosted (or n8n Cloud)
- An Exa API key (from [dashboard.exa.ai](https://dashboard.exa.ai))
- At least one destination tool connected to n8n — a CRM (HubSpot, Pipedrive…), a Slack workspace, or a Notion database

---

## Step 1 — Store your Exa API key in n8n

Never paste your API key directly into a workflow node. n8n has a built-in Credentials Manager that encrypts secrets at rest and lets you reuse them across all workflows.

1. In your n8n instance, go to **Settings → Credentials**
2. Click **Add Credential**
3. Search for **Header Auth**
4. Fill in:
   - **Name:** `Exa API Key`
   - **Name (header):** `x-api-key`
   - **Value:** your Exa API key
5. Click **Save**

You'll select this credential in every HTTP Request node that calls Exa. If your key ever changes, update it once here — all workflows update automatically.

---

## Understanding n8n basics

If you've never used n8n before, here are the four node types you'll encounter throughout this guide:

| Node | Role |
|------|------|
| **Schedule Trigger** | Starts a workflow automatically at a defined interval (daily, weekly, etc.) |
| **HTTP Request** | Calls an external API — this is where your Exa search query lives |
| **Code** | Transforms the raw JSON response into the shape your destination tool expects |
| **CRM / Slack / Notion / etc.** | Pushes the processed results to your tools |

A workflow is a chain of nodes. Data flows left to right — each node receives the output of the previous one. You don't need to write code to use n8n, but the **Code** node (JavaScript) is useful for shaping data between Exa and your destination.

---

## Workflow 1 — Weekly Competitor Monitor → Notion

**What it does:** Every Monday morning, searches for service providers (agencies, SaaS platforms, freelancers) targeting your same micro-business segment, and saves a structured report to a Notion database.

**When to use it:** Ongoing competitive intelligence — you open Notion on Monday and have a fresh view of what competitors are doing, without any manual research.

### Build it

**Step 1 — Add a Schedule Trigger node**

1. Create a new workflow in n8n
2. Add a **Schedule Trigger** node
3. Set it to **Every Week**, on **Monday** at **08:00**

**Step 2 — Add an HTTP Request node**

1. Add an **HTTP Request** node after the trigger
2. Configure it:
   - **Method:** POST
   - **URL:** `https://api.exa.ai/search`
   - **Authentication:** select **Header Auth** → choose your `Exa API Key` credential
   - **Body Content Type:** JSON
   - **Body:** adapt the query to your market and service type

```json
{
  "query": "web agencies specializing in websites for small businesses tradespeople artisans [your region]",
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

Exa returns structured results inside `output.content.competitors`. This node extracts and flattens them into individual items:

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
4. **Database:** select your competitors database

Create the database in Notion first with these columns: Name (title), URL (URL), Positioning (text), Target Market (text), Price Range (text), Retrieved At (date).

5. Map each field from the Code node output to the corresponding Notion property

**Step 5 — Test and activate**

Click **Test Workflow** to run it once manually and verify data appears in Notion. Then toggle **Active** to enable the weekly schedule.

---

## Workflow 2 — Weekly Trend Digest → Slack

**What it does:** Every Friday afternoon, searches for news affecting micro-businesses and their service providers, then posts a digest to a Slack channel.

**When to use it:** Staying informed on regulatory changes, digital adoption statistics, competitor funding rounds — automatically, without manual searching.

### Build it

**Step 1 — Schedule Trigger**

- **Every Week**, on **Friday** at **17:00**

**Step 2 — HTTP Request node**

Adapt the query to your country and service type:

```json
{
  "query": "digital adoption micro-business artisans tradespeople local shops trends regulations [your country] 2026",
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

const date = new Date().toLocaleDateString('en-GB');
const message = `*📊 Market Watch — ${date}*\n\n` + lines.join('\n\n');

return [{ json: { message } }];
```

**Step 4 — Slack node**

1. Add a **Slack** node
2. Connect your Slack workspace
3. **Operation:** Send Message
4. **Channel:** your market watch channel (e.g. `#market-watch`)
5. **Message:** `{{ $json.message }}`
6. Enable **Markdown** formatting

---

## Workflow 3 — Prospect Discovery → CRM

**What it does:** On demand or weekly, searches for artisans and local businesses in a target area, then creates contacts in your CRM for follow-up.

**When to use it:** Before a prospecting campaign — you get a fresh batch of leads directly in your pipeline.

### Build it

**Step 1 — Trigger**

Use a **Manual Trigger** for on-demand runs, or a **Schedule Trigger** for weekly batches.

**Step 2 — HTTP Request node**

```json
{
  "query": "plumbers electricians carpenters painters [your city/region] local business website",
  "type": "auto",
  "numResults": 50,
  "contents": {
    "highlights": true
  }
}
```

> **Important:** No `category` filter here. Individual artisans and sole traders rarely appear in the company index. Omitting `category` and using `type: "auto"` returns directory listings, local business sites, and trade listings where these prospects actually appear.

**Step 3 — Code node to extract and shape**

```javascript
const results = $input.first().json.results ?? [];

return results
  .filter(r => r.url && r.title)
  .map(r => ({
    json: {
      name: r.title,
      website: r.url,
      excerpt: r.highlights?.[0] ?? '',
      lead_source: 'Exa Prospection',
      created_at: new Date().toISOString()
    }
  }));
```

**Step 4 — CRM node (HubSpot example)**

1. Add a **HubSpot** node (or your CRM's node)
2. **Operation:** Create Contact or Create Company
3. Map:
   - **Company Name** → `name`
   - **Website** → `website`
   - **Description** → `excerpt`
   - **Lead Source** → `lead_source`

**Tip:** Add an **IF** node before your CRM node to filter out noise — skip results where `excerpt` is empty, or where `url` contains social media domains (`facebook.com`, `instagram.com`) or directory domains (`yelp.com`).

---

## Workflow 4 — Competitor Enrichment on Demand

**What it does:** Given a list of competitor URLs, fetches structured content from each page and saves enriched profiles to Notion.

**When to use it:** When you discover a new competitor and want a quick profile without spending time on manual research.

### Build it

**Step 1 — Manual Trigger**

**Step 2 — Code node to define URLs**

```javascript
// Replace with the URLs you want to enrich
const urls = [
  "https://www.competitor-one.com",
  "https://www.competitor-two.com"
];

return urls.map(url => ({ json: { url } }));
```

**Step 3 — HTTP Request node (Contents API)**

This calls the Exa **Contents** endpoint (not Search):

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

Save to your competitors database. If the URL already exists as a page, update it; otherwise create a new one.

---

## Tips and common mistakes

**Exa response structure — the most common source of empty outputs**

- With `outputSchema`: your data is in `body.output.content`
- With `contents.highlights` (no schema): your data is in `body.results`

Always check which one applies to your workflow before writing the Code node.

**Testing without burning API credits**

When building and testing a new workflow, use `type: "fast"` and `numResults: 3`. Only switch to `type: "deep"` and higher result counts once the flow is validated end to end.

**Avoiding CRM duplicates**

n8n doesn't deduplicate by default. If you run the prospect workflow repeatedly, you'll create duplicate records. Add a **Search** node before your CRM node to check if the website URL already exists, and use an **IF** node to skip creation if it does.

**`category: "company"` breaks certain filters**

If you use `category: "company"`, you cannot use `excludeDomains`, `startPublishedDate`, or `endPublishedDate` — the API returns a 400 error. Remove those filters or drop the category.

**Rate limits**

Exa doesn't publish hard rate limits, but for automated workflows running loops over many URLs: add a **Wait** node (2–3 seconds) between calls to stay safe.
