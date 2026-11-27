/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Loads the backend route table that the backend generates and commits
 * (`sh-selfhelp_backend/docs/reference/access/api-routes.json`, written by
 * `php bin/console app:access:export`). The route rights live in the backend
 * database; this file is the one generated copy the web is checked against.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface IBackendRoute {
    name: string;
    methods: string[];
    path: string;
    is_public: boolean;
    permissions: string[];
}

export interface IBackendRouteTable {
    routes: IBackendRoute[];
    permissions: Array<{ name: string; description: string }>;
}

export const ROUTE_TABLE_RELATIVE_PATH = 'docs/reference/access/api-routes.json';

/** `SELFHELP_BACKEND_DIR`, default the sibling `../sh-selfhelp_backend` of the frontend root. */
export function backendRouteTablePath(frontendRoot: string = process.cwd()): string {
    const backendDir = process.env.SELFHELP_BACKEND_DIR ?? resolve(frontendRoot, '..', 'sh-selfhelp_backend');
    return resolve(backendDir, ROUTE_TABLE_RELATIVE_PATH);
}

/** Never skips: a missing file is a failure that names the path and the variable. */
export function loadBackendRouteTable(frontendRoot: string = process.cwd()): IBackendRouteTable {
    const path = backendRouteTablePath(frontendRoot);
    if (!existsSync(path)) {
        throw new Error(
            `Backend route table not found: ${path}. Check out sh-selfhelp_backend there, or set SELFHELP_BACKEND_DIR ` +
                `to its folder, and make sure ${ROUTE_TABLE_RELATIVE_PATH} exists (php bin/console app:access:export).`,
        );
    }
    return JSON.parse(readFileSync(path, 'utf8')) as IBackendRouteTable;
}

/** `/admin/pages/{page_id}/sections` -> `/admin/pages/{}/sections` */
export function normaliseBackendPath(path: string): string {
    return path.replace(/\{[^}]+\}/g, '{}');
}
