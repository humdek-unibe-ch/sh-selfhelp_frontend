# End-to-end test profiles

Audience: Frontend developers and testers.
Status: active.
Applies to: SelfHelp2 Next.js frontend.
Last verified: 2026-11-19.
Source of truth: `scripts/e2e-stack.mjs` (`PROFILES`), `package.json`, `e2e/`.

Every Playwright suite runs through one harness, `scripts/e2e-stack.mjs`. It starts the test services, resets the test database, starts the backend and the built frontend, runs the suite and stops everything again. A profile is a spec folder plus one line in `PROFILES` plus one npm script.

| Profile | Command | Folder | What it proves |
| --- | --- | --- | --- |
| golden | `npm run test:golden` | `e2e/golden` | The form → action → job golden flow |
| a11y | `npm run test:a11y` | `e2e/a11y` | axe-core accessibility |
| visual | `npm run test:visual` | `e2e/visual` | Visual regression against the committed Linux baselines |
| admin | `node scripts/e2e-stack.mjs admin` | `e2e/admin` | Admin screens |
| plugin | `node scripts/e2e-stack.mjs plugin` | `e2e/plugins` | Plugin host flows |
| access | `npm run test:access` | `e2e/access` | Least privilege: restricted people see and open only what their rights allow |

Overrides (ports, external stack, skipping steps) are listed at the top of `scripts/e2e-stack.mjs`. The backend is found at `SELFHELP_BACKEND_DIR`, else the sibling `../sh-selfhelp_backend`. If port 3000 is taken (for example by `next dev`), set `SELFHELP_E2E_FRONTEND_PORT`.

## The access profile (least-privilege walk)

`e2e/access/least-privilege.spec.ts` signs in as the seeded restricted QA personas (backend `QaBaselineFixture` and `QaAccessPersonaFixture`; password from `QA_USER_PASSWORD`) through the real login form:

- One read-only person per distinct `admin.<area>.read` of the screen registry (`src/config/admin-screens.ts`): `qa.read.<area-with-dashes>@selfhelp.test`.
- `qa.readupdate@selfhelp.test`: every read and update right, the view bit only on the QA page `qa-feedback` and the QA group `qa_access_group`.

For each person the walk opens `/admin` (the only `page.goto`), checks that the menu shows exactly the screens whose read right the person holds, opens every one of them by clicking its menu entry, and fails when

- a screen is in the menu without its read right, or missing with it;
- a visible, enabled write control is shown without its right (one matcher in `e2e/utils/access.ts`: the verbs add, new, create, edit, save, delete, remove, upload, import, publish, unpublish, restore, execute, run, clear, invalidate, assign, duplicate, move; row-action menus are opened and read too). Exceptions are listed with their reason in `WRITE_CONTROL_EXCEPTIONS` and `WRITE_CONTROL_RIGHTS`;
- the read/update person sees an edit control on the view-only page or group (F234, rule 4.11);
- any `/api/` answer is 400 or 403 during normal use (the failure names the URL, the method and the screen).

The problems of one person are collected and reported together at the end of that person's test.

CI: `.github/workflows/e2e-access.yml` runs the profile on pull requests that touch admin screens, the registry, the walk or the harness. Related checks: the route contract test (`src/config/__tests__/api-route-contract.test.ts`) compares the web's route rights with the backend's route table.
