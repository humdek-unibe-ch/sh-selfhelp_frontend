<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# SelfHelp Frontend Documentation

Audience: Frontend developers, technical operators, CMS administrators, and AI coding agents.
Status: active.
Applies to: SelfHelp2 Next.js frontend.
Last verified: 2026-06-03.
Source of truth: Frontend source code, `AGENTS.md`, the current SSR/BFF architecture docs, and shared/backend contracts.

Navigation entrypoint for the frontend documentation, organized by audience and purpose per the Documentation Rules in `AGENTS.md`.

## Start here

| Need | Read |
| --- | --- |
| Current SSR/BFF architecture | [developer/ssr-bff-architecture.md](developer/ssr-bff-architecture.md) |
| Frontend development overview | [developer/developer-guide.md](developer/developer-guide.md) |
| Modular frontend guides | [developer/guides/index.md](developer/guides/index.md) |
| API endpoint reference | [reference/api-endpoints.md](reference/api-endpoints.md) |
| Troubleshooting | [reference/troubleshooting.md](reference/troubleshooting.md) |

## Documentation map

| Folder | Use for |
| --- | --- |
| [developer/](developer/index.md) | Architecture, renderer/BFF/auth/cache patterns, styling, performance, and the numbered developer guides. |
| [reference/](reference/index.md) | API endpoints, component patterns, configuration keys, SSR helpers, the permission quick reference, and AI prompt material. |
| [user/](user/index.md) | Non-technical CMS/admin orientation for operator-facing tasks. |
| [archive/](archive/index.md) | Historical architecture, implementation summaries, compatibility fixes, and superseded recommendations. |

## Conventions

- Every active doc starts with the metadata block (`Audience`, `Status`, `Applies to`, `Last verified`, `Source of truth`).
- Filenames use lowercase kebab-case; this file (`README.md`) is the only uppercase docs entrypoint, and subfolder indexes are `index.md`.
- Frontend source code, shared types, and backend contracts are the source of truth. When a doc conflicts with the code, the code wins and the doc is corrected or archived.
