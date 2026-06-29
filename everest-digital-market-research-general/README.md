# exa-market-research

[![skills.sh](https://skills.sh/b/everestdigital/exa-market-research)](https://skills.sh/everestdigital/exa-market-research)

A Claude Code skill for deep market research using the [Exa API](https://exa.ai).

**Designed for:** agencies and service providers whose target market is **micro-businesses** — sole traders, artisans, tradespeople (plumbers, electricians, carpenters…), local retailers (bakeries, restaurants, boutiques…), and very small businesses under 5 employees.

## What this skill covers

- **Competitor profiling** — find and analyze agencies, SaaS platforms, or freelancers targeting the same micro-business segment
- **Prospect discovery** — identify artisans and local businesses to target
- **Market trend monitoring** — track regulatory changes, digital adoption trends, and competitor news
- **Data enrichment** — extract structured facts from a list of URLs

## Prerequisites

1. [Create an Exa account](https://dashboard.exa.ai) and generate an API key
2. Node.js ≥ 18
3. Claude Code installed

## Install this skill

```bash
npx skills add everestdigital/exa-market-research
```

Or clone manually:

```bash
git clone https://github.com/everestdigital/exa-market-research.git
cd exa-market-research
npm install
cp .env.example .env
# Add your EXA_API_KEY to .env
```

## Usage with Claude Code

```bash
cd exa-market-research
ccs
```

Claude Code reads `SKILL.md` automatically and knows how to use the Exa API for your research. Example prompts:

- *"Profile the top 20 web agencies in [your region] targeting small businesses and tradespeople"*
- *"Find electricians and plumbers in [your city] that could need a website"*
- *"What are the latest trends affecting micro-business digital adoption this week?"*
- *"Enrich these competitor URLs with key positioning info: [list]"*

## Example scripts

See [`scripts/`](./scripts/) for ready-to-run examples for each use case.

## n8n automation

See [`N8N.md`](./N8N.md) for ready-to-use workflows.

Four workflows included:

| Workflow | Trigger | Destination |
|---|---|---|
| Weekly competitor monitor | Every Monday 08:00 | Notion |
| Weekly trend digest | Every Friday 17:00 | Slack |
| Prospect discovery | Manual or weekly | Any CRM (HubSpot example) |
| Competitor enrichment | Manual (URL list) | Notion |

**Setup:** store your Exa API key once in n8n under **Settings → Credentials** as a Header Auth credential (`x-api-key`). All four workflows reference it — update in one place and everything stays in sync.

## License

Apache-2.0
