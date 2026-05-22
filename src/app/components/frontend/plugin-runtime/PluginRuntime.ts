/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `PluginRuntime` — the client-side host that loads plugin packages,
 * calls their exported `register()` function, and merges their
 * contributions (styles, admin pages, menu items, health checks,
 * feature flags) into the shared registries.
 *
 * Contract:
 *   - Each plugin npm package exports a `register(api)` function.
 *   - The runtime resolves the package name from the live plugin
 *     manifest (`/cms-api/v1/plugins/manifest`) and dynamically imports
 *     it via `import(/* webpackIgnore: true *\/ packageName)`. Plugin
 *     packages are bundled separately under `node_modules` and listed
 *     in `selfhelp.plugins.lock.json` so production deployments stay
 *     deterministic.
 *   - Style contributions are registered into the shared
 *     `extendStyleRegistry()` so `BasicStyle` (web) and
 *     `BasicMobileStyle` (RN) can dispatch on plugin styles without
 *     any extra config.
 *   - The runtime is *idempotent*: calling `boot()` more than once with
 *     the same manifest is a no-op; calling it with a different
 *     manifest disposes the previous registrations first.
 */

import type {
    IAdminPageDefinition,
    IMenuItemDefinition,
    IPluginApi,
    IPluginFeatureFlag,
    IPluginHealthCheck,
    IPluginRealtimeTopic,
    IPluginRegistration,
    IStyleDefinition,
} from '@selfhelp/shared/plugin-sdk';
import { PLUGIN_API_VERSION, isPluginApiCompatible } from '@selfhelp/shared/plugin-sdk';
import {
    extendStyleRegistry,
    type IStyleRegistryEntry,
} from '@selfhelp/shared/registry';

/**
 * Plugin entry as it appears on the host manifest.
 *
 * Mirrors the JSON returned by `GET /cms-api/v1/plugins/manifest`.
 */
export interface IPluginManifestEntry {
    pluginId: string;
    name: string;
    version: string;
    pluginApiVersion: string;
    frontendPackage?: string | null;
    frontendPackageVersion?: string | null;
    enabled: boolean;
    trustLevel?: string;
    capabilities?: string[];
    featureFlags?: Record<string, boolean>;
}

export interface IPluginManifest {
    cmsVersion: string;
    sdkApiVersion: string;
    plugins: IPluginManifestEntry[];
}

/**
 * Component renderer registered by a plugin. Same signature as the
 * core style components: `(style, parentActive?, childIndex?, parentColor?) → JSX`.
 */
export type TPluginStyleComponent = (props: {
    style: unknown;
    parentActive?: number;
    childIndex?: number;
    parentColor?: string;
}) => unknown;

interface IRegisteredPlugin {
    id: string;
    version: string;
    pluginApiVersion: string;
    /** Disposer returned by `extendStyleRegistry`. */
    disposeRegistry: () => void;
    /** Mounted style components keyed by style name. */
    styleComponents: Record<string, TPluginStyleComponent>;
    /** Admin pages, indexed by `slug`. */
    adminPages: IAdminPageDefinition[];
    /** Menu items the plugin contributes. */
    menuItems: IMenuItemDefinition[];
    /** Health checks the plugin exposes. */
    healthChecks: IPluginHealthCheck[];
    /** Feature flags the plugin declares. */
    featureFlags: IPluginFeatureFlag[];
    /** Realtime topics the plugin publishes / subscribes to. */
    realtimeTopics: IPluginRealtimeTopic[];
    /** Last-known runtime feature-flag values, supplied by the host. */
    featureFlagValues: Record<string, boolean>;
}

export interface IPluginRuntimeSnapshot {
    plugins: IRegisteredPlugin[];
    styleComponents: Record<string, TPluginStyleComponent>;
    adminPages: Array<IAdminPageDefinition & { pluginId: string }>;
    menuItems: Array<IMenuItemDefinition & { pluginId: string }>;
    healthChecks: Array<IPluginHealthCheck & { pluginId: string }>;
    featureFlags: Array<IPluginFeatureFlag & { pluginId: string; value: boolean }>;
}

export interface IPluginRuntimeOptions {
    /**
     * Override the dynamic import. Tests inject a stub here; production
     * leaves this `undefined` so the runtime uses the actual
     * `import()` expression.
     */
    importPlugin?: (packageName: string) => Promise<{
        register?: (api: IPluginApi) => IPluginRegistration | Promise<IPluginRegistration>;
        default?: { register?: (api: IPluginApi) => IPluginRegistration | Promise<IPluginRegistration> };
    }>;
    /** Optional logger injected by the host. */
    logger?: {
        debug(message: string, context?: Record<string, unknown>): void;
        info(message: string, context?: Record<string, unknown>): void;
        warn(message: string, context?: Record<string, unknown>): void;
        error(message: string, context?: Record<string, unknown>): void;
    };
}

const DEFAULT_LOGGER = {
    debug: (message: string, context?: Record<string, unknown>) => {
        if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.debug('[plugin-runtime]', message, context);
        }
    },
    info: (message: string, context?: Record<string, unknown>) => {
        // eslint-disable-next-line no-console
        console.info('[plugin-runtime]', message, context);
    },
    warn: (message: string, context?: Record<string, unknown>) => {
        // eslint-disable-next-line no-console
        console.warn('[plugin-runtime]', message, context);
    },
    error: (message: string, context?: Record<string, unknown>) => {
        // eslint-disable-next-line no-console
        console.error('[plugin-runtime]', message, context);
    },
};

export class PluginRuntime {
    private readonly logger: NonNullable<IPluginRuntimeOptions['logger']>;
    private readonly importPlugin: (packageName: string) => Promise<unknown>;
    private snapshot: IPluginRuntimeSnapshot = {
        plugins: [],
        styleComponents: {},
        adminPages: [],
        menuItems: [],
        healthChecks: [],
        featureFlags: [],
    };
    private lastManifestSignature: string | null = null;
    private booting: Promise<IPluginRuntimeSnapshot> | null = null;

    constructor(options: IPluginRuntimeOptions = {}) {
        this.logger = options.logger ?? DEFAULT_LOGGER;
        this.importPlugin = options.importPlugin ?? ((packageName: string) =>
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            (Function('p', 'return import(/* webpackIgnore: true */ p)') as (p: string) => Promise<unknown>)(packageName));
    }

    /**
     * Boot the runtime against a host manifest. Idempotent on signature
     * collision.
     */
    async boot(manifest: IPluginManifest): Promise<IPluginRuntimeSnapshot> {
        const signature = JSON.stringify(manifest.plugins.map((p) => [
            p.pluginId,
            p.version,
            p.enabled,
            p.frontendPackage ?? '',
            p.frontendPackageVersion ?? '',
        ]));
        if (signature === this.lastManifestSignature) {
            return this.snapshot;
        }
        // Serialize concurrent boots; only the first one runs to completion.
        if (this.booting) {
            await this.booting;
        }
        this.booting = this.doBoot(manifest, signature);
        try {
            return await this.booting;
        } finally {
            this.booting = null;
        }
    }

    /** Convenience read-only view of the current snapshot. */
    getSnapshot(): IPluginRuntimeSnapshot {
        return this.snapshot;
    }

    /** Live feature-flag check used by `BasicStyle`/admin shell. */
    isFeatureEnabled(pluginId: string, flagKey: string): boolean {
        const plugin = this.snapshot.plugins.find((p) => p.id === pluginId);
        if (!plugin) {
            return false;
        }
        if (Object.prototype.hasOwnProperty.call(plugin.featureFlagValues, flagKey)) {
            return Boolean(plugin.featureFlagValues[flagKey]);
        }
        const declared = plugin.featureFlags.find((f) => f.key === flagKey);
        return Boolean(declared?.defaultEnabled);
    }

    /** Update flag values without re-importing the plugin packages. */
    updateFeatureFlags(pluginId: string, values: Record<string, boolean>): void {
        const plugin = this.snapshot.plugins.find((p) => p.id === pluginId);
        if (!plugin) {
            return;
        }
        plugin.featureFlagValues = { ...plugin.featureFlagValues, ...values };
        this.snapshot = {
            ...this.snapshot,
            featureFlags: this.snapshot.featureFlags.map((entry) => {
                if (entry.pluginId !== pluginId) return entry;
                return {
                    ...entry,
                    value: this.isFeatureEnabled(pluginId, entry.key),
                };
            }),
        };
    }

    private async doBoot(manifest: IPluginManifest, signature: string): Promise<IPluginRuntimeSnapshot> {
        this.logger.debug('Booting plugin runtime', { count: manifest.plugins.length });
        for (const plugin of this.snapshot.plugins) {
            try {
                plugin.disposeRegistry();
            } catch (error) {
                this.logger.warn('Plugin registry disposal failed', {
                    pluginId: plugin.id,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        this.snapshot = {
            plugins: [],
            styleComponents: {},
            adminPages: [],
            menuItems: [],
            healthChecks: [],
            featureFlags: [],
        };

        const enabled = manifest.plugins.filter((p) => p.enabled && p.frontendPackage);
        for (const entry of enabled) {
            if (!isPluginApiCompatible(entry.pluginApiVersion, PLUGIN_API_VERSION)) {
                this.logger.warn('Skipping plugin: incompatible pluginApiVersion', {
                    pluginId: entry.pluginId,
                    declared: entry.pluginApiVersion,
                    hostSdk: PLUGIN_API_VERSION,
                });
                continue;
            }
            await this.registerOne(entry);
        }

        this.lastManifestSignature = signature;
        return this.snapshot;
    }

    private async registerOne(entry: IPluginManifestEntry): Promise<void> {
        const packageName = entry.frontendPackage as string;
        let mod: { register?: (api: IPluginApi) => IPluginRegistration | Promise<IPluginRegistration>;
                    default?: { register?: (api: IPluginApi) => IPluginRegistration | Promise<IPluginRegistration> } };
        try {
            mod = (await this.importPlugin(packageName)) as typeof mod;
        } catch (error) {
            this.logger.error('Plugin import failed', {
                pluginId: entry.pluginId,
                packageName,
                error: error instanceof Error ? error.message : String(error),
            });
            return;
        }

        const register = mod.register ?? mod.default?.register;
        if (typeof register !== 'function') {
            this.logger.warn('Plugin package does not export register()', {
                pluginId: entry.pluginId,
                packageName,
            });
            return;
        }

        const api = this.buildPluginApi(entry);
        let registration: IPluginRegistration;
        try {
            registration = await register(api);
        } catch (error) {
            this.logger.error('Plugin register() threw', {
                pluginId: entry.pluginId,
                error: error instanceof Error ? error.message : String(error),
            });
            return;
        }

        if (registration.id !== entry.pluginId || registration.version !== entry.version) {
            this.logger.warn('Plugin registration mismatch — refusing to apply', {
                pluginId: entry.pluginId,
                declaredId: registration.id,
                declaredVersion: registration.version,
                expectedVersion: entry.version,
            });
            return;
        }

        const styleEntries: Record<string, IStyleRegistryEntry> = {};
        const styleComponents: Record<string, TPluginStyleComponent> = {};
        for (const def of registration.styles ?? []) {
            styleEntries[def.name] = {
                description: def.description,
                category: def.category,
                frontendOnly: true,
                canHaveChildren: def.canHaveChildren,
            };
            styleComponents[def.name] = def.component as unknown as TPluginStyleComponent;
        }

        let disposeRegistry: () => void = () => undefined;
        if (Object.keys(styleEntries).length > 0) {
            try {
                disposeRegistry = extendStyleRegistry(styleEntries, {
                    pluginId: entry.pluginId,
                    pluginVersion: entry.version,
                });
            } catch (error) {
                this.logger.error('Plugin style registration failed', {
                    pluginId: entry.pluginId,
                    error: error instanceof Error ? error.message : String(error),
                });
                return;
            }
        }

        const registered: IRegisteredPlugin = {
            id: entry.pluginId,
            version: entry.version,
            pluginApiVersion: entry.pluginApiVersion,
            disposeRegistry,
            styleComponents,
            adminPages: registration.adminPages ?? [],
            menuItems: registration.menuItems ?? [],
            healthChecks: registration.healthChecks ?? [],
            featureFlags: registration.featureFlags ?? [],
            realtimeTopics: registration.realtimeTopics ?? [],
            featureFlagValues: entry.featureFlags ?? {},
        };

        this.snapshot = {
            plugins: [...this.snapshot.plugins, registered],
            styleComponents: { ...this.snapshot.styleComponents, ...styleComponents },
            adminPages: [
                ...this.snapshot.adminPages,
                ...registered.adminPages.map((page) => ({ ...page, pluginId: entry.pluginId })),
            ],
            menuItems: [
                ...this.snapshot.menuItems,
                ...registered.menuItems.map((mi) => ({ ...mi, pluginId: entry.pluginId })),
            ],
            healthChecks: [
                ...this.snapshot.healthChecks,
                ...registered.healthChecks.map((hc) => ({ ...hc, pluginId: entry.pluginId })),
            ],
            featureFlags: [
                ...this.snapshot.featureFlags,
                ...registered.featureFlags.map((flag) => ({
                    ...flag,
                    pluginId: entry.pluginId,
                    value: this.resolveFlagValue(flag, registered.featureFlagValues),
                })),
            ],
        };

        this.logger.info('Plugin registered', {
            pluginId: entry.pluginId,
            version: entry.version,
            styles: Object.keys(styleComponents).length,
            adminPages: registered.adminPages.length,
        });
    }

    private resolveFlagValue(flag: IPluginFeatureFlag, values: Record<string, boolean>): boolean {
        if (Object.prototype.hasOwnProperty.call(values, flag.key)) {
            return Boolean(values[flag.key]);
        }
        return Boolean(flag.defaultEnabled);
    }

    private buildPluginApi(entry: IPluginManifestEntry): IPluginApi {
        return {
            pluginId: entry.pluginId,
            pluginVersion: entry.version,
            isFeatureEnabled: (key: string) => this.isFeatureEnabled(entry.pluginId, key),
            // No realtime publisher on the client; plugins use the host
            // Mercure endpoint via fetch / EventSource. The publisher
            // surface is reserved for backend plugin code.
            realtime: undefined,
            // Plugins that need a rich-text editor will inject their
            // own adapter; the host placeholder throws to encourage
            // explicit wiring.
            richTextEditor: {
                mount() {
                    throw new Error(
                        '[plugin-runtime] Rich-text editor adapter has not been provided by the host yet. Wire one through IPluginApi.richTextEditor.',
                    );
                },
            },
            log: this.logger,
        };
    }
}

let SINGLETON: PluginRuntime | null = null;

export function getPluginRuntime(options?: IPluginRuntimeOptions): PluginRuntime {
    if (SINGLETON === null) {
        SINGLETON = new PluginRuntime(options);
    }
    return SINGLETON;
}

/**
 * Test-only helper. Reset the singleton so subsequent `boot()` calls
 * see a clean state.
 *
 * @internal
 */
export function _resetPluginRuntime(): void {
    SINGLETON = null;
}

export type { IStyleDefinition };
