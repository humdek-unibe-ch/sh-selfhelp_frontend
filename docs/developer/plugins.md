/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# Plugin system (web)

Audience: Developers writing or reviewing the web part of a SelfHelp plugin.
Status: active.
Applies to: SelfHelp2 frontend >= 0.1.79, `@selfhelp/shared` plugin SDK `PLUGIN_API_VERSION` 0.2.0.
Last verified: 2026-11-26.
Source of truth: `src/app/components/frontend/plugin-runtime/PluginRuntime.ts`, `@selfhelp/shared/plugin-sdk`, backend `docs/plugins/`.

The host loads each enabled plugin's ESM file from `/plugin-artifacts/<id>-<version>/` (URL from `GET /cms-api/v1/plugins/manifest`), then calls the package's exported `register(api)`. Plugins are not loaded as webpack remotes or `remoteEntry.js` bundles.

## How a plugin registers

```ts
import { definePlugin } from '@selfhelp/shared/plugin-sdk';

export const register = definePlugin({
  pluginApiVersion: '0.2.0',
  styles: { 'survey-js': SurveyJsStyle },
  adminPages: { surveys: SurveysAdminPage },
  sync: [
    { tags: ['res:surveyjs_survey:*'], queryKey: ['surveyjs', 'survey'] },
    { tags: ['acl'], queryKey: ['surveyjs', 'admin'] },
  ],
});
```

`PluginRuntime` imports the ESM, checks `pluginApiVersion` against the host SDK (`PLUGIN_API_VERSION`), records mismatches in `versionWarnings`, and keeps each plugin's `sync` map for live invalidation.

## Host API the web plugin may use

From `IPluginApi` (see shared plugin-sdk):

| Member | Purpose |
| --- | --- |
| `request` / admin helpers | Call plugin and core endpoints through the BFF |
| `resources.usage(type, id)` | Where-used list (`GET /admin/resources/{type}/{id}/usage`) |
| `ui.ResourceUsageList` | Shared React list (pages, actions, hidden count, delete warning) |
| `settings.get()` | This plugin's non-secret settings (`has_value` for secrets) |
| `sectionAnchor(sectionId)` | CSS selector `.section-<id>` for guided tours |
| `sanitizeHtml` | DOMPurify rules used by core pages |

Do not import host internals. Do not bundle React, Mantine, React Query or `@selfhelp/shared` — they come from the host.

## Live sync

On a Mercure `changed` notice the host maps tags to React Query keys:

- core tags (`page:`, `table:`, `acl`, …) as before;
- plugin `sync` entries via `matchPluginSyncEntries`;
- `res:<type>:<id>` also invalidates pages whose `depends_on` lists that tag.

When content refreshes under a plugin style: **keep typed answers that still apply** and show a short "content was updated" notice (never wipe the form).

## Admin screens

- Plugins menu and detail: gated by `admin.plugins.execute` / `admin.plugins.manage` / purge rights (F238).
- Settings form: host stores values (C14); secrets show a hint only.
- Action builder: plugin job types from `GET /admin/actions/plugin-job-types` with a generated config form.
- Condition builder: plugin JSON Logic operations from the public plugin manifest.
- Roles: plugin resource types use the same grant matrix; rows without `can_assign` are disabled.

## Backend contracts

Full recipes (C2–C26): backend `docs/plugins/host-hooks.md`. Manifest schema: `docs/plugins/plugin-manifest.schema.json` in the backend repository.
