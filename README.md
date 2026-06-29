# Everest Digital — Agent Skills

A collection of agent skills for [Claude Code](https://claude.ai/code) and any [Agent Skills](https://agentskills.io)-compatible tool.

## Skills

| Skill | Description | Audience |
|---|---|---|
| [`everest-digital-market-research`](./everest-digital-market-research/) | Deep market research via Exa API — scoped to the French micro-business market (TPE, artisans, commerçants) | Everest Paris team |
| [`everest-digital-market-research-general`](./everest-digital-market-research-general/) | Deep market research via Exa API — for agencies and service providers targeting micro-businesses | Public |

## Install

```bash
npx skills add everestdigital/exa-market-research
```

Or clone and use directly:

```bash
git clone https://github.com/everestdigital/skills.git
```

Each skill directory is self-contained with its own `SKILL.md`, scripts, and documentation.

## Requirements

- [Claude Code](https://claude.ai/code)
- An [Exa API key](https://dashboard.exa.ai)
- Node.js ≥ 18

## License

- `everest-digital-market-research` — internal use only, Everest Digital
- `everest-digital-market-research-general` — Apache-2.0
