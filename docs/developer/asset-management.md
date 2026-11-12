# Asset management (admin)

Audience: frontend developers.
Status: active.
Applies to: frontend 0.1.70 with core 0.1.43 and later.
Last verified: 2026-11-04.
Source of truth: `src/api/admin/asset.api.ts`, `src/hooks/useAssets.ts`, `src/app/components/cms/assets/`, and the backend contract in `sh-selfhelp_backend/docs/reference/api/06-admin-assets.md`.

## Model

- **An asset is identified by its `uuid`, which is also its stored file
  name** (no extension; there is no `file_name`). `name` is an editable label
  without extension. Lists show `assetLabel()` (`name`, else the uuid); pickers
  (navigation logo, action attachments) show `assetFileLabel()` =
  `name.<extension of the MIME type>`. Uploads never overwrite each other.
- **Edit can replace the file under the same uuid.** The delivery URL
  (`asset.url`) does not change, so every page using the asset shows the new
  file without content changes.
- **Viewing: `asset.groups`.** No groups = **public**; otherwise members of any
  of them. New uploads are public; the form shows a large "THIS ASSET IS
  PUBLIC" alert until groups are picked.
- **Managing: `asset.roles`.** The roles that may list, edit and delete it in
  the CMS (backend `role_data_access`). On create, leaving "Who can manage it"
  empty grants the uploader's roles. The list only ever contains assets the
  caller may manage.
- **Folders: `asset.folder_id`.** Organisation only, nestable.
- **Default alt.** `asset.alt` fills image sections whose own `alt` is empty;
  the backend does this in the page payload, so renderers just read `alt`.

## Screens

`AssetsPage` (`/admin/assets`), built like the other admin lists (`PageHeader`,
filter card with `FilterActions`, `AdminTableFooter`):

| Piece | What it does |
| --- | --- |
| `AssetsList` | A folder browser: one folder at a time (breadcrumbs back up, starting at "All assets"), its subfolders first (with folder and `asset_count` totals, Edit folder), then its assets paged like the other lists (`folder_id`, `0` = assets in no folder). Search and the group filter search every folder and show each result's folder as a link. The page owns the current folder so uploads default into it. Selection covers the visible assets and resets when the folder or filters change. Bulk bar: **Add groups**, **Remove groups** (only groups every selected asset has), **Move to folder** (starts on the open folder; "No folder" = top level), **Delete** (confirmed), **Export selected**. |
| `AssetFormModal` | One `ModalWrapper` for both modes: files (create) or an optional replacement file (edit), name, default alt, folder, "Who can see it" (groups) with the public alert, "Who can manage it" (roles). |
| `AssetFolderModal` | Folder manager (header **Folders** button, or a folder row's Edit): pick a folder to rename, move or delete it, or none to create one. |
| `ExportImportAssetsModal` | Export the selected assets or everything; import a bundle. Import never overwrites (existing uuids are skipped). |

Gating (`PERMISSIONS`): upload, import and new folders need
`admin.asset.create`; edit, replace, bulk groups, bulk move and folder edits need
`admin.asset.update`; delete, bulk delete and folder delete need
`admin.asset.delete`; listing and export need `admin.asset.read`.

## API notes

- `group_ids` / `role_ids` travel as **comma-separated strings** in multipart
  requests, because multipart cannot send an empty list: `''` = none, omitted =
  default (create) / unchanged (edit). `folder_id` `''` = top level.
  `asset.api.ts` (`appendAssetFields`) is the only place that encodes them.
- Edit is `POST /admin/assets/{id}` (multipart), not `PUT`.
- Folder writes return the full folder list, which `useSaveAssetFolder`
  writes straight into the `['assets', 'folders']` cache.
- Always fetch bytes through `getAssetUrl(asset.url)`, which routes via the BFF
  (`/api/assets/...`) so the bearer token is attached. Never build a URL from
  `file_path`.
- Stored files have no extension, so file-type logic uses `asset.mime_type`
  (the type column shows the MIME subtype: `PNG`, `SVG`, `PDF`). Download links
  set no name, so the browser uses the server's `<uuid>.<extension>`.
- Export passes `{ responseType: 'blob' }` to the permission-aware client; the
  client treats a trailing object with `responseType` as request config.

## Cache

All asset hooks share the `['assets', ...]` prefix (lists, details, folders).
Every mutation invalidates that prefix once.

## Tests

- `src/api/admin/__tests__/asset.api.test.ts` — request encoding (groups, roles, folder, edit, bulk groups/move/delete, folders, export/import).
- `src/api/__tests__/permission-aware-client.test.ts` — `responseType` is request config (export downloads a Blob).
- `src/app/components/cms/assets/asset-form-modal/__tests__/AssetFormModal.test.tsx` — public by default with the alert, uploader's roles, edit payload, replace uses update.
- `src/app/components/cms/assets/assets-list/__tests__/` — delivery URLs, type column, action gating, access badges, group filter on Apply, bulk actions, folder browser (top level = `folder_id: 0`, open a folder and back via breadcrumbs, subfolders on page 1 only, search across folders, header total, move to folder), bulk delete.
