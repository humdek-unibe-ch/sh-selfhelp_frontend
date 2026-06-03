# SelfHelp CMS - Admin User Guide

Audience: Non-technical CMS administrators and content operators.
Status: active.
Applies to: SelfHelp2 Next.js frontend (admin UI).
Last verified: 2026-06-03.
Source of truth: Observable admin UI behavior of the current build.

This is a non-technical orientation for people who manage content and users in the SelfHelp admin UI. It describes what the admin UI lets you do; for implementation details, see the [developer docs](../developer/index.md).

## What you can do in the admin UI

- Create and edit CMS pages and the sections inside them.
- Save changes as a draft and publish a version when it is ready; earlier published versions can be restored.
- Manage languages and translate page content.
- Manage users, groups, roles, and access permissions.
- Inspect a page and its sections with the admin inspector panel.

## How publishing works

Editing a page changes its current draft. Visitors keep seeing the last published version until you publish again. Publishing creates a new version you can later compare against or restore, so it is safe to iterate on a draft before making it live.

## Permissions at a glance

Access to admin features is controlled by your group and role. If an action or page is not visible to you, your account most likely lacks the required permission - ask an administrator to review your group/role assignment. The permission model is documented for administrators in [../reference/permission-quick-reference.md](../reference/permission-quick-reference.md).
