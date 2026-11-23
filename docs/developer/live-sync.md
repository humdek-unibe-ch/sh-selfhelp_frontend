# Live sync (frontend)

Audience: frontend developers.
Status: active.
Applies to: frontend 0.1.76 with core 0.1.49 and later, `@selfhelp/shared` 1.28.0.
Last verified: 2026-11-20.
Source of truth: `src/app/api/auth/events/route.ts`, `src/utils/shared-sse.ts`, `src/hooks/useAclEventStream.ts`, `src/utils/sync-tags.utils.ts`, `src/utils/acl-stamp.utils.ts`, `src/utils/page-view.utils.ts`, `src/hooks/useValidUntilRefetch.ts`, `src/hooks/useVanishedFormNotice.ts`, `src/app/[[...slug]]/DynamicPageClient.tsx`, and the backend contract in `sh-selfhelp_backend/docs/developer/` (realtime and ACL).

An open page, the menu, a list or an inspector follows a change made by someone else without a click and without polling. The server decides who hears about a change and what it names; this code matches the names against what is on screen and reads that data again.

## The stream

One browser holds one stream, `GET /api/auth/events` (same origin, a Next.js route that holds the Mercure connection). `shared-sse.ts` elects one leader tab (Web Locks, `BroadcastChannel` to the others; a tab without Web Locks opens its own).

- **Visitors are served too.** Without a session the backend answers the bootstrap with the public sync topic only, so the route sends no `Authorization` header and subscribes to that one topic. A signed-in user gets the personal topics and the sync topics (`syncTopics`: the user, each group, each role, `public`), once each in one `?topic=` list.
- **`acl` notices re-bootstrap.** The topic list depends on the user's groups and roles. When an `acl` notice arrives (`reconnectWhen`), or the signed-in identity changes (login, logout, impersonation), the leader closes the stream and opens it again, so the topics follow. This reconnect is silent: it does not count as "the stream dropped" and does not trigger the catch-up below.
- **Catch-up.** When a dropped stream comes back, pages, navigation and lists are marked stale once (`reconcileAfterReopen`); a tab that becomes visible again reads what was marked stale while it was hidden.

## The tag map

`changed` carries `{ v: 1, tags }`: names and ids only. `sync-tags.utils.ts` is the one place that maps tags to cache work. All roots come from `REACT_QUERY_CONFIG.QUERY_KEYS`.

| Tag | Effect |
| --- | --- |
| `acl` | user data, navigation (`NAVIGATION_ALL`); the `useAclVersionWatcher` cascade follows |
| `navigation` | navigation and the frontend page list |
| `page:<id>`, `page_draft:<id>`, `table:<id>`, `global_values` | the cached page payloads whose `sync.depends_on` names the tag (`pageDependsOn`); for `table:` also the form lists and data views of those pages (all lists when no cached page can be matched); for `page:` also the admin page list |
| `section:<id>` | the section details of that section (F56) |
| `asset:<id>` | the asset lists; the asset selection reads or drops that asset (F121) |
| `page_lock:<id>` | nothing here; the page editor listens through `subscribeSyncTags` |

A message is applied after a random delay of 0 to 300 ms (`syncRefetchDelayMs`), so many tabs do not read at the same instant. A hidden tab only marks queries stale (`refetchType: 'none'`).

Hook points for other screens: `subscribeSyncTags(listener)` (every message after the filters) and `registerSyncTagIgnore(predicate)` (drop a tag before it reaches the cache; the page editor lock uses it for a `page_draft:` of a page whose lock the caller holds).

## What a page does

- **Keeps what you typed.** A refetch swaps the payload; React keeps the state of every input whose section is still there. A record form hands a field its server value again only while the person has not touched that field (`FormStyle`, real user events only).
- **Says when a form is gone.** `useVanishedFormNotice` remembers which form sections the person typed into and reports one that is no longer in the payload; the page shows a notice (`LiveSyncNotices`). The texts are constants for now because the web client has no UI translation layer yet.
- **Says when the page is lost.** A refetch answered 401, 403 or 404 while a page is shown keeps the last payload on screen with a notice; nothing redirects.
- **`valid_until`.** A payload with `sync.valid_until` starts one timer (`useValidUntilRefetch`) that refetches that page's own cache slot once, up to 2 s after the moment; the new payload names the next moment. It is not polling.

## The access stamp

Every reply to a signed-in caller carries `X-Acl-Stamp`; the user data carries the same value as `acl_stamp`. The proxy passes the header through (`PASS_THROUGH_REPLY_HEADERS`, which also lists `X-Page-Version` for the page editor). `base.api.ts` hands it to `observeAclStamp`: a stamp that differs from the cached user data invalidates the user data once per new value. A client that missed a notice learns this way at its next request. A user data without `acl_stamp` (an older core) is never compared.

## Page views

The backend counts a page view only on `X-Page-View: 1`; the client sends it on exactly one fetch per navigation, and `X-Referrer-Host` travels on the same request.

- A direct load or an in-app navigation is counted by the server render of the slug route (`server-fetch.ts`: the fetch of the page body (`resolvePageByPathSSRStatus`), once per request, not for preview. The metadata and layout fetches carry no view: Next.js renders them alone for a link prefetch, and it removes its own prefetch headers before a Server Component or the proxy can see them, so "is this a prefetch" cannot be read there. Found in the Part 7 hand check: with the view on the first fetch, every header-menu link in view counted a view).
- A client fetch that has to load the page itself counts once per visit of a path (`claimPageView`); `DynamicPageClient` marks the page on screen as viewed (`markPageViewed`).
- Never counted: prefetch, live refetch, `valid_until` refetch, language switch, preview, `getPageByKeyword`.

## Writes that must not look stale

- A quick action on a list row answers with the record's new `version`; `applyRecordVersionToFormLists` writes it into the cached rows at once, so the next action on that row sends the right `expected_version` (F186).
- Group, role, data-table and page writes mark the section details stale (F56).

## The page editor: draft version and edit lock

Contracts C8 (draft version) and C9 (edit lock). The server refuses a draft write without the right version or from a caller who does not hold the lock; the editor makes both visible.

**Draft version (C8).** `page-draft-version.utils.ts` is the one place that knows which requests are draft writes (`POST|PUT|PATCH|DELETE /admin/pages/<id>…`, except `/lock…`), holds the version per page, and puts a page's writes in a line.

- The request interceptor of `base.api.ts` waits for the page's earlier write, sets `X-Page-Version`, and the response interceptors release the line, take the version from the reply header (`X-Page-Version`, only a higher number replaces the held one) and, on `409`, tell the editor. Every writer is covered, also the publish and version calls outside `page.api.ts`.
- The page read (`getPageFields`) hands over `draft_version`. A write for a page whose version is unknown (a publish from a list) reads the page first (`registerPageDraftVersionLoader`).
- Writes of one page leave one after the other, so two quick saves never carry the same number.
- `409 stale_page_version` → `page-edit-conflict.utils.ts` raises `stale`, takes the server's `current_version` as the held one and **holds** the page: `PageInspector` and `SectionInspector` skip the reload from the server into their form (`isStaleConflictHeld`) until a write goes through, so the person's unsaved values stay visible. `usePageEditLock` shows "This page was changed elsewhere" and reloads the draft.

**Edit lock (C9).** `usePageEditLock(pageId, enabled, options?)` runs inside `PageRightsProvider`. Editors (`can_update`) take and renew the lock. Callers with only delete or publish use `watchOnly`: they read `GET …/lock` and follow `page_lock` notices, but never acquire, renew or take over. A pure reader sends nothing.

| Event | Effect |
| --- | --- |
| open the page (editor) | `POST /admin/pages/<id>/lock`; `409 page_locked` (data = status) opens it read-only, naming the holder |
| open the page (delete/publish only) | `GET …/lock`; when held by someone else, banner without Take over and Delete/Publish paused |
| every 30 s, tab visible (editor) | the same `POST` renews; a hidden tab does not renew, the tab renews when it is visible again |
| `409 lock_idle_ended` on renew | idle banner; **Continue editing** calls take-over (the server refuses a silent renew after the idle end) |
| leave, other page | `DELETE …/lock` |
| `pagehide` | `DELETE …/lock` with `keepalive` (fetch adapter) |
| `page_lock:<id>` | `GET …/lock`; not holding it any more means taken over (someone holds it) or idle (nobody) → read-only with the reason; a read that finds the page free after the caller's own idle end keeps the idle banner (a plain acquire is refused after it, only Continue editing resumes); watchers re-enable Delete/Publish when free |
| `page_draft:<id>` | holding the lock: dropped by `registerSyncTagIgnore`; otherwise the draft queries are read again (`invalidatePageDraftQueries`) |
| `409 page_locked` on a write | read-only with the banner; delete/publish also get a notification naming the holder |
| Take over / Continue editing | `POST …/lock/take-over`, then the draft (and its version) is read again |

While the lock is not held (`checking`, `blocked`), `usePageEditRights` reports `canUpdate`, `canDelete` and `canPublish` as false. `allowDelete` / `allowPublish` keep those buttons visible so they can show disabled with the reason in a tooltip (`lockPauseLabel`: who is editing, or that the caller's own session ended). `PageReadOnlyBanner` draws the lock banner (name, reason, Take over with a confirmation, Continue editing after idle, Start editing when free; watchers get no resume button). `ADMIN_PAGES_LOCK_GET` lists update, delete, publish and version-delete; acquire/release/take-over stay update-only. If the lock call itself fails (network), the editor stays editable and the server still checks every write; a delete/publish caller whose first read fails counts the page as free, and the server refuses with `409 page_locked` while someone else holds it.

User view: [page-editing-lock.md](../user/page-editing-lock.md).

## Tests

`page-draft-version.test.ts`, `page.api.lock.test.ts`, `usePageEditLock.test.tsx`, `PageRightsContext.test.tsx`, `SectionInspector.staleConflict.test.tsx`, `syncTagMap.test.ts`, `useAclEventStream.test.tsx`, `shared-sse.test.ts`, `aclStamp.test.ts`, `useValidUntilRefetch.test.tsx`, `route.guest.test.ts`, `page.api.referrer.test.ts`, `page-referrer-ssr.test.ts`, `usePageContentByPath.pageView.test.tsx`, `FormStyle.liveSync.test.tsx`, `DynamicPageClient.liveSync.test.tsx`, `useFormList.quickActionVersion.test.tsx`. jsdom marks every dispatched event untrusted, so `src/test-utils/trusted-input.ts` types the way a person does.
