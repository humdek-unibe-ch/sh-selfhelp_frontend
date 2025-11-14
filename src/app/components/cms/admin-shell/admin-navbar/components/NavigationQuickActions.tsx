'use client';

import { 
    Group, 
    ActionIcon, 
    Tooltip,
    Box,
    Text
} from '@mantine/core';
import { 
    IconPlus, 
    IconRefresh, 
    IconSettings
} from '@tabler/icons-react';

interface INavigationQuickActionsProps {
    onCreatePage: () => void;
    onRefreshData: () => void;
    onOpenSettings?: () => void;
    onToggleSearch?: () => void;
    isRefreshing?: boolean;
}

export function NavigationQuickActions({ 
    onCreatePage, 
    onRefreshData, 
    onOpenSettings,
    onToggleSearch,
    isRefreshing = false 
}: INavigationQuickActionsProps) {
    return (
        <Box 
            p="sm" 
            style={{
                borderTop: '1px solid var(--mantine-color-gray-3)',
                backgroundColor: 'var(--mantine-color-gray-0)'
            }}
        >
            <Group justify="space-between" align="center">
                <Text size="xs" c="dimmed" fw={500} tt="uppercase">
                    Quick Actions
                </Text>
                <Group gap="xs">
                    <Tooltip label="Create new page" position="top">
                        <ActionIcon
                            variant="light"
                            color="green"
                            size="sm"
                            onClick={onCreatePage}
                        >
                            <IconPlus size={14} />
                        </ActionIcon>
                    </Tooltip>
                    
                    <Tooltip label="Refresh navigation" position="top">
                        <ActionIcon
                            variant="light"
                            color="blue"
                            size="sm"
                            onClick={onRefreshData}
                            loading={isRefreshing}
                        >
                            <IconRefresh size={14} />
                        </ActionIcon>
                    </Tooltip>
                    
                    {onOpenSettings && (
                        <Tooltip label="Navigation settings" position="top">
                            <ActionIcon
                                variant="light"
                                color="gray"
                                size="sm"
                                onClick={onOpenSettings}
                            >
                                <IconSettings size={14} />
                            </ActionIcon>
                        </Tooltip>
                    )}
                </Group>
            </Group>
        </Box>
    );
}
