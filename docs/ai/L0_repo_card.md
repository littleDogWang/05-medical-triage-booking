# Clinic Reception & Appointments — Repo Card

> Handle clinic questions and a complete simulated appointment conversation.

## Identity

| Field | Value |
| --- | --- |
| Repo | `littleDogWang/08-medical-triage-booking` |
| Type | `frontend-app` |
| Language | TypeScript, Next.js 16 App Router, React 19 |
| Deploy Target | Single Node.js process or Docker; see architecture for state/persistence limits |
| Owner | littleDogWang; upstream Agora Community attribution retained |
| Last Reviewed | 2026-10-26 |
| Recipe Role | base (standalone scenario derived from the official voice quickstart) |
| Recipe Version | 0.2.0 |
| Recipe Status | draft |

## L1 — Summaries

| File | Purpose | Audience |
| --- | --- | --- |
| [01_setup](L1/01_setup.md) | Environment, commands, Docker and verification safety | Use & Maintain |
| [02_architecture](L1/02_architecture.md) | Topology, state and media/event flow | Maintain |
| [03_code_map](L1/03_code_map.md) | Source paths and responsibilities | Maintain |
| [04_conventions](L1/04_conventions.md) | Lifecycle, testing and documentation rules | Maintain |
| [05_workflows](L1/05_workflows.md) | First success, changes, deployment and diagnosis | Use & Maintain |
| [06_interfaces](L1/06_interfaces.md) | API, event and environment contracts | Use & Maintain |
| [07_gotchas](L1/07_gotchas.md) | High-impact setup/runtime pitfalls | Maintain |
| [08_security](L1/08_security.md) | Credentials, scope and trust boundaries | Maintain |

The [public recipe](../../RECIPE.md) is the user guide. The [internal recipe](RECIPE.md) owns integration contracts. Draft indicates that public catalog publication and full runtime acceptance must be recorded separately from local checks.
