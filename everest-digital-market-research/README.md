# exa-market-research

Skill Claude Code pour effectuer des études de marché approfondies via l'API [Exa](https://exa.ai).

Développé pour [Everest Digital](https://everestdigital.fr) — usage interne équipe.

## Ce que ce skill permet

- **Profiling concurrents** — trouver et analyser des agences web françaises sur le segment TPE/artisans
- **Recherche de prospects** — identifier des artisans et TPE à cibler
- **Veille marché** — suivre les tendances du marché des agences web en France
- **Enrichissement de données** — extraire des informations structurées sur des entreprises ou personnes

## Prérequis

1. [Créer un compte Exa](https://dashboard.exa.ai) et générer une clé API
2. Node.js ≥ 18
3. Claude Code installé

## Installation

```bash
git clone https://github.com/everestdigital/exa-market-research.git
cd exa-market-research
npm install
cp .env.example .env
# Éditer .env et ajouter votre EXA_API_KEY
```

## Utilisation avec Claude Code

```bash
cd exa-market-research
ccs  # ou cco pour Opus
```

Claude Code lira automatiquement `SKILL.md` et saura comment utiliser l'API Exa pour vos recherches.

Exemples de requêtes à donner à Claude Code :
- *"Profile les 20 principales agences web françaises spécialisées TPE"*
- *"Trouve des artisans plombiers en Île-de-France qui pourraient avoir besoin d'un site"*
- *"Quelles sont les tendances du marché des agences web en France cette semaine ?"*
- *"Enrichis ces URLs avec les informations clés sur chaque agence : [liste]"*

## Scripts d'exemple

Voir le dossier [`scripts/`](./scripts/) pour des exemples prêts à l'emploi.

## Automatisation n8n

Voir [`N8N.md`](./N8N.md) pour les workflows prêts à l'emploi.

Quatre workflows couverts :

| Workflow | Déclencheur | Destination |
|---|---|---|
| Veille concurrents | Chaque lundi 08h00 | Notion |
| Digest tendances marché | Chaque vendredi 17h00 | Slack `#veille-marché` |
| Découverte prospects TPE/artisans | Manuel ou hebdo | HubSpot |
| Enrichissement concurrents | Manuel (liste d'URLs) | Notion |

Prérequis n8n : instance self-hosted sur votre VPS Oracle Cloud, credential `Exa API Key` configurée dans **Settings → Credentials** (Header Auth, `x-api-key`).

## Licence

Usage interne — Everest Digital. Ne pas redistribuer.
