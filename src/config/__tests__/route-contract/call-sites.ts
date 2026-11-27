/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Finds the HTTP method of every `API_CONFIG.ENDPOINTS.<KEY>` entry from the
 * places that use it. An entry in `api.config.ts` carries no method; the method
 * is visible only at the call site, for example
 * `permissionAwareApiClient.put(API_CONFIG.ENDPOINTS.ADMIN_GROUPS_UPDATE, ...)`.
 *
 * It uses the TypeScript compiler API (already a dev dependency) and parses
 * only; no type checking. A use of an entry that is not the first argument of
 * `<client>.<get|post|put|patch|delete>(...)` is returned in `unresolvedUses`
 * so the contract test can name it instead of guessing.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

export type THttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

const VERB_TO_METHOD: Record<string, THttpMethod> = {
    get: 'GET',
    post: 'POST',
    put: 'PUT',
    patch: 'PATCH',
    delete: 'DELETE',
};

export interface ICallSites {
    /** Methods found per endpoint key, from recognised `<client>.<verb>(API_CONFIG.ENDPOINTS.KEY, ...)` calls. */
    methods: Map<string, Set<THttpMethod>>;
    /** Uses of an entry that are not such a call: `KEY` -> `file:line`. */
    unresolvedUses: Map<string, string[]>;
}

const SKIPPED_DIRS = new Set(['__tests__', 'test-utils', 'generated', 'node_modules']);
const SOURCE_FILE = /\.(ts|tsx)$/;
const TEST_FILE = /\.(test|spec)\.(ts|tsx)$/;

function collectSourceFiles(dir: string, out: string[]): void {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) {
            if (!SKIPPED_DIRS.has(name)) {
                collectSourceFiles(full, out);
            }
        } else if (SOURCE_FILE.test(name) && !TEST_FILE.test(name) && !name.endsWith('.d.ts')) {
            out.push(full);
        }
    }
}

/** `API_CONFIG.ENDPOINTS.KEY` -> `KEY`, otherwise null. */
function endpointKeyOf(node: ts.Node): string | null {
    if (
        ts.isPropertyAccessExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'ENDPOINTS' &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === 'API_CONFIG'
    ) {
        return node.name.text;
    }
    return null;
}

export function scanCallSites(srcDir: string): ICallSites {
    if (!existsSync(srcDir)) {
        throw new Error(`Source folder not found: ${srcDir}`);
    }
    const files: string[] = [];
    collectSourceFiles(srcDir, files);

    const methods = new Map<string, Set<THttpMethod>>();
    const unresolvedUses = new Map<string, string[]>();

    for (const file of files) {
        const text = readFileSync(file, 'utf8');
        if (!text.includes('ENDPOINTS')) {
            continue;
        }
        const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
        const recognised = new Set<ts.Node>();

        const visit = (node: ts.Node): void => {
            if (
                ts.isCallExpression(node) &&
                ts.isPropertyAccessExpression(node.expression) &&
                node.expression.name.text in VERB_TO_METHOD &&
                node.arguments.length > 0
            ) {
                const key = endpointKeyOf(node.arguments[0]);
                if (key !== null) {
                    recognised.add(node.arguments[0]);
                    const set = methods.get(key) ?? new Set<THttpMethod>();
                    set.add(VERB_TO_METHOD[node.expression.name.text]);
                    methods.set(key, set);
                }
            }
            const key = endpointKeyOf(node);
            if (key !== null && !recognised.has(node)) {
                // The call expression is visited before its argument, so a recognised use is already in the set.
                const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
                const list = unresolvedUses.get(key) ?? [];
                list.push(`${relative(srcDir, file).replace(/\\/g, '/')}:${line}`);
                unresolvedUses.set(key, list);
            }
            ts.forEachChild(node, visit);
        };
        visit(sourceFile);
    }

    return { methods, unresolvedUses };
}
