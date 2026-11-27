/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The admin screen registry and its generated copy
 * `docs/reference/admin-screens.json` (rule 1.5: a committed generated copy
 * fails a check when stale; the backend permission catalogue reads it).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_SCREENS, renderAdminScreensJson } from '../admin-screens';
import { PERMISSIONS } from '../../types/auth/jwt-payload.types';

const FE_ROOT = process.cwd();
const JSON_PATH = join(FE_ROOT, 'docs', 'reference', 'admin-screens.json');

describe('admin screen registry', () => {
    it('matches the committed docs/reference/admin-screens.json', () => {
        expect(existsSync(JSON_PATH), `${JSON_PATH} is missing: run npm run access:screens`).toBe(true);
        // A Windows checkout with core.autocrlf may turn the file's `\n` into
        // `\r\n`; that is not staleness. Everything else compares byte for byte.
        const committed = readFileSync(JSON_PATH, 'utf8').replace(/\r\n/g, '\n');
        expect(committed, 'docs/reference/admin-screens.json is stale: run npm run access:screens').toBe(
            renderAdminScreensJson(),
        );
    });

    it('has unique ids and unique paths', () => {
        const ids = ADMIN_SCREENS.map((s) => s.id);
        const paths = ADMIN_SCREENS.map((s) => s.path);
        expect(new Set(ids).size).toBe(ids.length);
        expect(new Set(paths).size).toBe(paths.length);
    });

    it('points every screen at a route folder under src/app/admin', () => {
        for (const screen of ADMIN_SCREENS) {
            const dir = join(FE_ROOT, 'src', 'app', ...screen.path.split('/').filter(Boolean));
            expect(existsSync(dir) && statSync(dir).isDirectory(), `${screen.id}: no route folder ${dir}`).toBe(true);
        }
    });

    it('lists no plugin host screen (F238, deferred plugin work)', () => {
        for (const screen of ADMIN_SCREENS) {
            expect(screen.path, screen.id).not.toMatch(/^\/admin\/plugins(-host)?(\/|$)/);
        }
    });

    it('opens every screen with one permission name, the dashboard with admin.access', () => {
        const names = new Set<string>(Object.values(PERMISSIONS));
        for (const screen of ADMIN_SCREENS) {
            expect(names.has(screen.read_permission), screen.id).toBe(true);
        }
        expect(ADMIN_SCREENS.find((s) => s.id === 'dashboard')).toMatchObject({
            path: '/admin',
            read_permission: 'admin.access',
        });
    });
});
