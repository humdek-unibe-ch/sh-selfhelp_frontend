/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The comparison itself: web route declarations (`API_CONFIG.ENDPOINTS`) against
 * the backend route table. Pure, so a test can feed it synthetic input and prove
 * that each kind of mistake is reported.
 */
import { normaliseBackendPath, type IBackendRoute } from './backend-routes';
import type { THttpMethod } from './call-sites';

export interface IEndpointEntry {
    route: string | ((...args: never[]) => string);
    permissions: readonly string[];
}

export interface IContractOptions {
    /**
     * Keys that the Next.js BFF answers or forwards under another path. `backendPath` is the backend route the
     * BFF calls for it; the rights are compared with that route. Without `backendPath` no backend route is
     * expected at all.
     */
    bffOnly: Record<string, { reason: string; backendPath?: string }>;
    /** Keys whose route cannot be built with placeholders. Value: why. */
    unbuildable: Record<string, string>;
    /** Method of a key whose call site cannot be read from the code. Value: where it is used and why. */
    methodOverrides: Record<string, { method: THttpMethod; reason: string }>;
    /**
     * Mismatches that are known and wait for a later fix or a user decision (a deferred finding, a question about
     * the backend). The entry is still checked: it must keep failing, so the list shrinks as the cause is fixed.
     * Value: the finding.
     */
    knownFailures: Record<string, string>;
}

export interface IContractStats {
    entries: number;
    bffOnly: number;
    knownFailures: number;
    matchedByMethod: number;
    matchedByPathOnly: number;
}

export interface IContractResult {
    problems: string[];
    stats: IContractStats;
}

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * The path of an entry with every parameter turned into `{}` and the query string removed. A route function
 * is called with placeholder strings; one that needs lists (`recordIds.join(',')`) is called again with
 * one-item lists, which print the same placeholder.
 */
export function webPathOf(entry: IEndpointEntry): string {
    let raw: string;
    if (typeof entry.route === 'function') {
        const route = entry.route as (...args: unknown[]) => string;
        const names = Array.from({ length: entry.route.length }, (_unused, index) => `__P${index}__`);
        try {
            raw = route(...names);
        } catch {
            raw = route(...names.map((name) => [name]));
        }
    } else {
        raw = entry.route;
    }
    return raw.split('?')[0].replace(/__P\d+__/g, '{}');
}

const sameSet = (a: readonly string[], b: readonly string[]): boolean =>
    a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

const show = (list: readonly string[]): string => `[${[...list].sort().join(', ')}]`;

export function checkRouteContract(
    endpoints: Record<string, IEndpointEntry>,
    methodsByKey: Map<string, Set<THttpMethod>>,
    unresolvedUses: Map<string, string[]>,
    backendRoutes: readonly IBackendRoute[],
    options: IContractOptions,
): IContractResult {
    const problems: string[] = [];
    const stats: IContractStats = {
        entries: 0,
        bffOnly: 0,
        knownFailures: 0,
        matchedByMethod: 0,
        matchedByPathOnly: 0,
    };

    // The skip lists stay honest: each key must still exist.
    for (const [listName, list] of [
        ['bffOnly', options.bffOnly],
        ['unbuildable', options.unbuildable],
        ['methodOverrides', options.methodOverrides],
        ['knownFailures', options.knownFailures],
    ] as const) {
        for (const key of Object.keys(list)) {
            if (!(key in endpoints)) {
                problems.push(`${listName} lists ${key}, which is no longer in API_CONFIG.ENDPOINTS: remove it`);
            }
        }
    }

    const byPath = new Map<string, IBackendRoute[]>();
    for (const route of backendRoutes) {
        const key = normaliseBackendPath(route.path);
        byPath.set(key, [...(byPath.get(key) ?? []), route]);
    }

    const failing = new Set<string>();
    const fail = (key: string, message: string): void => {
        failing.add(key);
        if (key in options.knownFailures) {
            return;
        }
        problems.push(message);
    };

    for (const [key, entry] of Object.entries(endpoints)) {
        stats.entries++;

        if (key in options.unbuildable) {
            continue;
        }
        let path: string;
        try {
            path = webPathOf(entry);
        } catch (error) {
            fail(key, `${key}: the route cannot be built with placeholders (${String(error)}); add it to the unbuildable list with a reason`);
            continue;
        }

        const bff = options.bffOnly[key];
        if (bff?.backendPath !== undefined) {
            stats.bffOnly++;
            path = normaliseBackendPath(bff.backendPath);
        }
        const candidates = byPath.get(path) ?? [];
        if (candidates.length === 0) {
            if (bff && bff.backendPath === undefined) {
                stats.bffOnly++;
            } else {
                fail(key, `${key}: web ${path} has no backend route (not in the bffOnly list)`);
            }
            continue;
        }
        if (bff && bff.backendPath === undefined) {
            problems.push(`${key}: listed as bffOnly but the backend has ${path}: remove it from the list`);
            continue;
        }

        const override = options.methodOverrides[key];
        const methods = override ? new Set<THttpMethod>([override.method]) : (methodsByKey.get(key) ?? new Set<THttpMethod>());
        const web = entry.permissions;

        if (methods.size > 0) {
            for (const method of methods) {
                const route = candidates.find((candidate) => candidate.methods.includes(method));
                if (!route) {
                    fail(
                        key,
                        `${key}: web calls ${method} ${path}, backend has ${candidates.map((c) => c.methods.join('|')).join(' and ')} there`,
                    );
                    continue;
                }
                stats.matchedByMethod++;
                if (web.length === 0 && !route.is_public && WRITE_METHODS.has(method)) {
                    fail(
                        key,
                        `${key}: permissions [] on a write (${method} ${path}), the backend route ${route.name} needs ${show(route.permissions)}`,
                    );
                } else if (!sameSet(web, route.permissions)) {
                    fail(
                        key,
                        `${key}: ${method} ${path}: web ${show(web)} / backend ${show(route.permissions)} (route ${route.name})`,
                    );
                }
            }
            continue;
        }

        // No call site: path only. Safe only when every route on the path asks for the same rights.
        const distinct = new Set(candidates.map((candidate) => [...candidate.permissions].sort().join('|')));
        const where = unresolvedUses.get(key)?.join(', ') ?? 'no use found';
        if (distinct.size > 1) {
            fail(
                key,
                `${key}: no method known (${where}) and ${path} has routes with different rights (${candidates
                    .map((c) => `${c.methods.join('|')} ${show(c.permissions)}`)
                    .join('; ')}); read the method from a call site or add it to methodOverrides`,
            );
            continue;
        }
        stats.matchedByPathOnly++;
        const route = candidates[0];
        if (web.length === 0 && !route.is_public) {
            fail(key, `${key}: permissions [] on ${path} (no method known), the backend needs ${show(route.permissions)}`);
        } else if (!sameSet(web, route.permissions)) {
            fail(key, `${key}: ${path}: web ${show(web)} / backend ${show(route.permissions)} (route ${route.name})`);
        }
    }

    for (const key of Object.keys(options.knownFailures)) {
        if (key in endpoints) {
            if (failing.has(key)) {
                stats.knownFailures++;
            } else {
                problems.push(`${key}: listed as a known failure but it now passes: remove it from knownFailures`);
            }
        }
    }

    return { problems, stats };
}
