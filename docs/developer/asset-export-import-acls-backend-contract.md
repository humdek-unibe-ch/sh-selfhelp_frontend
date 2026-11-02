# Asset Export/Import + Group Asset ACLs — Backend contract

Audience: developers on `sh-selfhelp-fe` / `sh-selfhelp-be`
Status: Export/import + group-scoped asset ACLs live. Closed-when-empty flip + backfill in progress on BE; FE aligned to the target behavior.
Applies to: `sh-selfhelp-be` Admin Asset + Admin Group modules + this frontend
Last verified: 2026-07-23
Source of truth: the backend controller + JSON schemas (this doc mirrors them)

> **ACL re-scope — done.** Asset-folder ACLs moved from the **Assets page
> (folder-centric)** to the **Groups page (group-centric)**, sitting alongside
> page ACLs in the group's "Advanced ACL Management" modal — matching where every
> other ACL is managed (per group, not per resource). The FE is rebuilt around
> the group-scoped endpoints, and the BE has them live (routes swapped in
> migration `Version20260722134223`); the old `/admin/assets/folder-acls` are
> retired. **Export/import was unaffected throughout.** Remaining open items are
> two confirmations, not build work (§5 write-permission choice, §6).

**Export/import (LIVE — no change):**

- Export is `POST /admin/assets/export` with body `{ folders?: string[] }`, returns a zip blob.
- Import response is `{ imported, skipped, errors[] }`.

**Asset ACLs (RE-SCOPED — BE change requested):**

- Managed **per group** on the Groups page, not per folder on the Assets page.
- New endpoints: `GET /admin/groups/{id}/asset-acls` + `PUT /admin/groups/{id}/asset-acls`.
- Replace the now-unused `GET/PUT /admin/assets/folder-acls`.

Export/import routes live under the admin asset controller
(`/cms-api/v1/admin/assets`); the asset-ACL routes live under the **admin group**
controller (`/cms-api/v1/admin/groups/{id}/asset-acls`), next to the existing
group page-ACL routes. Responses use the standard `ApiResponseFormatter`
envelope except the export blob.

---

## 1. Permissions

The only asset permissions are `admin.asset.read`, `admin.asset.create`, and
`admin.asset.delete`. The **group asset-ACL editor** (GET/PUT below) gates on
**`admin.group.acl`** — the same permission as the sibling page-ACL editor.

There is **no `admin.asset.manage` permission.** (An earlier draft created one
for a folder-scoped route that the group-scoped design replaced; it was removed.)
`manage` still exists only as an ACL **access_level** value (`read` | `manage`) —
which is unrelated to any permission name.

---

## 2. Export assets → zip bundle

```
POST /admin/assets/export
Permission: admin.asset.read
Content-Type: application/json
Body: { "folders"?: string[] }   // empty/omitted = all readable folders
```

- Response: `200 OK`, `Content-Type: application/zip`,
  `Content-Disposition: attachment; filename="asset_export.zip"`, body = the raw
  zip (NOT the JSON envelope — the FE requests it as a blob).
- Enforces folder read ACLs server-side (see §5).

**Zip layout:** `manifest.json` + `files/<folder>/<file_name>`.

**manifest.json shape:**

```json
{
  "bundle_type": "selfhelp/asset-bundle",
  "bundle_version": "1.0",
  "exported_at": "2026-07-22T10:00:00Z",
  "assets": [
    { "folder": "images", "file_name": "logo.png", "asset_type": "image", "bundle_path": "files/images/logo.png" }
  ]
}
```

Schema: `requests/admin/export_assets.json`.

---

## 3. Import asset bundle

```
POST /admin/assets/import
Permission: admin.asset.create
Content-Type: multipart/form-data
Body: file = the .zip bundle (required); overwrite = "true" | "false" (default false)
```

- Reads the same manifest. Per-file failures (bad path, missing file, validation,
  or lacking `manage` on a target folder) go into `errors[]`; **the request still
  succeeds.**

Response `data`:

```json
{ "imported": 2, "skipped": 1, "errors": [ { "file": "files/bad.svg", "error": "reason" } ] }
```

Schema: `responses/admin/assets/assets_import_envelope.json`. The FE surfaces
`imported` / `skipped` / `errors` to the user.

---

## 4. Group asset ACLs — read (per group) — **NEW, BE change requested**

```
GET /admin/groups/{groupId}/asset-acls
Permission: admin.group.acl   (the ACL editor read; NOT admin.group.read)
```

Envelope `data` — the folders this group may access:

```json
{ "acls": [ { "folder": "images", "access_level": "manage" }, { "folder": "docs", "access_level": "read" } ] }
```

`access_level` is `"read"` or `"manage"`. A group with an empty `acls` set has no
explicit asset-folder grants. There is **no** "list every folder" endpoint — the
FE derives the folder catalog from the asset list and shows a checkbox +
read/manage control per folder in the group's ACL modal.

Suggested schema: `responses/admin/groups/group_asset_acls_envelope.json`.

---

## 5. Group asset ACLs — update (full replace, per group) — **NEW, BE change requested**

```
PUT /admin/groups/{groupId}/asset-acls
Permission: admin.group.acl   (same as the sibling page-ACL write)
Content-Type: application/json
Body: { "acls": [ { "folder": "images", "access_level": "read" | "manage" } ] }
```

- Full replacement of **this group's** asset-folder grants. Empty `acls` clears
  all of the group's asset-folder access.
- Response `data` = the group's updated grants (same shape as §4).
- **Permission resolved:** the write is gated on **`admin.group.acl`** (consistent
  with the page-ACL write). The FE gates the ACL editor on it accordingly.

Suggested schema: `requests/admin/update_group_asset_acls.json`.

### BE status (confirmed from source, 2026-07-23)

The BE group-scoped endpoints **exist and enforce as below** — verified against
`src/Service/CMS/Admin/AssetFolderAclService.php`:

1. **Routes** `GET`/`PUT /admin/groups/{id}/asset-acls` are live on the admin
   group controller (migration `Version20260722134223` swapped the `api_routes`
   rows from the retired `/admin/assets/folder-acls`).
2. **Storage** is `assets_folders_groups` (folder × `id_groups` × `access_level`),
   created in `Version20260722092220` — **unchanged, no new table migration** for
   the re-scope.
3. The old `GET/PUT /admin/assets/folder-acls` are **retired**.
4. Enforcement is resource-side (the FE gate is UX only).
5. **In progress (BE):** the closed-when-empty flip + backfill (see the semantics
   below). Until it lands, an empty folder is still open to everyone on the server;
   the FE copy already states the target (admin-only) behavior.

### ACL semantics (enforced server-side; the FE gate is UX only)

- **read** — a member of a granting group may view/list/download/export the
  folder's assets.
- **manage** — read + create/delete/import within the folder.
- **Access is the union across the caller's groups** — `manage` if any of the
  caller's groups grants manage, else `read` if any grants read, else denied
  (`AssetFolderAclService::userAccessLevel`).
- **Admins always keep manage.** A user with the **admin role bypasses folder
  ACLs entirely** (manage on every folder, granted or not — confirmed by BE). So
  restricting a folder can never lock an admin out.
- **Closed-when-empty (updated model, 2026-07-23).** A folder with **no group
  grants is restricted to admins** — non-admins have no access to it. This is a
  deliberate flip from the earlier "empty = open to everyone" behavior: access is
  now opt-in per group. To let a non-admin group use a folder, grant it here. (BE
  also runs a one-off **backfill** seeding the default grants — admin=manage,
  subject/therapist=read — onto folders that predate the model, so existing
  folders like `goalkeeper`/`general` don't silently vanish for non-admins.)
- Enforcement is second-layer: `GET /admin/assets` silently drops folders the
  caller can't read (`getDeniedFolders`); a denied folder hit directly → `403`;
  get-by-id / create / delete / import into a denied folder → `403`.

---

## 6. Cross-repo checklist

Backend done (confirmed from source 2026-07-23): asset permissions
(`admin.asset.read`/`create`/`delete`; ACL editor on `admin.group.acl`),
export/import endpoints + schemas (`export_assets`, `assets_import_envelope`),
`assets_folders_groups` storage (`Version20260722092220`), the group-scoped
`GET`/`PUT /admin/groups/{id}/asset-acls` routes (`Version20260722134223`),
retirement of `/admin/assets/folder-acls`, union enforcement + admin bypass, and
round-trip + negative-permission tests.

Backend **in progress**:

- [ ] **Closed-when-empty flip + backfill** — empty folder → admin-only; backfill
      default grants (admin=manage, subject/therapist=read) onto pre-existing
      folders. FE copy already states this target behavior.

Resolved:

- [x] **§5 write permission** = `admin.group.acl` (FE gate updated to match).
- [x] Admin-bypass keyed on the **admin role** (FE copy states it).
- [ ] Update `docs/reference/api/06-admin-assets.md` + the group-ACL reference if
      not already covering the group-scoped routes + closed-when-empty.

Both repos (coordinated tagging wave):

- [ ] **Version pinning:** FE `release-manifest.json` `supports.core` → first
      backend version shipping the group-scoped ACL endpoints; backend
      `supports.frontend` → this FE version; matrix "Current floor" note.
- [ ] Changelog entries in both repos.

## 7. Frontend touch-points (group-scoped ACLs)

- `src/config/api.config.ts` — export/import: `ADMIN_ASSETS_EXPORT`,
  `ADMIN_ASSETS_IMPORT`; ACLs: `ADMIN_GROUPS_ASSET_ACLS_GET`,
  `ADMIN_GROUPS_ASSET_ACLS_UPDATE`.
- `src/api/admin/asset.api.ts` — `exportAssets`, `importAssets` (ACL methods removed).
- `src/api/admin/group.api.ts` — `getGroupAssetAcls`, `updateGroupAssetAcls`.
- `src/hooks/useAssets.ts` — `useExportAssets`, `useImportAssets`.
- `src/hooks/useGroups.ts` — `useGroupAssetAcls`, `useUpdateGroupAssetAcls`.
- `src/app/components/cms/assets/export-import-assets-modal/` — Assets-page export/import UI.
- `src/app/components/cms/groups/advanced-acl-modal/GroupAssetAclManagement.tsx` —
  the "Asset Folders" tab inside the group's Advanced ACL modal.
- **Permission-gated UI + real 403 messages (2026-07-24):** the Upload button +
  Import tab are gated on `admin.asset.create`, the row Delete action on
  `admin.asset.delete`, and the group "Manage ACLs" launcher on `admin.group.acl`;
  upload/import/export/delete errors route through `parseApiError`, so a backend
  403 shows its real `error` text ("You do not have permission…") instead of a
  generic "Failed to…". Asset action icons also gained `aria-label`s.
- `src/types/{responses,requests}/admin/groups.types.ts` — group asset-ACL types.
- Asset-ACL editor gates on `ADMIN_GROUP_ACL` (`admin.group.acl`); the only asset
  permissions are `ADMIN_ASSET_READ`/`CREATE`/`DELETE`.
