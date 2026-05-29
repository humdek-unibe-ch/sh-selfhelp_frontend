/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * `PluginVersionMismatchBanner` — admin-visible alert that surfaces
 * silent plugin runtime failures.
 *
 * The host plugin runtime drops plugins on the floor when:
 *
 *   * `pluginApiVersion` declared in the manifest does not satisfy
 *     the host SDK `PLUGIN_API_VERSION`.
 *   * The plugin runtime bundle reports a different `version` than
 *     the manifest entry.
 *   * The ESM runtime bundle threw on import / threw on `register()` /
 *     does not export `register()` at all.
 *   * Style registry extension failed (style id conflict with another
 *     plugin or a core style).
 *
 * Each of these conditions used to just log to the browser console.
 * That meant admins saw "the plugin is installed" in the Plugins
 * table but the styles / admin pages / menu items never appeared in
 * the UI. This banner makes the failure visible and gives the admin
 * a concrete instruction to fix it.
 *
 * Mirror component lives at `mobile/src/components/plugin-runtime/
 * PluginVersionMismatchBanner.tsx` for the Expo app.
 */

import { Alert, List, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { usePluginVersionWarnings } from '../../../frontend/plugin-runtime/PluginsProvider';
import type { IPluginVersionWarning } from '../../../frontend/plugin-runtime/PluginRuntime';

function describeKind(kind: IPluginVersionWarning['kind']): { title: string; hint: string } {
    switch (kind) {
        case 'incompatibleApiVersion':
            return {
                title: 'Plugin API mismatch',
                hint: 'Upgrade the plugin to a release whose pluginApiVersion satisfies the host SDK, or roll the host SDK back.',
            };
        case 'registrationMismatch':
            return {
                title: 'Installed runtime bundle is out of sync',
                hint: 'Reinstall or republish the plugin so the manifest version and the shipped runtime bundle report the same version.',
            };
        case 'importFailed':
            return {
                title: 'Plugin runtime import failed',
                hint: 'Check the plugin runtime URL or local dev server. For installed archives, reinstall or repair the plugin so its published runtime artifacts are present.',
            };
        case 'registerThrew':
            return {
                title: 'Plugin register() threw',
                hint: 'The plugin code crashed during register(). Check the browser console for the stack trace and report it to the plugin author.',
            };
        case 'styleRegistryFailed':
            return {
                title: 'Plugin style conflict',
                hint: 'Two plugins (or a plugin + core) declare the same style id. Disable the conflicting plugin or rename its styles.',
            };
        case 'missingRegister':
            return {
                title: 'Plugin missing register() export',
                hint: 'The runtime bundle does not look like a SelfHelp plugin. Rebuild and reinstall the plugin archive.',
            };
        default:
            return { title: 'Plugin runtime warning', hint: 'See the browser console for details.' };
    }
}

export function PluginVersionMismatchBanner(): React.ReactElement | null {
    const warnings = usePluginVersionWarnings();
    if (!warnings.length) {
        return null;
    }
    return (
        <Alert color="red" icon={<IconAlertTriangle size={18} />} title={`${warnings.length} plugin${warnings.length === 1 ? '' : 's'} could not be mounted`}>
            <Stack gap="xs">
                <Text size="sm">
                    These plugins are installed in the host database but the host
                    runtime could not load them. Their styles, admin pages, menu
                    items, realtime topics and feature flags are NOT active. Fix
                    each one before relying on the plugin.
                </Text>
                <List size="sm" spacing="xs" withPadding>
                    {warnings.map((w) => {
                        const { title, hint } = describeKind(w.kind);
                        return (
                            <List.Item key={`${w.pluginId}-${w.kind}`}>
                                <Stack gap={2}>
                                    <Text size="sm" fw={600}>
                                        {w.pluginName ?? w.pluginId} — {title}
                                    </Text>
                                    <Text size="xs" c="dimmed">{w.message}</Text>
                                    <Text size="xs">
                                        Expected v{w.expectedVersion}
                                        {w.actualVersion && w.actualVersion !== w.expectedVersion ? ` · loaded v${w.actualVersion}` : ''}
                                        {w.declaredApiVersion ? ` · pluginApi ${w.declaredApiVersion}` : ''}
                                        {w.hostApiVersion ? ` · host SDK ${w.hostApiVersion}` : ''}
                                    </Text>
                                    <Text size="xs" c="orange">{hint}</Text>
                                </Stack>
                            </List.Item>
                        );
                    })}
                </List>
            </Stack>
        </Alert>
    );
}
