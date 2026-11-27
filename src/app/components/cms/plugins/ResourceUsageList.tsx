/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Shared where-used list for a plugin item (C7 / C11). Shown from plugin
 * admin UIs and offered on `IPluginApi.ui.ResourceUsageList` for delete
 * warnings. Pages link to the page editor; actions link to the actions screen.
 */
import { useQuery } from '@tanstack/react-query';
import { Alert, Anchor, Loader, Stack, Text } from '@mantine/core';
import type { IResourceUsage } from '@selfhelp/shared/plugin-sdk';
import { AdminPluginApi } from '../../../../api/admin/plugins.api';
import { getApiErrorText } from '../../../../utils/mutation-error-handler';

export interface IResourceUsageListProps {
    type: string;
    id: number;
    /** When true, show a warning Alert suitable before a delete. */
    warnBeforeDelete?: boolean;
}

function pageLabel(page: IResourceUsage['pages'][number]): string {
    return page.title?.trim() ? page.title : page.keyword;
}

function draftPublishedFlags(page: IResourceUsage['pages'][number]): string {
    const parts: string[] = [];
    if (page.draft_uses) {
        parts.push('draft');
    }
    if (page.published_uses) {
        parts.push('published');
    }
    return parts.length > 0 ? ` (${parts.join(', ')})` : '';
}

export function ResourceUsageList({ type, id, warnBeforeDelete = false }: IResourceUsageListProps) {
    const usageQuery = useQuery({
        queryKey: ['admin-resource-usage', type, id],
        queryFn: () => AdminPluginApi.getResourceUsage(type, id),
    });

    if (usageQuery.isLoading) {
        return <Loader size="sm" aria-label="Loading resource usage" />;
    }
    if (usageQuery.error) {
        return (
            <Alert color="red">
                {getApiErrorText(usageQuery.error) || 'Could not load where this item is used.'}
            </Alert>
        );
    }
    const usage = usageQuery.data;
    if (!usage) {
        return null;
    }

    const totalVisible = usage.pages.length + usage.actions.length;
    const showWarning = warnBeforeDelete && (totalVisible > 0 || usage.hidden_count > 0);

    return (
        <Stack gap="sm" data-testid="resource-usage-list">
            {showWarning && (
                <Alert color="orange" title="This item is still in use">
                    Removing it may break the pages and actions listed below.
                </Alert>
            )}
            {usage.pages.length > 0 && (
                <Stack gap={4}>
                    <Text size="sm" fw={600}>
                        Pages
                    </Text>
                    {usage.pages.map((page) => (
                        <Text key={page.id} size="sm">
                            <Anchor href={`/admin/pages/${encodeURIComponent(page.keyword)}`}>
                                {pageLabel(page)}
                            </Anchor>
                            {draftPublishedFlags(page)}
                        </Text>
                    ))}
                </Stack>
            )}
            {usage.actions.length > 0 && (
                <Stack gap={4}>
                    <Text size="sm" fw={600}>
                        Actions
                    </Text>
                    {usage.actions.map((action) => (
                        <Text key={action.id} size="sm">
                            <Anchor href="/admin/actions">{action.name}</Anchor>
                        </Text>
                    ))}
                </Stack>
            )}
            {usage.hidden_count > 0 && (
                <Text size="sm" c="dimmed">
                    used in {usage.hidden_count} more place{usage.hidden_count === 1 ? '' : 's'} you cannot see
                </Text>
            )}
            {totalVisible === 0 && usage.hidden_count === 0 && (
                <Text size="sm" c="dimmed">
                    Not used on any page or action you can see.
                </Text>
            )}
        </Stack>
    );
}
