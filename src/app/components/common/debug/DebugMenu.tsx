'use client';

import { useState } from 'react';
import { 
    Button, 
    Modal, 
    Stack, 
    Text, 
    Group, 
    Badge, 
    Tabs, 
    ActionIcon,
    Tooltip,
    Code,
    ScrollArea
} from '@mantine/core';
import { 
    IconBug, 
    IconSettings, 
    IconDownload, 
    IconTrash,
    IconEye,
    IconActivity,
    IconRoute
} from '@tabler/icons-react';
import { isDebugEnabled, DEBUG_CONFIG } from '../../../../config/debug.config';
import { debugLogger } from '../../../../utils/debug-logger';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';

export function DebugMenu() {
    const [opened, setOpened] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('overview');
    
    // Navigation data for the navigation debug tab
    const { pages, menuPages, footerPages, routes, isLoading } = useAppNavigation();

    if (!isDebugEnabled()) {
        return null;
    }

    const handleExportLogs = () => {
        const logs = debugLogger.exportLogs();
        const blob = new Blob([logs], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleClearLogs = () => {
        debugLogger.clearLogs();
    };

    const logs = debugLogger.getLogs();

    return (
        <>
            <Tooltip label="Debug Menu" position="left">
                <ActionIcon
                    onClick={() => setOpened(true)}
                    variant="filled"
                    color="red"
                    size="xl"
                    style={{ 
                        position: 'fixed', 
                        bottom: '50%', 
                        right: '20px', 
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transform: 'translateY(50%)'
                    }}
                >
                    <IconBug size={24} />
                </ActionIcon>
            </Tooltip>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title={
                    <Group>
                        <IconBug size={20} />
                        <Text fw={600}>Debug Control Panel</Text>
                        <Badge color="red" size="sm">DEV</Badge>
                    </Group>
                }
                size="xl"
            >
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <Tabs.List>
                        <Tabs.Tab value="overview" leftSection={<IconEye size={16} />}>
                            Overview
                        </Tabs.Tab>
                        <Tabs.Tab value="navigation" leftSection={<IconRoute size={16} />}>
                            Navigation
                        </Tabs.Tab>
                        <Tabs.Tab value="logs" leftSection={<IconActivity size={16} />}>
                            Logs ({logs.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="config" leftSection={<IconSettings size={16} />}>
                            Config
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="overview" pt="md">
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Debug tools and utilities for development and testing.
                            </Text>

                            <Group>
                                <Badge color="green" variant="light">
                                    Environment: {process.env.NODE_ENV}
                                </Badge>
                                <Badge color="blue" variant="light">
                                    Debug: {DEBUG_CONFIG.enabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                                <Badge color="orange" variant="light">
                                    Logging: {DEBUG_CONFIG.logging.enabled ? 'On' : 'Off'}
                                </Badge>
                            </Group>

                            <div>
                                <Text fw={500} mb="xs">Available Debug Components:</Text>
                                <Stack gap="xs">
                                    {Object.entries(DEBUG_CONFIG.components).map(([key, enabled]) => (
                                        <Group key={key} justify="space-between">
                                            <Text size="sm" tt="capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </Text>
                                            <Badge 
                                                color={enabled ? 'green' : 'gray'} 
                                                size="sm"
                                                variant="light"
                                            >
                                                {enabled ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </Group>
                                    ))}
                                </Stack>
                            </div>

                            <div>
                                <Text fw={500} mb="xs">Debug Features:</Text>
                                <Stack gap="xs">
                                    {Object.entries(DEBUG_CONFIG.features).map(([key, enabled]) => (
                                        <Group key={key} justify="space-between">
                                            <Text size="sm" tt="capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </Text>
                                            <Badge 
                                                color={enabled ? 'green' : 'gray'} 
                                                size="sm"
                                                variant="light"
                                            >
                                                {enabled ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </Group>
                                    ))}
                                </Stack>
                            </div>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="navigation" pt="md">
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Navigation system data and route information.
                            </Text>

                            <Group>
                                <Badge color="blue">Total Pages: {pages.length}</Badge>
                                <Badge color="green">Menu Pages: {menuPages.length}</Badge>
                                <Badge color="orange">Footer Pages: {footerPages.length}</Badge>
                                <Badge color="purple">Flattened Routes: {routes.length}</Badge>
                            </Group>

                            <div>
                                <Text fw={500} mb="xs">Raw Pages (from API):</Text>
                                <Code block style={{ maxHeight: 200, overflow: 'auto' }}>
                                    {JSON.stringify(pages.map(p => ({ 
                                        keyword: p.keyword, 
                                        url: p.url, 
                                        parent: p.parent,
                                        nav_position: p.nav_position,
                                        children: p.children?.length || 0
                                    })), null, 2)}
                                </Code>
                            </div>

                            <div>
                                <Text fw={500} mb="xs">Menu Pages (filtered & sorted):</Text>
                                <Code block style={{ maxHeight: 200, overflow: 'auto' }}>
                                    {JSON.stringify(menuPages.map(p => ({ 
                                        keyword: p.keyword, 
                                        nav_position: p.nav_position,
                                        children: p.children?.length || 0
                                    })), null, 2)}
                                </Code>
                            </div>

                            <div>
                                <Text fw={500} mb="xs">Flattened Routes (for route checking):</Text>
                                <Code block style={{ maxHeight: 200, overflow: 'auto' }}>
                                    {JSON.stringify(routes.map(p => ({ 
                                        keyword: p.keyword, 
                                        url: p.url,
                                        parent: p.parent
                                    })), null, 2)}
                                </Code>
                            </div>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="logs" pt="md">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={500}>Debug Logs</Text>
                                <Group gap="xs">
                                    <Button
                                        size="xs"
                                        variant="light"
                                        leftSection={<IconDownload size={14} />}
                                        onClick={handleExportLogs}
                                    >
                                        Export
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="red"
                                        leftSection={<IconTrash size={14} />}
                                        onClick={handleClearLogs}
                                    >
                                        Clear
                                    </Button>
                                </Group>
                            </Group>

                            <ScrollArea h={400}>
                                <Stack gap="xs">
                                    {logs.length === 0 ? (
                                        <Text size="sm" c="dimmed" ta="center" py="xl">
                                            No logs available
                                        </Text>
                                    ) : (
                                        logs.slice(-50).reverse().map((log, index) => (
                                            <div key={index}>
                                                <Group gap="xs" mb={4}>
                                                    <Badge 
                                                        size="xs" 
                                                        color={
                                                            log.level === 'error' ? 'red' :
                                                            log.level === 'warn' ? 'orange' :
                                                            log.level === 'info' ? 'blue' : 'gray'
                                                        }
                                                    >
                                                        {log.level}
                                                    </Badge>
                                                    <Text size="xs" c="dimmed">
                                                        {new Date(log.timestamp).toLocaleTimeString()}
                                                    </Text>
                                                    {log.component && (
                                                        <Badge size="xs" variant="light">
                                                            {log.component}
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Text size="sm" mb="xs">
                                                    {log.message}
                                                </Text>
                                                {log.data && (
                                                    <Code block style={{ fontSize: '10px' }}>
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </Code>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </Stack>
                            </ScrollArea>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="config" pt="md">
                        <Stack gap="md">
                            <Text fw={500}>Debug Configuration</Text>
                            <Code block>
                                {JSON.stringify(DEBUG_CONFIG, null, 2)}
                            </Code>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Modal>
        </>
    );
} 