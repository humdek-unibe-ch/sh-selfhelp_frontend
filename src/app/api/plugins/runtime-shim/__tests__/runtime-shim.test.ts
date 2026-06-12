/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression tests for the plugin runtime-shim generator.
 *
 * Production regression (managed installs): the standalone image prunes
 * `node_modules`, so the route MUST serve shims from the build-time export
 * manifest (`runtime-shim-exports.json`) instead of live-importing the
 * module. A live import in that image fails with
 * "Cannot find package '@selfhelp/shared'" and plugins never load.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const readFileMock = vi.hoisted(() => vi.fn());

vi.mock('node:fs/promises', () => ({
    readFile: readFileMock,
    default: { readFile: readFileMock },
}));

async function loadModule() {
    // Fresh module instance per test so the manifest promise cache resets.
    vi.resetModules();
    return import('../runtime-shim');
}

describe('buildShim', () => {
    it('re-exports named exports and default from the host global stash', async () => {
        readFileMock.mockRejectedValue(new Error('ENOENT'));
        const { buildShim } = await loadModule();

        const code = buildShim('@selfhelp/shared/plugin-sdk', {
            keys: ['definePlugin', 'usePluginRealtime', 'not-a-valid-identifier!'],
            hasDefault: false,
        });

        expect(code).toContain('globalThis["__SELFHELP_RUNTIME__"]');
        expect(code).toContain('["@selfhelp/shared/plugin-sdk"]');
        expect(code).toContain('export const definePlugin = __M["definePlugin"];');
        expect(code).toContain('export const usePluginRealtime = __M["usePluginRealtime"];');
        // Invalid JS identifiers must be dropped, not emitted as broken code.
        expect(code).not.toContain('not-a-valid-identifier!');
        // No real default export -> the module namespace itself is the default.
        expect(code).toContain('export default __M;');
    });

    it('forwards a real default export when the module has one', async () => {
        readFileMock.mockRejectedValue(new Error('ENOENT'));
        const { buildShim } = await loadModule();

        const code = buildShim('react', { keys: ['useState'], hasDefault: true });

        expect(code).toContain('const __default = __M.default !== undefined ? __M.default : __M;');
        expect(code).toContain('export default __default;');
    });
});

describe('buildRuntimeShimResponse', () => {
    beforeEach(() => {
        readFileMock.mockReset();
    });

    it('serves an allowlisted module from the build-time export manifest without importing it', async () => {
        readFileMock.mockResolvedValue(
            JSON.stringify({
                '@selfhelp/shared/plugin-sdk': {
                    keys: ['definePlugin', 'PLUGIN_RUNTIME_SHIM_SPECIFIERS'],
                    hasDefault: false,
                },
            }),
        );
        const { buildRuntimeShimResponse } = await loadModule();

        const res = await buildRuntimeShimResponse(['@selfhelp', 'shared', 'plugin-sdk']);

        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toContain('application/javascript');
        const body = await res.text();
        expect(body).toContain('export const definePlugin = __M["definePlugin"];');
        expect(body).toContain('export const PLUGIN_RUNTIME_SHIM_SPECIFIERS = __M["PLUGIN_RUNTIME_SHIM_SPECIFIERS"];');
        expect(readFileMock).toHaveBeenCalledWith(
            expect.stringContaining('runtime-shim-exports.json'),
            'utf8',
        );
    });

    it('rejects specifiers that are not on the allowlist', async () => {
        readFileMock.mockRejectedValue(new Error('ENOENT'));
        const { buildRuntimeShimResponse } = await loadModule();

        const res = await buildRuntimeShimResponse(['lodash']);

        expect(res.status).toBe(404);
        expect(await res.text()).toContain('not on the allowlist');
    });

    it('returns a JS-comment 500 when neither manifest nor live import resolve the module', async () => {
        // This is the exact failure mode of the pruned standalone image
        // before the manifest existed: allowlisted name, no manifest, and
        // the live import cannot find the package.
        readFileMock.mockRejectedValue(new Error('ENOENT'));
        const { buildRuntimeShimResponse } = await loadModule();

        // Allowlisted specifier, but vitest's module runner cannot resolve
        // bare specifiers through the native-import escape hatch — same
        // resolution failure as the pruned production node_modules.
        const res = await buildRuntimeShimResponse(['@selfhelp', 'shared', 'plugin-sdk']);

        expect(res.status).toBe(500);
        expect(await res.text()).toContain('failed to resolve "@selfhelp/shared/plugin-sdk"');
    });
});
