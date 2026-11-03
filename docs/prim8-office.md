# PRIM8 Productions office (Skydive clone)

This repository’s default AgentsOffice roster mirrors Jacob’s shared Skydive office:

**Source:** https://www.skydive.com/o/eJJbcZSS5f5Gi3KrCi1u_g

## Brand

| Field | Value |
|-------|-------|
| Name | PRIM8 Productions |
| Primary | `#0B0C0E` |
| Secondary | `#F4F3EF` |
| Accent | `#C99B54` |
| Org id (logo path) | `01a19fa1-e1e9-7cf4-9e34-ea630b5c037f` |

Skydive interior theme: music / audio production studio (vocal booth, mixing console, gold records, etc.). AgentsOffice keeps its Phaser pixel office map; brand + agent roster are the portable clone surface.

## Agents

Seed JSON: [`office/prim8/agents.json`](../office/prim8/agents.json)  
Runtime builtins: [`app/services/agents/definitions.py`](../app/services/agents/definitions.py)

| Slug | Name | Skydive key | Role (reconstructed) |
|------|------|-------------|----------------------|
| jarvis | Jarvis | `htpkcE2QxtLvKLGr` | Office lead & coordinator |
| aria | ARIA | `6xrZYE9ftwk_Ech8` | A&R / creative repertoire |
| simone | SIMONE | `ntTz4BSeF99z5fO1` | Creative direction & artist development |
| spike | SPIKE | `vb5E_z_Jtl3BXJKw` | Session producer & project momentum |
| dre | DRE | `DsXigmtVdNH3gz0P` | Music / audio producer |
| shakir | SHAKIR | `AkG94XdD2l45INO3` | Performance & release operations |
| echo | Echo | `TxqDpLuTSAj9daFX` | Mix / sound & signal chain |
| data_engineer | Data Engineer | — | AgentsOffice file/SQL tooling (retained) |

Names, keys, and avatars come from Skydive `GET /api/v2/public/offices?token=…`.  
**Roles and system prompts were not exportable** from the public share API. An authenticated browser session could fully profile a separate personal `/office` (Jarvis, Office Designer, Windy, Koa) but not PRIM8 member agent settings without workspace membership.

## Gaps vs Skydive

- No 3D GLB avatars / Skydive interior mesh in Phaser
- No Skydive-native routines engine, hosted apps, or OAuth integrations
- No verified original system prompts, connected apps, or docs from the PRIM8 org
