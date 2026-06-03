<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->

# SelfHelp Frontend Documentation

Audience: frontend developers, technical operators, CMS administrators, and AI coding agents.
Status: active documentation index.
Applies to: SelfHelp2 Next.js frontend docs in this repository.
Last verified: 2026-06-03.
Source of truth: frontend source code, `AGENTS.md`, current SSR/BFF architecture docs, and shared/backend contracts.

Use this page as the navigation entrypoint for frontend documentation. The current docs are partly organized by previous implementation phases; new or substantially rewritten docs should follow the audience-based placement rules in `AGENTS.md`.

## Start Here

| Need | Read |
| --- | --- |
| Current SSR/BFF architecture | [architecture/ssr-bff-architecture.md](architecture/ssr-bff-architecture.md) |
| Frontend development overview | [developer-guide.md](developer-guide.md) |
| Modular frontend guides | [guides/01-architecture-overview.md](guides/01-architecture-overview.md) |
| API endpoint reference | [reference/api-endpoints.md](reference/api-endpoints.md) |
| Troubleshooting | [reference/troubleshooting.md](reference/troubleshooting.md) |

## Current Documentation Map

| Current location | Purpose | Future placement rule |
| --- | --- | --- |
| `docs/architecture/` | Current and supporting architecture references. | Keep as developer architecture docs unless a broader `docs/developer/` migration is scheduled. |
| `docs/guides/` | Developer guides for core frontend systems. | Keep as developer docs or gradually fold into `docs/developer/`. |
| `docs/reference/` | API, component, configuration, SSR helper, and troubleshooting references. | Keep as `docs/reference/`. |
| `docs/compatibility/` | Historical compatibility and migration summaries. | Move stable historical notes to `docs/archive/` after links are updated. |
| Top-level `docs/*.md` | Mixed developer notes, operations notes, troubleshooting, and implementation summaries. | Re-home gradually into `developer`, `user`, `reference`, `operations`, or `archive`. |
| `docs/AI Prompts/` | AI prompt/reference material. | Rename or re-home later using lowercase kebab-case if links are updated. |

## New Documentation Placement

| Folder | Use for |
| --- | --- |
| `docs/developer/` | Architecture, renderer behavior, BFF/auth/cache patterns, testing, and engineering workflow. |
| `docs/user/` | Non-technical CMS/admin feature usage, expected UI behavior, and operator-facing tasks. |
| `docs/reference/` | API endpoints, helper catalogs, configuration keys, route contracts, and component patterns. |
| `docs/cookbook/` | Step-by-step recipes for adding styles, admin pages, BFF routes, tests, or shared-contract changes. |
| `docs/operations/` | Local setup, Playwright environment setup, build/deploy notes, monitoring, and recovery runbooks. |
| `docs/archive/` | Historical implementation summaries, completed compatibility fixes, and superseded recommendations. |

When moving existing docs, update all repository-relative links in the same change and prefer small batches over broad rewrites.
