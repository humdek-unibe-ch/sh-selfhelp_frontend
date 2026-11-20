/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Route-permission contract (finding F239, rule 4.14).
 *
 * `API_CONFIG.ENDPOINTS` (api.config.ts) is a hand-kept copy of which right each
 * backend route needs (F32). The backend writes its route table, with methods and
 * rights, to `docs/reference/access/api-routes.json` (`php bin/console
 * app:access:export`). This test compares every web declaration with that file:
 * path, method (read from the call sites) and permissions as a set. It fails on a
 * missing backend route, a different right, an empty list on a write, an unknown
 * method that makes the match ambiguous, and on a list entry that is no longer
 * needed (a known failure that passes, a key that is gone).
 *
 * The backend file comes from `SELFHELP_BACKEND_DIR` (default: the sibling
 * `../sh-selfhelp_backend`). A missing file fails the test; it never skips.
 */
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { API_CONFIG } from '../api.config';
import { loadBackendRouteTable } from './route-contract/backend-routes';
import { scanCallSites } from './route-contract/call-sites';
import {
    checkRouteContract,
    type IContractOptions,
    type IEndpointEntry,
} from './route-contract/check-contract';

const SRC_DIR = join(process.cwd(), 'src');

/**
 * Plugin host routes (`/admin/plugins*`) whose web right differs from the backend route row: F238. The user
 * deferred them (2026-11-19, "All except plugins") to the plugin work, so they are known failures, not skipped:
 * each is still compared, and the entry must be removed here once the web declares the backend's right.
 * The other plugin host entries already match and are checked normally.
 */
const F238 = 'F238: plugin host right differs from the backend route row; fixed with the plugin work (D9)';
const PLUGIN_HOST_KNOWN_FAILURES = [
    'ADMIN_PLUGIN_INSPECT_ARCHIVE',
    'ADMIN_PLUGIN_ENABLE',
    'ADMIN_PLUGIN_DISABLE',
    'ADMIN_PLUGIN_UNINSTALL',
    'ADMIN_PLUGIN_REPAIR',
    'ADMIN_PLUGIN_REPAIR_ALL',
    'ADMIN_PLUGIN_SOURCES_CREATE',
    'ADMIN_PLUGIN_SOURCE_UPDATE',
    'ADMIN_PLUGIN_SOURCE_DELETE',
    'ADMIN_PLUGIN_FEATURE_FLAGS_SET',
    'ADMIN_PLUGINS_SAFE_MODE_ENABLE',
    'ADMIN_PLUGINS_SAFE_MODE_DISABLE',
];

const OPTIONS: IContractOptions = {
    bffOnly: {
        // `POST /api/mobile-preview/session` is a dedicated BFF route that keeps the admin token on the server
        // and calls the backend mint route; the web right must be the right of that backend route.
        ADMIN_MOBILE_PREVIEW_SESSION: {
            reason: 'dedicated BFF mint route (src/api/admin/mobile-preview.api.ts)',
            backendPath: '/admin/mobile-preview/session',
        },
    },
    unbuildable: {},
    methodOverrides: {},
    knownFailures: Object.fromEntries(PLUGIN_HOST_KNOWN_FAILURES.map((key) => [key, F238])),
};

describe('web route declarations match the backend route table', () => {
    it('has a backend route table to compare with', () => {
        const table = loadBackendRouteTable();
        expect(table.routes.length).toBeGreaterThan(0);
    });

    it('declares for every route exactly the rights, method and path of the backend', () => {
        const table = loadBackendRouteTable();
        const calls = scanCallSites(SRC_DIR);
        const result = checkRouteContract(
            API_CONFIG.ENDPOINTS as unknown as Record<string, IEndpointEntry>,
            calls.methods,
            calls.unresolvedUses,
            table.routes,
            OPTIONS,
        );
        expect(result.problems.join('\n')).toBe('');
    });
});
