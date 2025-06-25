'use client';

import { useState, useEffect } from 'react';
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
    ScrollArea,
    Alert,
    Switch,
    Paper,
    Box
} from '@mantine/core';
import { 
    IconBug, 
    IconSettings, 
    IconDownload, 
    IconTrash,
    IconEye,
    IconActivity,
    IconRoute,
    IconClearAll,
    IconFilter,
    IconInfoCircle
} from '@tabler/icons-react';
import { isDebugEnabled, DEBUG_CONFIG } from '../../../../config/debug.config';
import { debugLogger } from '../../../../utils/debug-logger';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';

interface IDebugLogEntry {
    timestamp: string;
    component: string;
    message: string;
    data?: any;
    level: 'info' | 'warn' | 'error';
}

// Global debug logs store
let debugLogs: IDebugLogEntry[] = [];
let debugListeners: Array<(logs: IDebugLogEntry[]) => void> = [];

// Enhanced debug function that captures logs
const captureDebugLog = (message: string, component: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') => {
    const logEntry: IDebugLogEntry = {
        timestamp: new Date().toISOString(),
        component,
        message,
        data,
        level
    };
    
    debugLogs.unshift(logEntry); // Add to beginning
    
    // Keep only last 1000 logs to prevent memory issues
    if (debugLogs.length > 1000) {
        debugLogs = debugLogs.slice(0, 1000);
    }
    
    // Notify listeners
    debugListeners.forEach(listener => listener([...debugLogs]));
    
    // Call original debug function
    debugLogger.debug(message, component, data);
};

// Override the global debug function
(window as any).captureDebug = captureDebugLog;

export function DebugMenu() {
    const [opened, setOpened] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [logs, setLogs] = useState<IDebugLogEntry[]>([]);
    const [filterSectionInspector, setFilterSectionInspector] = useState(false);
    const [filterPageInspector, setFilterPageInspector] = useState(false);
    const [filterFieldHandler, setFilterFieldHandler] = useState(false);
    
    // Navigation data for the navigation debug tab
    const { pages, menuPages, footerPages, routes, isLoading } = useAppNavigation();

    if (!isDebugEnabled()) {
        return null;
    }

    useEffect(() => {
        const listener = (newLogs: IDebugLogEntry[]) => {
            setLogs(newLogs);
        };
        
        debugListeners.push(listener);
        setLogs([...debugLogs]);
        
        return () => {
            debugListeners = debugListeners.filter(l => l !== listener);
        };
    }, []);

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

    const getFilteredLogs = () => {
        let filtered = logs;
        
        if (filterSectionInspector) {
            filtered = filtered.filter(log => log.component.includes('SectionInspector'));
        }
        
        if (filterPageInspector) {
            filtered = filtered.filter(log => log.component.includes('PageInspector'));
        }
        
        if (filterFieldHandler) {
            filtered = filtered.filter(log => log.component.includes('FieldFormHandler') || log.component.includes('FieldsSection'));
        }
        
        if (activeTab !== 'all') {
            filtered = filtered.filter(log => log.level === activeTab);
        }
        
        return filtered;
    };

    const getLogsByComponent = () => {
        const componentGroups: Record<string, IDebugLogEntry[]> = {};
        logs.forEach(log => {
            if (!componentGroups[log.component]) {
                componentGroups[log.component] = [];
            }
            componentGroups[log.component].push(log);
        });
        return componentGroups;
    };

    const renderLogEntry = (log: IDebugLogEntry, index: number) => (
        <Paper key={index} p="sm" withBorder mb="xs">
            <Group justify="space-between" mb="xs">
                <Group gap="xs">
                    <Badge 
                        color={log.level === 'error' ? 'red' : log.level === 'warn' ? 'yellow' : 'blue'} 
                        size="sm"
                    >
                        {log.level.toUpperCase()}
                    </Badge>
                    <Badge variant="light" size="sm">{log.component}</Badge>
                    <Text size="xs" c="dimmed">
                        {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                </Group>
            </Group>
            
            <Text size="sm" mb={log.data ? "xs" : 0}>
                {log.message}
            </Text>
            
            {log.data && (
                <Code block style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
                    {JSON.stringify(log.data, null, 2)}
                </Code>
            )}
        </Paper>
    );

    const filteredLogs = getFilteredLogs();
    const componentGroups = getLogsByComponent();
    const sectionInspectorLogs = logs.filter(log => log.component.includes('SectionInspector'));
    const pageInspectorLogs = logs.filter(log => log.component.includes('PageInspector'));
    const fieldHandlerLogs = logs.filter(log => log.component.includes('FieldFormHandler') || log.component.includes('FieldsSection'));

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
                <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'all')} style={{ flex: 1 }}>
                    <Tabs.List>
                        <Tabs.Tab value="all">All ({logs.length})</Tabs.Tab>
                        <Tabs.Tab value="error">
                            Errors ({logs.filter(l => l.level === 'error').length})
                        </Tabs.Tab>
                        <Tabs.Tab value="warn">
                            Warnings ({logs.filter(l => l.level === 'warn').length})
                        </Tabs.Tab>
                        <Tabs.Tab value="info">
                            Info ({logs.filter(l => l.level === 'info').length})
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="all" pt="md" style={{ flex: 1 }}>
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

                    <Tabs.Panel value="logs" pt="md" style={{ flex: 1 }}>
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

                            <Paper p="sm" withBorder>
                                <Text size="sm" fw={500} mb="xs">
                                    <IconFilter size="1rem" style={{ marginRight: '4px' }} />
                                    Filters
                                </Text>
                                <Group gap="md">
                                    <Switch
                                        label="Section Inspector"
                                        checked={filterSectionInspector}
                                        onChange={(e) => setFilterSectionInspector(e.currentTarget.checked)}
                                        size="sm"
                                    />
                                    <Switch
                                        label="Page Inspector"
                                        checked={filterPageInspector}
                                        onChange={(e) => setFilterPageInspector(e.currentTarget.checked)}
                                        size="sm"
                                    />
                                    <Switch
                                        label="Field Handler"
                                        checked={filterFieldHandler}
                                        onChange={(e) => setFilterFieldHandler(e.currentTarget.checked)}
                                        size="sm"
                                    />
                                </Group>
                            </Paper>

                            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                                <Group gap="md">
                                    <Text size="sm">
                                        <strong>Section Inspector:</strong> {sectionInspectorLogs.length} logs
                                    </Text>
                                    <Text size="sm">
                                        <strong>Page Inspector:</strong> {pageInspectorLogs.length} logs
                                    </Text>
                                    <Text size="sm">
                                        <strong>Field Handler:</strong> {fieldHandlerLogs.length} logs
                                    </Text>
                                </Group>
                            </Alert>

                            <ScrollArea h={400}>
                                <Stack gap="xs">
                                    {filteredLogs.length === 0 ? (
                                        <Text size="sm" c="dimmed" ta="center" py="xl">
                                            No logs available
                                        </Text>
                                    ) : (
                                        filteredLogs.slice(-50).reverse().map((log, index) => renderLogEntry(log, index))
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