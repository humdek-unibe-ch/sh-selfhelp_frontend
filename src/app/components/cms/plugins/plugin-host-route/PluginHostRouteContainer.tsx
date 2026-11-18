/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * `PluginHostRouteContainer` — generic shell that resolves a plugin
 * page by `pluginId + slug` from the `PluginRuntime` snapshot and
 * renders it inside the admin shell.
 *
 * When the page cannot be resolved (plugin not installed, slug not
 * contributed, or page registry not yet booted) the container falls
 * back to a helpful empty state rather than throwing — so a stale
 * bookmark does not crash the admin shell.
 *
 * A page that declares a `permission` opens only for users who hold it.
 */

import { Alert, Loader, Stack, Text, Title } from '@mantine/core';
import { usePluginRuntime } from '../../../frontend/plugin-runtime';
import { useAuth } from '../../../../../hooks/useAuth';

interface IPluginHostRouteContainerProps {
    pluginId: string;
    slug: string;
}

export function PluginHostRouteContainer({ pluginId, slug }: IPluginHostRouteContainerProps) {
    const { snapshot, isLoading } = usePluginRuntime();
    const { hasPermission } = useAuth();

    if (isLoading && snapshot.plugins.length === 0) {
        return (
            <Stack align="center" mt="xl">
                <Loader />
                <Text>Loading plugin runtime…</Text>
            </Stack>
        );
    }

    const page = snapshot.adminPages.find((p) => p.pluginId === pluginId && p.slug === slug);

    if (!page) {
        return (
            <Stack gap="md">
                <Title order={3}>Plugin page not available</Title>
                <Alert color="yellow" title="Page not found">
                    The plugin <code>{pluginId}</code> does not register a page at <code>/{slug}</code>, or the plugin is currently disabled.
                </Alert>
            </Stack>
        );
    }

    if (page.permission && !hasPermission(page.permission)) {
        return (
            <Stack gap="md">
                <Title order={3}>No access</Title>
                <Alert color="red" title="Missing permission">
                    You need the <code>{page.permission}</code> permission to open this page. Ask an administrator to add it to one of your roles.
                </Alert>
            </Stack>
        );
    }

    const Component = page.component as React.ComponentType<Record<string, unknown>>;
    return <Component />;
}
