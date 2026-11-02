# Clean User Data — Backend contract

Audience: developers on `sh-selfhelp-fe` / `sh-selfhelp-be`
Status: **Implemented in core 0.1.42**, paired with frontend 0.1.68. This doc is kept as the rationale record for the contract, not as an open request.
Applies to: `sh-selfhelp-be` `AdminUserService` / `AdminUserController` and this frontend's Users Management page
Source of truth: the backend service (`AdminUserService::cleanUserData()`) — this doc mirrors it
Last verified: 2026-07-29

> **Terminology.** **"SelfHelp v1"** means the legacy PHP application (the
> `sh-selfhelp` repo) whose behaviour this restores; **"SelfHelp v2"** means the
> current Symfony backend (`sh-selfhelp-be`). Neither refers to the `/cms-api/v1`
> API version or the `_v1` route-name suffix, both of which appear throughout and
> are unrelated.

> **Resolved.** The route, controller action, permission mapping, and frontend
> call chain already existed; the missing piece was the service body, which was a
> `// TODO` stub returning `true` without deleting anything. Core **0.1.42**
> implements it, and this frontend's `supports.core` floor is raised to `>=0.1.42`
> so the UI can never pair with a core where confirming an irreversible erasure
> reports a success that did not happen.
>
> Sections 4–7 below record **decisions that were made**, not open questions.
> Section 3's soft-delete concern turned out to be **moot** — see the correction
> in that section.

---

## 1. What already exists (do not rebuild)

| Layer | State |
| --- | --- |
| Route `admin_users_clean_data_v1` | `POST /cms-api/v1/admin/users/{userId}/clean-data`, live |
| Permission mapping | `admin.user.update` (`api_routes_permissions`) |
| Impersonation guard | Route is in `ApiSecurityListener`'s impersonation-blocked list — correct, keep |
| `AdminUserController::cleanUserData()` | Live, returns `formatSuccess(['cleaned' => $result])` |
| `AdminUserService::cleanUserData()` | Was the stub; **implemented in core 0.1.42** (signature took `$currentUserId`) |
| Frontend | `ADMIN_USERS_CLEAN_DATA` endpoint config, `AdminUserApi.cleanUserData()`, `useCleanUserData()`, Users list row action + confirmation modal |

The frontend inspects the HTTP status (`200`/`204` ⇒ success) and shows a toast.
Errors surface as non-2xx — `403` on system users and insufficient permissions,
`404` unknown user, `401` unauthenticated — so "any 2xx means the data is gone"
holds against core >=0.1.42.

## 2. What SelfHelp v1 did

`sh-selfhelp/server/component/user/UserModel.php:292` — `clean_user_data($uid)`:

1. Refuse unless the acting admin is of a **higher level** than the target user.
2. Open a transaction.
3. Delete `user_activity` rows for the user.
4. Delete every `scheduledJobs` row joined to the user via `scheduledJobs_users`, then the `scheduledJobs_users` rows.
5. Delete `dataRows` for the user.
6. Commit; roll back and return `false` on any failure.

The user account itself is **kept** — this is deliberately not `delete_user()`.
It is the GDPR "erase what I produced, keep the (inactive) account" path.

## 3. SelfHelp v2 mapping — the nuances that matter

The SelfHelp v1 table list does not translate one-to-one. Decisions needed:

| SelfHelp v1 | SelfHelp v2 | Note |
| --- | --- | --- |
| `user_activity` | **`Transaction`** (`transactions`) | This is what the admin Users list counts as the "Activity" column (`$user->getTransactions()->count()` in `formatUserForDetail`). See §4 — this one is a real judgement call. |
| — | `PageView` / `PageViewReferrer` | **Nothing to clean.** SelfHelp v2 page views are pseudonymous daily aggregates (`visitor_hash`, no `id_users`). Do not attempt per-user deletion here. |
| `dataRows` | **`DataRow`** (plain `id_users` column) + **`DataCell`** | Both deleted, **cells first**. The `cascade: ['persist','remove']` on `DataRow::$dataCells` is ORM-level and does **not** fire on the bulk DQL path used here — see the corrections below. |
| `scheduledJobs` | **`ScheduledJob`** (`id_users`, `onDelete: 'CASCADE'`) | |
| `scheduledJobs_users` | **`ScheduledJobRecipient`** (`id_users`, `onDelete: 'SET NULL'`) | **Deleted first, by `id_users`.** The FK is `SET NULL`, not cascade, so deleting the user's own jobs would leave behind any recipient row pointing at them on **someone else's** job — a record of what this user was sent, which an erasure covers. Recipient/reminder rows on the user's *own* jobs cascade from `scheduled_jobs`. |
| — | `DataAccessAudit` | **Kept** — security audit surface, not user content. See §4. |
| — | `UserNavigationState`, `Users2faCode`, `RefreshToken`, `ValidationCode` | Session/auth state, not "user data". **Out of scope**, but say so explicitly in the implementation comment so the next reader doesn't wonder. |

### Corrections (verified against core 0.1.42)

An earlier draft of this section raised a **soft-delete concern that turned out
to be moot**. Recorded here rather than deleted, because the same false worry is
easy to re-derive from the same source:

- **There is no soft delete to worry about.** `id_users_deleted` appears in this
  repo's `release-manifest.json` as one of the standard *projection* columns the
  admin data-columns endpoint prepends — but it **exists nowhere in the
  backend**: no entity, no column, no query. There is no soft-delete flag on
  `DataRow`, so the erasure is an unconditional hard delete and cannot leave
  already-deleted rows behind.
- **`DataRow.id_users` is a plain nullable integer column** (`private ?int
  $idUsers`), not a `ManyToOne` association. DQL against it is `dr.idUsers`, not
  `dr.user` — unlike `ScheduledJob`, `ScheduledJobRecipient`, and `Transaction`,
  which *are* associations and use `.user`. Both forms appear in the
  implementation; that asymmetry is deliberate and matches the entities.
- **`DataCell` is deleted explicitly, ahead of `DataRow`** — the one place this
  could have silently left data behind. `DataRow::$dataCells` declares
  `cascade: ['persist','remove']`, which is an **ORM-level** cascade that only
  fires on `$em->remove()` of a managed entity. The implementation uses bulk DQL
  `DELETE`, which bypasses the UnitOfWork entirely, so the cells are removed by
  their own statement rather than relying on the constraint staying in place.

## 4. The one real design decision: audit trails

`Transaction` is SelfHelp v2's **audit log**, not just an activity feed. Deleting a user's
transactions:

- makes the frontend "Activity" column drop to 0 (that is the visible, expected
  effect the admin is asking for), but
- also erases the record that e.g. the user was blocked, had roles changed, or
  was impersonated — and `cleanUserData` itself is expected to **write** a
  transaction (`LookupService::TRANSACTION_TYPES_*`, via `logUserTransaction`)
  for exactly the same reason every other mutation does.

**Decided: (a) erase them.** Closest to SelfHelp v1 and to a GDPR erasure request. The
clean operation's own audit entry is written **after** the wipe so it survives,
and inside the same transaction so a late failure rolls the erasure back rather
than leaving it unlogged. The frontend modal copy ("all activity logs", "all
input data entered by this user", "all scheduled actions for this user") is
accurate as shipped and was **not** reworded.

**`DataAccessAudit`: decided keep** — it is a security audit surface recording
*who accessed what*, not content the user produced. Documented in a code comment
at the implementation. If a compliance owner later rules that an erasure request
covers it too, that is a one-line backend change plus modal rewording, not a
redesign.

### The semantic that surprises everyone

`Transaction.id_users` is the **acting** user, not the subject —
`TransactionService::logTransaction()` fills it from `getCurrentUser()`. So the
wipe erases **what this user did**; admin actions performed **on** them (block,
role change, impersonation) are attributed to that admin and **survive**.

"All activity logs" in the modal is therefore accurate under the natural reading
— everything they did — but it does not mean "every record mentioning them".
This is flagged in a `NOTE:` block at the delete and in the method docblock,
because it is the single most misreadable thing about the function.

The admin Users list "Activity" column **does** drop to 0: it counts the same
`User::$transactions` relation the wipe deletes.

## 5. Authorization

SelfHelp v1 gated on "acting admin is of a higher level than the target". The
SelfHelp v2 equivalent already exists in the same service:

```php
if (!$this->canAccessUser($currentUserId, $userId, DataAccessSecurityService::PERMISSION_DELETE)) {
    throw new ServiceException('Insufficient permissions to clean user data', Response::HTTP_FORBIDDEN);
}
```

Follow `deleteUser()`:

- Take `$currentUserId` — **the current signature `cleanUserData(int $userId)`
  has no acting user, so it must change** and the controller must pass
  `$this->userContextService->getCurrentUser()?->getId()` (see `impersonateUser`
  for the null handling).
- Refuse for `self::SYSTEM_USERS`.
- The route permission **stays `admin.user.update`** and must not be raised. The
  frontend client-side gate (`ADMIN_USERS_CLEAN_DATA.permissions` + the
  `canUpdate` UI gate) is pinned to it. `PERMISSION_DELETE` above is an
  **additional resource-side check** on the specific target user — it is
  invisible to the client gate and must **not** be mirrored there, or admins get
  a client-side block on a call the server would have allowed.

## 6. Implementation requirements

- Wrap in `$this->executeInTransaction(...)` (SelfHelp v1's manual
  begin/commit/rollback).
- Use `findUserOrThrow($userId)`.
- Write a transaction log entry via `logUserTransaction(...)` naming the user and
  what was removed (see §4 on ordering).
- Invalidate caches: `invalidateUserCaches($userId)` plus
  `CacheService::CATEGORY_USERS`→`invalidateAllListsInCategory()` — the Users
  list caches the activity count. The frontend already invalidates its own React
  Query `['users','list']` and `['users','detail',id]` keys on success.
- **Fail loudly.** SelfHelp v1 swallowed exceptions and returned `false`; a partial or
  failed erasure must surface as a non-2xx `ServiceException`, not a `200` with
  `cleaned: false`. The frontend treats any 2xx as "data is gone".

## 7. Response shape

Inside the standard `ApiResponseFormatter` envelope:

```json
{
  "cleaned": true,
  "removed": {
    "scheduled_job_recipients": 2,
    "scheduled_jobs": 3,
    "data_cells": 18,
    "data_rows": 7,
    "transactions": 42
  }
}
```

The `removed` count map was added on the backend's proposal — the counts are
computed anyway for the audit-log line, and they turn the success toast from
"done" into something an admin can check against what they expected.

Two conventions that matter:

- **Kept entities are absent, never `0`.** There is no `data_access_audit` key.
  An absent key means "not in scope"; a `0` would read as "there were none",
  which is a different and misleading claim.
- **`data_cells` is reported separately from `data_rows`** because the backend
  deletes them with their own statement (see §3 corrections), not as a cascade.

The frontend treats the whole body as additive: it keys off the HTTP status and
ignores unknown fields, so backend-side additions here never require an FE
change.

## 8. Tests (canonical testing rules)

- Regression test: a user with activity + data rows + scheduled jobs is cleaned;
  assert each set is empty afterwards **and that the user row still exists**
  (this is the whole point — and note the stub would have passed a
  "returns true" test, so assert the side effects, never the return value).
- Permission matrix: allowed admin ⇒ 200; lower-privileged user ⇒ 403;
  unauthenticated ⇒ 401; cross-scope admin ⇒ 403/404 per the established rule.
- Atomicity: force a failure mid-clean and assert nothing was deleted.
- System-user guard: cleaning a `SYSTEM_USERS` account ⇒ 403.
- Impersonation: the route stays blocked under an impersonation token.
- QA personas + `qa.` prefixed fixtures only.

## 9. Version pinning (both repos, same wave) — done

The frontend depends on this *actually working*, so it is a coupled change and
both floors moved together:

| Repo | Field | Value |
| --- | --- | --- |
| `sh-selfhelp-fe` | `supports.core` | `>=0.1.41` → **`>=0.1.42 <0.2.0`** |
| `sh-selfhelp-be` | `supports.frontend` | **`>=0.1.68`** |

Frontend ships as **0.1.68**, core as **0.1.42**. The floor is raised even
though no request/response shape changed: pre-0.1.42 cores answer
`200 {"cleaned": true}` from the stub, so pairing this UI with one would let an
admin confirm an irreversible erasure and be told it succeeded. That is exactly
the failure the bidirectional gate exists to prevent, and the registry resolver
now refuses the pair in either direction.

Backend docs updated in the same wave: `docs/reference/api/07-admin-users.md`
(which already claimed "Remove all user-generated content and data" — true of
the intent, false of the stub) and `user-management-api.md` now state the
concrete SelfHelp v2 entity scope, the acting-user semantics, and the §4 audit decision,
plus the cross-repo compatibility matrix floor note.
