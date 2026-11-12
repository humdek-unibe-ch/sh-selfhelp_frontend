# Asset management (admin)

Audience: frontend developers.
Status: active.
Applies to: frontend 0.1.70 with core 0.1.43 and later.
Last verified: 2026-11-12.
Source of truth: `src/api/admin/asset.api.ts`, `src/hooks/useAssets.ts`, `src/app/components/cms/assets/`, and the backend contract in `sh-selfhelp_backend/docs/reference/api/06-admin-assets.md`.

## Model

- **An asset is identified by its `uuid`, which is also its stored file
  name** (no extension on disk). `name` is an editable label without
  extension. The server stores the extension (`asset.extension`) and sends the
  download name (`asset.file_name` = `<name>-<uuid>.<extension>`). Lists show
  `assetLabel()` (`name`, else the uuid); pickers (navigation logo, action
  attachments) show `assetFileLabel()` = `name.<extension>`. Legacy assets
  without a stored extension fall back to the MIME type. Uploads never
  overwrite each other; an upload identical to a stored file still succeeds and
  answers `duplicates` (up to 5 `{id, name, folder_id}`), which the form shows
  as a warning.
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
- **Folders: `asset.folder_id`.** Organisation only, nestable (depth 20).
  Folders are virtual rows; the asset files stay flat. A folder is deleted only
  when empty (the server answers 409 otherwise). Names are unique per parent
  without regard to letter case. **Set access** on a folder is a one-time
  change to the assets it holds (`POST /admin/asset-folders/{id}/access`, all or
  nothing, 403 if any asset is not the caller's to change); it is not a
  property of the folder.
- **The admin role** is implicit: it is not offered in "Who can manage it"
  (`isAdminRole`, by name, see finding F10) and a non-admin cannot save an
  asset with no managing role.
- **Default alt.** `asset.alt` fills image sections whose own `alt` is empty;
  the backend does this in the page payload, so renderers just read `alt`.

## Screens

`AssetsPage` (`/admin/assets`), built like the other admin lists (`PageHeader`,
filter card with `FilterActions`, `AdminTableFooter`):

| Piece | What it does |
| --- | --- |
| `AssetsList` | A folder tree. Several folders can be open at once; each opened folder loads its own assets, paged (50 per page, "Show more"). A folder row shows `N folders · M assets` (`subtree_asset_count`). The folder menu: Rename (in place, Enter/Escape), New subfolder, Upload here, Move to..., Set access..., Delete (disabled until empty). The header has **New folder** (top level). Drag assets (with the selection) or folders onto a folder or the "All assets" strip; every drag also exists as "Move to..." or the bulk bar, and the drag handle is `aria-hidden`. Drag details (`assets-dnd.ts`, styles in `assets-tree.module.css`): the whole name block of a row is the grab area; the window autoscrolls (`autoScrollWindowForElements`, vertical, `fast`) and a `wheel` listener scrolls the window during a drag, because a native drag swallows the wheel in some browsers; the monitor returns the drag state (what is dragged and the folder under the pointer) which `assets-tree.context.tsx` turns into row cues (`target`, `inside`, `available`, `blocked`); `TopLevelDropZone` also renders a floating "Top level" dock (portal, `position: fixed`) while the strip is out of view, and `DragStatusBar` says what a drop would do. Rows of an open folder (and its "empty" note) are drop targets for that folder. Search and the group filter show flat results with a link to each folder. Selection is a `Map<id, asset>` over all open folders (so bulk rights are checked on every selected asset) and clears when filters change, after a bulk group change or a folder access change, and drops an asset after it was edited (the stored copies would otherwise carry its old groups and rights). Bulk bar: **Add groups**, **Remove groups**, **Move to folder**, **Delete** (confirmed), **Export selected**. Tree parts: `FolderTree`, `FolderRow`, `AssetRow`, `FolderNameField`, `MoveToFolderModal`, `TopLevelDropZone`, `assets-tree.context.tsx`, `assets-dnd.ts`. |
| `AssetFormModal` | One `ModalWrapper` for both modes. Create: a compact dropzone and a file table (`UploadFileTable`: name and alt per file, status), the folder as a typed path (`FolderPathCombobox`, folders are created when the upload starts, matched without regard to letter case), "Who can see it" and "Who can manage it" (`asset-access-fields`). Files upload one by one; failed files stay for a retry; duplicates are a yellow notification that stays until closed. Edit: one row plus an optional replacement file. On a wide screen the modal does not scroll (only the file table does). |
| `AssetFolderAccessModal` | Folder menu **Set access...**: two switches (change who can see / who can manage), each reveals its picker; sends only the switched-on lists; shows the server refusal. |
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
- Stored files have no extension on disk, so file-type logic uses
  `asset.extension` (type column: `PNG`, `CSV`, `PDF`), falling back to the MIME
  type for legacy assets. Download links set no name, so the browser uses the
  server's `<name>-<uuid>.<extension>`.
- Uploads are one request per file (`POST /admin/assets`); there is no
  multi-file endpoint any more.
- `useSetAssetFolderAccess` invalidates the asset lists and section details
  (pickers show asset access).
- Export passes `{ responseType: 'blob' }` to the permission-aware client; the
  client treats a trailing object with `responseType` as request config.

## Cache

All asset hooks share the `['assets', ...]` prefix (lists, details, folders).
Every mutation invalidates that prefix once.

## Tests

- `src/api/admin/__tests__/asset.api.test.ts` — request encoding (groups, roles, folder, edit, bulk groups/move/delete, folders, export/import).
- `src/api/__tests__/permission-aware-client.test.ts` — `responseType` is request config (export downloads a Blob).
- `src/app/components/cms/assets/asset-form-modal/__tests__/AssetFormModal.test.tsx` — public by default with the alert, uploader's roles, per-file upload and retry, typed folder path (created top down at upload start, case-insensitive match, 409 reuse), duplicate notice, edit payload, replace uses update.
- `src/app/components/cms/assets/asset-folder-access-modal/__tests__/` — switches, payload keys, public warning, admin rule, refusal message.
- `src/app/components/cms/assets/assets-list/__tests__/` — delivery URLs, type column, action gating, access badges, group filter on Apply, bulk actions, folder tree (lazy per-folder loading, several folders open, in-place rename, new subfolder, move dialogs, search with folder links, bulk rights across open folders, selection clearing), bulk delete.
