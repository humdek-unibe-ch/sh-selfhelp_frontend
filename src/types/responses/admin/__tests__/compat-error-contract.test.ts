/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Frontend <-> shared compatibility-error CONTRACT / drift guard (#51).
 *
 * The standardized compatibility-error shape is a cross-repo contract:
 *   - backend `App\Plugin\Registry\Unified\CompatibilityError::toArray()`
 *     (the single object used by BOTH core update preflight AND plugin
 *     install/update),
 *   - shared `@selfhelp/shared` `IUpdatePreflightCheck` compatibility fields
 *     (the canonical TS contract — source of truth),
 *   - the frontend's LOCAL `IPluginCompatibilityError` + `IUpdatePreflightCheck`
 *     (this repo) that the admin UI renders.
 *
 * They MUST stay aligned: core preflight and plugin install/update have to show
 * the operator the SAME fields (which component blocks which target, and the
 * range it requires). This test pins the canonical field set and fails fast if
 * the frontend types drift from it.
 *
 * Why a runtime key-set assertion (not a pure type import from `@selfhelp/shared`):
 * the compat-error fields live in `@selfhelp/shared@1.4.0`, which is not yet
 * published — the installed dist is 1.3.2 and predates them. Importing the shared
 * type here would not type-check in CI. Instead we pin the canonical set the
 * backend `CompatibilityError::toArray()` emits and the shared 1.4.x
 * `IUpdatePreflightCheck` declares; a typed object literal makes `tsc` reject any
 * frontend rename/removal, and the key-set assertion documents the contract.
 */
import { describe, it, expect } from 'vitest';
import type { IPluginCompatibilityError } from '../plugins.types';
import type { IUpdatePreflightCheck } from '../system.types';

/**
 * The exact keys `CompatibilityError::toArray()` emits (backend) and the
 * frontend `IPluginCompatibilityError` mirrors. Snake_case is the wire contract.
 */
const CANONICAL_COMPAT_ERROR_KEYS = [
    'blocking',
    'component',
    'component_id',
    'current_version',
    'message',
    'required_range',
    'target_version',
] as const;

/**
 * The standardized compatibility fields the shared `IUpdatePreflightCheck`
 * carries so a core-update preflight check can render the SAME compat info as a
 * plugin install/update rejection. (`code`/`severity`/`message` are the generic
 * check fields; `pinned` is the plugin-specific affordance.)
 */
const CANONICAL_PREFLIGHT_COMPAT_FIELDS = [
    'blocking',
    'component',
    'component_id',
    'current_version',
    'required_range',
    'target_version',
] as const;

describe('compatibility-error contract (frontend mirrors shared / backend)', () => {
    it('IPluginCompatibilityError carries exactly the canonical compat-error keys', () => {
        // A fully-populated literal: `tsc` rejects any added/renamed/removed field,
        // so this object can only compile while the local type matches the contract.
        const error: IPluginCompatibilityError = {
            component: 'plugin',
            component_id: 'sh2-shp-survey-js',
            current_version: '0.1.0',
            target_version: '0.2.0',
            required_range: '>=0.1.0 <0.2.0',
            blocking: true,
            message: 'Plugin sh2-shp-survey-js is not compatible with SelfHelp 0.2.0.',
        };

        expect(Object.keys(error).sort()).toEqual([...CANONICAL_COMPAT_ERROR_KEYS]);
    });

    it('IUpdatePreflightCheck carries the standardized compat fields (+ pinned) so core preflight matches plugin install', () => {
        const check: IUpdatePreflightCheck = {
            code: 'plugin_compatibility',
            severity: 'error',
            message: 'Plugin sh2-shp-survey-js requires SelfHelp >=0.1.0 <0.2.0.',
            component: 'plugin',
            component_id: 'sh2-shp-survey-js',
            current_version: '0.1.0',
            target_version: '0.2.0',
            required_range: '>=0.1.0 <0.2.0',
            blocking: true,
            pinned: true,
        };

        for (const field of CANONICAL_PREFLIGHT_COMPAT_FIELDS) {
            expect(check).toHaveProperty(field);
        }
        // The plugin-specific affordance the core preflight surfaces for a pinned blocker.
        expect(check).toHaveProperty('pinned');
    });

    it('a plugin compatibility error projects onto a preflight check (same compat shape)', () => {
        // Type-level bridge: every standardized field of a plugin compatibility
        // error is also a field of a preflight check, so the two installers render
        // the SAME compat info. This only compiles while both types agree.
        const error: IPluginCompatibilityError = {
            component: 'plugin',
            component_id: 'sh2-shp-survey-js',
            current_version: '0.1.0',
            target_version: '0.2.0',
            required_range: '>=0.1.0 <0.2.0',
            blocking: true,
            message: 'incompatible',
        };
        const asCheck: Pick<
            IUpdatePreflightCheck,
            'component' | 'component_id' | 'current_version' | 'target_version' | 'required_range' | 'blocking' | 'message'
        > = {
            component: error.component,
            component_id: error.component_id,
            // `IPluginCompatibilityError` allows null for the version fields (the
            // backend emits null when there is no current/target); a preflight
            // check omits them instead, so null projects to undefined.
            current_version: error.current_version ?? undefined,
            target_version: error.target_version ?? undefined,
            required_range: error.required_range,
            blocking: error.blocking,
            message: error.message,
        };
        expect(asCheck.component_id).toBe('sh2-shp-survey-js');
        expect(asCheck.required_range).toBe('>=0.1.0 <0.2.0');
    });
});
