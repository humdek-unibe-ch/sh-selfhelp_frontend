/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `PluginRuntime` — the client-side host that loads plugin ESM
 * bundles at runtime from URLs, calls their exported `register()`
 * function, and merges their contributions (styles, admin pages,
 * menu items, health checks, feature flags, realtime topics) into
 * the shared registries.
 *
 * Contract:
 *   - Each plugin ships a runtime ESM bundle (`plugin.esm.js`) plus
 *     an optional stylesheet (`plugin.css`). Both URLs come from the
 *     host manifest entry (`frontendRuntimeUrl` /
 *     `frontendRuntimeStylesheetUrl`). The runtime injects the
 *     stylesheet with `subresource-integrity` when provided, then
 *     `import()`s the entrypoint and calls the exported `register()`
 *     function.
 *   - No npm package is involved. The host never rebuilds on plugin
 *     publish; everything is fetched from the public URL declared
 *     in `frontendRuntimeUrl`.
 *   - Style contributions are registered into the shared
 *     `extendStyleRegistry()` so `BasicStyle` (web) and
 *     `BasicMobileStyle` (RN) can dispatch on plugin styles without
 *     any extra config.
 *   - The runtime is *idempotent*: calling `boot()` more than once
 *     with the same manifest is a no-op; calling it with a different
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
    IRichTextEditorAdapter,
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
    frontendRuntimeUrl?: string | null;
    frontendRuntimeStylesheetUrl?: string | null;
    frontendRuntimeIntegrity?: string | null;
    frontendRuntimeFormat?: string | null;
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
    /** DOM <link> node injected for this plugin's stylesheet (if any). */
    stylesheetNode: HTMLLinkElement | null;
}

/**
 * Reason a plugin entry was skipped at boot time. Surfaced on the
 * snapshot so the admin UI can warn the operator that the runtime
 * silently dropped a plugin instead of mounting it.
 */
export type TPluginVersionWarningKind =
    | 'incompatibleApiVersion'
    | 'registrationMismatch'
    | 'importFailed'
    | 'registerThrew'
    | 'styleRegistryFailed'
    | 'missingRegister'
    | 'missingRuntimeUrl';

export interface IPluginVersionWarning {
    pluginId: string;
    pluginName?: string;
    kind: TPluginVersionWarningKind;
    /** Version the host expected (from the manifest). */
    expectedVersion: string;
    /** Version the plugin reported (when known). */
    actualVersion?: string;
    /** API version reported by the plugin manifest entry. */
    declaredApiVersion?: string;
    /** API version the host SDK ships with. */
    hostApiVersion?: string;
    message: string;
}

export interface IPluginRuntimeSnapshot {
    plugins: IRegisteredPlugin[];
    styleComponents: Record<string, TPluginStyleComponent>;
    adminPages: Array<IAdminPageDefinition & { pluginId: string }>;
    menuItems: Array<IMenuItemDefinition & { pluginId: string }>;
    healthChecks: Array<IPluginHealthCheck & { pluginId: string }>;
    featureFlags: Array<IPluginFeatureFlag & { pluginId: string; value: boolean }>;
    /**
     * Plugins the runtime tried to mount but had to drop. Each entry
     * tells the admin which plugin failed and why. Empty in a healthy
     * deployment.
     */
    versionWarnings: IPluginVersionWarning[];
}

export interface IPluginRuntimeOptions {
    /**
     * Override the dynamic import. Tests inject a stub here; production
     * leaves this `undefined` so the runtime uses the actual
     * `import(<url>)` expression.
     */
    importPlugin?: (runtimeUrl: string) => Promise<{
        register?: (api: IPluginApi) => IPluginRegistration | Promise<IPluginRegistration>;
        default?: { register?: (api: IPluginApi) => IPluginRegistration | Promise<IPluginRegistration> };
    }>;
    /**
     * Override the stylesheet injector. Tests inject a stub; production
     * leaves this undefined so the runtime appends a `<link rel="stylesheet">`
     * to `document.head`.
     */
    injectStylesheet?: (href: string, integrity?: string | null) => HTMLLinkElement | null;
    /** Optional logger injected by the host. */
    logger?: {
        debug(message: string, context?: Record<string, unknown>): void;
        info(message: string, context?: Record<string, unknown>): void;
        warn(message: string, context?: Record<string, unknown>): void;
        error(message: string, context?: Record<string, unknown>): void;
    };
    /**
     * Rich-text editor adapter injected by the host. Plugins that mount
     * a rich-text editor receive this through `IPluginApi.richTextEditor`.
     * When `undefined`, the runtime installs a soft no-op stub that
     * logs once instead of throwing — this is fine for plugins that
     * never call `richTextEditor.mount`, but plugins that DO rely on
     * it will silently fall back. Wire a real adapter from the host's
     * editor module before booting the runtime.
     */
    richTextEditor?: IRichTextEditorAdapter;
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

/**
 * Default stylesheet injector. Creates a `<link rel="stylesheet">`
 * element with optional `subresource-integrity` and `crossOrigin`
 * attributes and appends it to `document.head`. Returns the node so
 * the runtime can remove it when the plugin is disposed. In
 * non-browser test environments where `document` is undefined this
 * silently returns `null`.
 */
function defaultInjectStylesheet(href: string, integrity?: string | null): HTMLLinkElement | null {
    if (typeof document === 'undefined') {
        return null;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    if (integrity && integrity !== '') {
        link.integrity = integrity;
        link.crossOrigin = 'anonymous';
    }
    link.dataset.pluginRuntime = '1';
    document.head.appendChild(link);
    return link;
}

/**
 * Soft no-op rich-text adapter. Plugins that don't use rich text never
 * touch it; plugins that DO get a friendly warning the first time
 * they try to mount instead of a hard exception. Tests + production
 * boot wire a real adapter through `IPluginRuntimeOptions.richTextEditor`.
 */
function createStubRichTextAdapter(logger: NonNullable<IPluginRuntimeOptions['logger']>): IRichTextEditorAdapter {
    let warned = false;
    return {
        mount() {
            if (!warned) {
                logger.warn(
                    'Plugin attempted to mount the rich-text editor adapter, but the host has not provided one. ' +
                    'Wire IPluginRuntimeOptions.richTextEditor in the host before initialising the runtime.',
                );
                warned = true;
            }
            return {
                setValue() {
                    /* no-op stub */
                },
                destroy() {
                    /* no-op stub */
                },
            };
        },
    };
}

export class PluginRuntime {
    private readonly logger: NonNullable<IPluginRuntimeOptions['logger']>;
    private readonly importPlugin: (runtimeUrl: string) => Promise<unknown>;
    private readonly injectStylesheet: (href: string, integrity?: string | null) => HTMLLinkElement | null;
    private readonly richTextEditor: IRichTextEditorAdapter;
    private snapshot: IPluginRuntimeSnapshot = {
        plugins: [],
        styleComponents: {},
        adminPages: [],
        menuItems: [],
        healthChecks: [],
        featureFlags: [],
        versionWarnings: [],
    };
    private pendingWarnings: IPluginVersionWarning[] = [];
    private lastManifestSignature: string | null = null;
    private booting: Promise<IPluginRuntimeSnapshot> | null = null;

    constructor(options: IPluginRuntimeOptions = {}) {
        this.logger = options.logger ?? DEFAULT_LOGGER;
        this.importPlugin = options.importPlugin ?? ((runtimeUrl: string) =>
            // eslint-disable-next-line @typescript-eslint/no-implied-eval
            (Function('p', 'return import(/* webpackIgnore: true */ p)') as (p: string) => Promise<unknown>)(runtimeUrl));
        this.injectStylesheet = options.injectStylesheet ?? defaultInjectStylesheet;
        this.richTextEditor = options.richTextEditor ?? createStubRichTextAdapter(this.logger);
    }

    /**
     * Late-bind the rich-text adapter from the host. Useful when the
     * editor module is code-split and only loaded for admin sessions.
     * The next plugin `boot()` picks up the new adapter for any
     * registrations that mount editor instances.
     */
    setRichTextEditor(adapter: IRichTextEditorAdapter): void {
        (this as unknown as { richTextEditor: IRichTextEditorAdapter }).richTextEditor = adapter;
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
            p.frontendRuntimeUrl ?? '',
            p.frontendRuntimeStylesheetUrl ?? '',
            p.frontendRuntimeIntegrity ?? '',
        ]));
        if (signature === this.lastManifestSignature) {
            return this.snapshot;
        }
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
            if (plugin.stylesheetNode && plugin.stylesheetNode.parentNode) {
                plugin.stylesheetNode.parentNode.removeChild(plugin.stylesheetNode);
            }
        }
        this.snapshot = {
            plugins: [],
            styleComponents: {},
            adminPages: [],
            menuItems: [],
            healthChecks: [],
            featureFlags: [],
            versionWarnings: [],
        };
        this.pendingWarnings = [];

        const enabled = manifest.plugins.filter((p) => p.enabled);
        for (const entry of enabled) {
            if (!isPluginApiCompatible(entry.pluginApiVersion, PLUGIN_API_VERSION)) {
                this.logger.warn('Skipping plugin: incompatible pluginApiVersion', {
                    pluginId: entry.pluginId,
                    declared: entry.pluginApiVersion,
                    hostSdk: PLUGIN_API_VERSION,
                });
                this.recordWarning({
                    pluginId: entry.pluginId,
                    pluginName: entry.name,
                    kind: 'incompatibleApiVersion',
                    expectedVersion: entry.version,
                    declaredApiVersion: entry.pluginApiVersion,
                    hostApiVersion: PLUGIN_API_VERSION,
                    message: `Plugin "${entry.name ?? entry.pluginId}" declares pluginApiVersion ${entry.pluginApiVersion}, but the host SDK is ${PLUGIN_API_VERSION}. The plugin was not loaded — update the plugin or the host to a matching API version.`,
                });
                continue;
            }
            await this.registerOne(entry);
        }

        this.snapshot = {
            ...this.snapshot,
            versionWarnings: [...this.pendingWarnings],
        };
        this.lastManifestSignature = signature;
        return this.snapshot;
    }

    private recordWarning(warning: IPluginVersionWarning): void {
        this.pendingWarnings.push(warning);
    }

    private async registerOne(entry: IPluginManifestEntry): Promise<void> {
        const runtimeUrl = entry.frontendRuntimeUrl;
        if (!runtimeUrl || runtimeUrl === '') {
            this.logger.warn('Skipping plugin: no frontendRuntimeUrl', {
                pluginId: entry.pluginId,
            });
            this.recordWarning({
                pluginId: entry.pluginId,
                pluginName: entry.name,
                kind: 'missingRuntimeUrl',
                expectedVersion: entry.version,
                message: `Plugin "${entry.name ?? entry.pluginId}" v${entry.version}: manifest entry has no frontendRuntimeUrl. Skipping.`,
            });
            return;
        }

        let stylesheetNode: HTMLLinkElement | null = null;
        if (entry.frontendRuntimeStylesheetUrl) {
            stylesheetNode = this.injectStylesheet(
                entry.frontendRuntimeStylesheetUrl,
                entry.frontendRuntimeIntegrity ?? null,
            );
        }

        let mod: { register?: (api: IPluginApi) => IPluginRegistration | Promise<IPluginRegistration>;
                    default?: { register?: (api: IPluginApi) => IPluginRegistration | Promise<IPluginRegistration> } };
        try {
            mod = (await this.importPlugin(runtimeUrl)) as typeof mod;
        } catch (error) {
            this.logger.error('Plugin import failed', {
                pluginId: entry.pluginId,
                runtimeUrl,
                error: error instanceof Error ? error.message : String(error),
            });
            this.recordWarning({
                pluginId: entry.pluginId,
                pluginName: entry.name,
                kind: 'importFailed',
                expectedVersion: entry.version,
                message: `Plugin "${entry.name ?? entry.pluginId}" v${entry.version}: import of "${runtimeUrl}" failed (${error instanceof Error ? error.message : String(error)}). Verify the URL is reachable and serves a valid ESM module.`,
            });
            if (stylesheetNode && stylesheetNode.parentNode) {
                stylesheetNode.parentNode.removeChild(stylesheetNode);
            }
            return;
        }

        const register = mod.register ?? mod.default?.register;
        if (typeof register !== 'function') {
            this.logger.warn('Plugin package does not export register()', {
                pluginId: entry.pluginId,
                runtimeUrl,
            });
            this.recordWarning({
                pluginId: entry.pluginId,
                pluginName: entry.name,
                kind: 'missingRegister',
                expectedVersion: entry.version,
                message: `Plugin "${entry.name ?? entry.pluginId}" v${entry.version}: runtime bundle at "${runtimeUrl}" does not export a register() function.`,
            });
            if (stylesheetNode && stylesheetNode.parentNode) {
                stylesheetNode.parentNode.removeChild(stylesheetNode);
            }
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
            this.recordWarning({
                pluginId: entry.pluginId,
                pluginName: entry.name,
                kind: 'registerThrew',
                expectedVersion: entry.version,
                message: `Plugin "${entry.name ?? entry.pluginId}" v${entry.version}: register() threw (${error instanceof Error ? error.message : String(error)}). The plugin was not mounted.`,
            });
            if (stylesheetNode && stylesheetNode.parentNode) {
                stylesheetNode.parentNode.removeChild(stylesheetNode);
            }
            return;
        }

        if (registration.id !== entry.pluginId || registration.version !== entry.version) {
            this.logger.warn('Plugin registration mismatch — refusing to apply', {
                pluginId: entry.pluginId,
                declaredId: registration.id,
                declaredVersion: registration.version,
                expectedVersion: entry.version,
            });
            this.recordWarning({
                pluginId: entry.pluginId,
                pluginName: entry.name,
                kind: 'registrationMismatch',
                expectedVersion: entry.version,
                actualVersion: registration.version,
                message: `Plugin "${entry.name ?? entry.pluginId}": host expected v${entry.version} but the runtime bundle reports v${registration.version}. The publisher\'s archive is out of sync with the registry entry.`,
            });
            if (stylesheetNode && stylesheetNode.parentNode) {
                stylesheetNode.parentNode.removeChild(stylesheetNode);
            }
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
                this.recordWarning({
                    pluginId: entry.pluginId,
                    pluginName: entry.name,
                    kind: 'styleRegistryFailed',
                    expectedVersion: entry.version,
                    message: `Plugin "${entry.name ?? entry.pluginId}" v${entry.version}: style registry extension failed (${error instanceof Error ? error.message : String(error)}). Plugin styles may already be claimed by another plugin.`,
                });
                if (stylesheetNode && stylesheetNode.parentNode) {
                    stylesheetNode.parentNode.removeChild(stylesheetNode);
                }
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
            stylesheetNode,
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
            versionWarnings: this.snapshot.versionWarnings,
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
            // Rich-text adapter is injected by the host through
            // `IPluginRuntimeOptions.richTextEditor` (or `setRichTextEditor`).
            richTextEditor: this.richTextEditor,
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
