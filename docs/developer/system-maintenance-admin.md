/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# System Maintenance admin screen

Audience: Frontend developers and technical operators.
Status: active.
Applies to: SelfHelp2 Next.js frontend.
Last verified: 2026-06-09.
Source of truth: `src/app/admin/system/page.tsx`, `src/app/components/cms/system/system-maintenance-page/SystemMaintenancePage.tsx`, `src/hooks/useSystem.ts`, `src/types/responses/admin/system.types.ts`, `src/app/components/cms/system/system-maintenance-page/__tests__/SystemMaintenancePage.test.tsx`.

The **System Maintenance** screen (`/admin/system`) is the admin UI over the
backend's instance-scoped system layer. It shows this instance's version and
health, runs an update **compatibility preflight**, and lets an authorised admin
**request** a connected, signed update. The SelfHelp Manager (`sh-manager`), not
the CMS, performs the Docker work; the CMS only records the request for **this**
instance.

## Where it lives

- Route + guard: `src/app/admin/system/page.tsx` is a Server Component that calls
  `requireAdminPermission(PERMISSIONS.ADMIN_SYSTEM_READ)` and renders the screen
  inside `AdminShell`.
- UI: `SystemMaintenancePage` (Client Component), built with Mantine.
- Data: the `useSystem` hooks wrap the BFF/React Query calls —
  `useSystemVersion`, `useSystemHealth`, `useUpdatePreflight`, `useUpdateStatus`,
  `useRequestUpdateMutation`, `useSystemMaintenance`, `useSetMaintenanceMutation`.
- Types: `src/types/responses/admin/system.types.ts`.

## What the screen shows

- **Current instance** — SelfHelp / backend / frontend / plugin-API / DB-migration
  versions and the server-derived `instance_id`, plus Maintenance / Safe-mode
  badges.
- **Installed plugins** — each plugin's version and whether it is compatible with
  the running core.
- **System health** — aggregated component status (`healthy` / `degraded` /
  `down`), polled every ~15 s.
- **Maintenance mode** — current state, with enable/disable (requires
  `admin.system.maintenance`). An env-forced state
  (`SELFHELP_MAINTENANCE_MODE`) is shown read-only. Safe mode is shown read-only
  too (toggled by the operator via env / CLI, never the CMS).
- **Backups & support** — guidance with the exact `sh-manager` commands to run on
  the server (`instance backup`, `instance support-bundle`); the CMS never runs
  these itself.
- **Update operation** — when an operation is active, its status, progress bar,
  message, and per-step list, polled every ~4 s until a terminal state.
- **Request an update** — enter a target version, run **Check compatibility**
  (preflight), then request the update.

## Hard rules enforced in the UI

These mirror the backend guarantees (see the backend doc
`docs/developer/25-instance-scoped-system-layer.md`):

- The browser **never sends an `instance_id`** — the backend derives it. The
  request payload only carries `target_version`, `preflight_id`,
  `accepted_migration_risk`, and an optional `typed_confirmation`.
- A **blocked** preflight disables the request button.
- A **destructive DB migration** requires both the accepted-risk checkbox and the
  typed target version before the request button enables.
- The request button is hidden unless the admin holds `admin.system.update`
  (`permissionChecker.canUpdateSystem()`); maintenance controls require
  `admin.system.maintenance` (`canManageMaintenance()`); the page itself requires
  `admin.system.read`.

## Operator view (how to use it)

1. Open **Admin → System** (you need `admin.system.read`).
2. Review the version, plugin compatibility, and health.
3. Enter the target version and click **Check compatibility**. Read the preflight:
   `ok` (safe), `warning` (proceed carefully), or `blocked` (fix the listed
   errors first). Blocking security advisories appear as `error` checks.
4. If the preflight reports a destructive migration, take a backup on the server
   first (`sh-manager instance backup <instance-id>`), then accept the risk and
   type the target version to confirm.
5. Click **Request update for this instance** (needs `admin.system.update`). Watch
   the **Update operation** card as the SelfHelp Manager runs and reports each
   step.

## Test the update from the CMS (safe rehearsal)

You can exercise this whole CMS-driven path end to end without touching the public
registry or any production key, against a disposable instance on the **`test`**
release channel:

1. On the server, build the test images and serve a dev-signed test registry, then
   install a disposable instance — the copy-paste steps are in the manager runbook
   `sh-manager/docs/operator/rehearsal-publish-install-update.md` (steps 1–6).
2. In this admin screen, open **Admin → System**, enter the next test version
   (e.g. `8.0.1`), click **Check compatibility**, then **Request update for this
   instance**. This records an **instance-scoped** request; nothing touches Docker
   yet.
3. On the server, let the manager claim and execute it:

   ```bash
   sh-manager instance process-operations <instance-id> \
     --backend-url http://127.0.0.1:<port> --token "$SELFHELP_MANAGER_TOKEN"
   ```

4. Watch the **Update operation** card poll to `succeeded`. The backend derives the
   instance id server-side, so a browser-supplied id is ignored/rejected.

The same journey is automated as the manager Docker e2e
(`SHM_E2E=1 npm run e2e`). The UI behaviour above (advisory card, preflight gating,
the no-`instance_id` request payload, the permission gate) is regression-tested in
`SystemMaintenancePage.test.tsx`. The full scenario → test map lives in the
manager's `docs/distribution-architecture-audit-and-coverage.md`.

## Extending it

- Add a new datum to a card: extend the matching response type in
  `system.types.ts`, the backend response schema under
  `config/schemas/api/v1/responses/admin/`, and render it. Response-field changes
  are a cross-repo contract — keep the schema and the TS type in sync.
- Add a new hook: follow the existing `useSystem` patterns (queries for reads,
  mutations for writes) so polling/invalidations stay consistent.
