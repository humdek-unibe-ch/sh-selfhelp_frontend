'use client';

import React, { useState, useEffect } from 'react';
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
    Box,
    Menu,
    Loader
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
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
    IconInfoCircle,
    IconPalette,
    IconLanguage,
    IconChartLine,
    IconAlertTriangle,
    IconCopy,
    IconCheck
} from '@tabler/icons-react';
import { isDebugEnabled, DEBUG_CONFIG } from '../../../../../config/debug.config';
import { debugLogger } from '../../../../../utils/debug-logger';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useLanguageContext } from '../../../contexts/LanguageContext';
import { notifications } from '@mantine/notifications';
import { IPageItem } from '../../../../../types/common/pages.type';
import { 
    getRenderStats, 
    getWarnings, 
    resetPerformanceMonitor,
    copyPerformanceReportToClipboard
} from '../../../../../utils/performance-monitor.utils';

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
    const [opened, { toggle }] = useDisclosure(false);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [logs, setLogs] = useState<IDebugLogEntry[]>([]);
    const [filterSectionInspector, setFilterSectionInspector] = useState(false);
    const [filterPageInspector, setFilterPageInspector] = useState(false);
    const [filterFieldHandler, setFilterFieldHandler] = useState(false);
    const [performanceStats, setPerformanceStats] = useState(getRenderStats());
    const [performanceWarnings, setPerformanceWarnings] = useState(getWarnings());
    const [reportCopied, setReportCopied] = useState(false);
    
    // Navigation data for the navigation debug tab
    const { pages, menuPages, footerPages, routes, isLoading, profilePages } = useAppNavigation();
    const { systemPageLinks, categorizedSystemPages } = useAdminPages();
    const { currentLanguageId, languages, isUpdatingLanguage, setCurrentLanguageId } = useLanguageContext();

    // Derived values for profile pages
    const profileLinkPage = profilePages.length > 0 ? profilePages[0] : null;
    const profileChildren = profileLinkPage?.children || [];
    const currentLanguage = languages.find(lang => lang.id === currentLanguageId);

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

    // Auto-refresh performance data when debug menu is opened
    useEffect(() => {
        if (!opened) return;

        const interval = setInterval(() => {
            setPerformanceStats(getRenderStats());
            setPerformanceWarnings(getWarnings());
        }, 1000);

        return () => clearInterval(interval);
    }, [opened]);

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

    const handleLanguageTest = () => {
        if (languages.length > 0) {
            const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
            setCurrentLanguageId(randomLanguage.id);
            notifications.show({
                title: 'Debug: Language Changed',
                message: `Switched to ${randomLanguage.language}`,
                color: 'blue'
            });
        }
    };

    return (
        <>
            <Tooltip label="Debug Menu" position="right">
                <ActionIcon
                    onClick={toggle}
                    variant="subtle"
                    size="lg"
                    style={{
                        position: 'fixed',
                        top: 16,
                        left: 16,
                        zIndex: 1000,
                        backgroundColor: 'var(--mantine-color-blue-6)',
                        color: 'white'
                    }}
                >
                    <IconBug size={20} />
                </ActionIcon>
            </Tooltip>

            <Modal
                opened={opened}
                onClose={toggle}
                title="Debug Information"
                size="xl"
                scrollAreaComponent={ScrollArea.Autosize}
            >
                <Tabs defaultValue="navigation">
                    <Tabs.List>
                        <Tabs.Tab value="navigation">Navigation</Tabs.Tab>
                        <Tabs.Tab value="system-pages">System Pages</Tabs.Tab>
                        <Tabs.Tab value="profile">Profile Pages</Tabs.Tab>
                        <Tabs.Tab value="config">Config</Tabs.Tab>
                        <Tabs.Tab value="auth">Auth</Tabs.Tab>
                        <Tabs.Tab value="api">API</Tabs.Tab>
                        <Tabs.Tab value="performance">Performance</Tabs.Tab>
                        <Tabs.Tab value="language" leftSection={<IconLanguage size={16} />}>
                            Language System
                        </Tabs.Tab>
                    </Tabs.List>

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
                                        parent: p.parent_page_id,
                                        nav_position: p.nav_position,
                                        children: p.children?.length || 0
                                    })), null, 2)}
                                </Code>
                            </div>

                            <div>
                                <Text fw={500} mb="xs">Menu Pages (hierarchical):</Text>
                                <Code block style={{ maxHeight: 200, overflow: 'auto' }}>
                                    {JSON.stringify(menuPages.map(p => ({ 
                                        keyword: p.keyword, 
                                        url: p.url, 
                                        nav_position: p.nav_position,
                                        children: p.children?.length || 0
                                    })), null, 2)}
                                </Code>
                            </div>

                            <div>
                                <Text fw={500} mb="xs">Flattened Routes:</Text>
                                <Code block style={{ maxHeight: 200, overflow: 'auto' }}>
                                    {JSON.stringify(routes.map(r => ({ 
                                        keyword: r.keyword, 
                                        url: r.url 
                                    })), null, 2)}
                                </Code>
                            </div>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="system-pages" pt="md">
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                System pages structure and categorization.
                            </Text>

                            <Group>
                                <Badge color="blue">Total System Pages: {systemPageLinks.length}</Badge>
                                <Badge color="green">Authentication: {categorizedSystemPages.authentication.length}</Badge>
                                <Badge color="orange">Profile: {categorizedSystemPages.profile.length}</Badge>
                                <Badge color="purple">Error: {categorizedSystemPages.errors.length}</Badge>
                                <Badge color="red">Legal: {categorizedSystemPages.legal.length}</Badge>
                                <Badge color="gray">Other: {categorizedSystemPages.other.length}</Badge>
                            </Group>

                            <div>
                                <Text fw={500} mb="xs">Hierarchical System Pages:</Text>
                                <Code block style={{ maxHeight: 300, overflow: 'auto' }}>
                                    {JSON.stringify(systemPageLinks.map(p => ({ 
                                        keyword: p.keyword, 
                                        label: p.label,
                                        link: p.link,
                                        children: p.children?.map(c => ({ 
                                            keyword: c.keyword, 
                                            label: c.label,
                                            link: c.link
                                        })) || []
                                    })), null, 2)}
                                </Code>
                            </div>

                            <div>
                                <Text fw={500} mb="xs">Profile Pages Category:</Text>
                                <Code block style={{ maxHeight: 200, overflow: 'auto' }}>
                                    {JSON.stringify(categorizedSystemPages.profile.map(p => ({ 
                                        keyword: p.keyword, 
                                        label: p.label,
                                        link: p.link,
                                        children: p.children?.map(c => ({ 
                                            keyword: c.keyword, 
                                            label: c.label,
                                            link: c.link
                                        })) || []
                                    })), null, 2)}
                                </Code>
                            </div>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="profile" pt="md">
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Profile dropdown data and structure.
                            </Text>

                            <Group>
                                <Badge color={profileLinkPage ? "green" : "red"}>
                                    Profile Link: {profileLinkPage ? "Found" : "Not Found"}
                                </Badge>
                                <Badge color="blue">Children: {profileChildren.length}</Badge>
                            </Group>

                            {profileLinkPage && (
                                <div>
                                    <Text fw={500} mb="xs">Profile Link Page:</Text>
                                    <Code block>
                                        {JSON.stringify({
                                            keyword: profileLinkPage.keyword,
                                            title: profileLinkPage.title,
                                            url: profileLinkPage.url,
                                            id: profileLinkPage.id_pages
                                        }, null, 2)}
                                    </Code>
                                </div>
                            )}

                            {profileChildren.length > 0 && (
                                <div>
                                    <Text fw={500} mb="xs">Profile Children:</Text>
                                    <Code block>
                                        {JSON.stringify(profileChildren.map((c: IPageItem) => ({
                                            keyword: c.keyword,
                                            title: c.title,
                                            url: c.url,
                                            id: c.id_pages
                                        })), null, 2)}
                                    </Code>
                                </div>
                            )}
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

                    <Tabs.Panel value="language">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text fw={500}>Language Debug Tools</Text>
                                <Badge color={isUpdatingLanguage ? 'orange' : 'green'}>
                                    {isUpdatingLanguage ? 'Updating...' : 'Ready'}
                                </Badge>
                            </Group>
                            
                            <Paper p="md" withBorder>
                                <Stack gap="sm">
                                    <Text size="sm" fw={500}>Current State</Text>
                                    <Group>
                                        <Text size="sm">Current Language ID:</Text>
                                        <Code>{currentLanguageId || 'None'}</Code>
                                    </Group>
                                    <Group>
                                        <Text size="sm">Current Language:</Text>
                                        <Code>{currentLanguage?.language || 'None'}</Code>
                                    </Group>
                                    <Group>
                                        <Text size="sm">Current Locale:</Text>
                                        <Code>{currentLanguage?.locale || 'None'}</Code>
                                    </Group>
                                    <Group>
                                        <Text size="sm">Available Languages:</Text>
                                        <Badge>{languages.length}</Badge>
                                    </Group>
                                </Stack>
                            </Paper>

                            <Paper p="md" withBorder>
                                <Stack gap="sm">
                                    <Text size="sm" fw={500}>Test Actions</Text>
                                    <Button
                                        leftSection={<IconLanguage size={16} />}
                                        onClick={handleLanguageTest}
                                        disabled={isUpdatingLanguage || languages.length === 0}
                                        loading={isUpdatingLanguage}
                                        variant="light"
                                    >
                                        Test Random Language
                                    </Button>
                                    
                                    <Button
                                        leftSection={<IconInfoCircle size={16} />}
                                        onClick={() => {
                                            const languageInfo = {
                                                currentId: currentLanguageId,
                                                currentLanguage: currentLanguage,
                                                available: languages.map(l => ({ 
                                                    id: l.id, 
                                                    locale: l.locale, 
                                                    name: l.language 
                                                })),
                                                count: languages.length
                                            };

                                            notifications.show({
                                                title: 'Language Debug Info',
                                                message: `Check console for detailed info. Current: ${currentLanguage?.language || 'None'}`,
                                                color: 'blue'
                                            });
                                        }}
                                        variant="light"
                                    >
                                        Log Language Info
                                    </Button>
                                </Stack>
                            </Paper>

                            {languages.length > 0 && (
                                <Paper p="md" withBorder>
                                    <Text size="sm" fw={500} mb="sm">Available Languages</Text>
                                    <ScrollArea h={200}>
                                        <Stack gap="xs">
                                            {languages.map(lang => (
                                                <Group key={lang.id} justify="space-between">
                                                    <Group gap="xs">
                                                        <Badge 
                                                            color={currentLanguageId === lang.id ? 'blue' : 'gray'}
                                                            variant={currentLanguageId === lang.id ? 'filled' : 'light'}
                                                        >
                                                            ID: {lang.id}
                                                        </Badge>
                                                        <Badge variant="light" color="gray">
                                                            {lang.locale}
                                                        </Badge>
                                                        <Text size="sm">{lang.language}</Text>
                                                    </Group>
                                                    <Button
                                                        size="xs"
                                                        variant="subtle"
                                                        onClick={() => setCurrentLanguageId(lang.id)}
                                                        disabled={isUpdatingLanguage || currentLanguageId === lang.id}
                                                    >
                                                        Select
                                                    </Button>
                                                </Group>
                                            ))}
                                        </Stack>
                                    </ScrollArea>
                                </Paper>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="performance" pt="md">
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" c="dimmed">
                                    Component render tracking and performance monitoring
                                </Text>
                                <Group gap="xs">
                                    <Badge color="green" variant="light">
                                        {performanceStats.length} Components
                                    </Badge>
                                    <Badge color={performanceWarnings.length > 0 ? 'red' : 'gray'} variant="light">
                                        {performanceWarnings.length} Warnings
                                    </Badge>
                                </Group>
                            </Group>

                            <Group gap="xs" wrap="wrap">
                                <Button 
                                    size="xs" 
                                    leftSection={reportCopied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                    color={reportCopied ? 'green' : 'blue'}
                                    variant="filled"
                                    onClick={async () => {
                                        const success = await copyPerformanceReportToClipboard();
                                        if (success) {
                                            setReportCopied(true);
                                            notifications.show({
                                                title: 'Report Copied!',
                                                message: 'Performance report copied to clipboard. Paste it in your chat with the AI assistant.',
                                                color: 'green',
                                                icon: <IconCheck size={16} />,
                                            });
                                            setTimeout(() => setReportCopied(false), 3000);
                                        } else {
                                            notifications.show({
                                                title: 'Copy Failed',
                                                message: 'Failed to copy report to clipboard',
                                                color: 'red',
                                            });
                                        }
                                    }}
                                >
                                    {reportCopied ? 'Copied!' : 'Copy AI Report'}
                                </Button>
                                <Button 
                                    size="xs" 
                                    leftSection={<IconActivity size={16} />}
                                    onClick={() => {
                                        setPerformanceStats(getRenderStats());
                                        setPerformanceWarnings(getWarnings());
                                    }}
                                >
                                    Refresh
                                </Button>
                                <Button 
                                    size="xs" 
                                    leftSection={<IconClearAll size={16} />}
                                    color="red"
                                    onClick={() => {
                                        resetPerformanceMonitor();
                                        setPerformanceStats([]);
                                        setPerformanceWarnings([]);
                                    }}
                                >
                                    Reset All
                                </Button>
                            </Group>

                            {performanceStats.length === 0 ? (
                                <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                    No performance data yet. Add <Code>useRenderMonitor</Code> hook to components you want to track.
                                    <br />
                                    <br />
                                    Example:
                                    <Code block mt="xs">
                                        {`import { useRenderMonitor } from '@/utils/performance-monitor.utils';

function MyComponent(props) {
    useRenderMonitor('MyComponent', props);
    // Your component code...
}`}
                                    </Code>
                                </Alert>
                            ) : (
                                <>
                                    <Box>
                                        <Group justify="space-between" mb="xs">
                                            <Text fw={500}>Render Statistics</Text>
                                            <Badge size="xs" variant="light" color="blue">
                                                Scroll to see all →
                                            </Badge>
                                        </Group>
                                        <Paper withBorder p="xs" style={{ background: 'var(--mantine-color-gray-0)' }}>
                                            <ScrollArea h={200} type="auto" scrollbarSize={8}>
                                                <Stack gap="xs" pr="xs">
                                                    {performanceStats
                                                        .sort((a, b) => b.renderCount - a.renderCount)
                                                        .map((stat) => (
                                                        <Paper key={stat.componentName} p="xs" withBorder bg="white">
                                                            <Group justify="space-between">
                                                                <Stack gap={2}>
                                                                    <Text size="sm" fw={500}>{stat.componentName}</Text>
                                                                    <Group gap="xs">
                                                                        <Badge 
                                                                            size="xs" 
                                                                            color={stat.renderCount > 50 ? 'red' : stat.renderCount > 20 ? 'orange' : 'green'}
                                                                        >
                                                                            {stat.renderCount} renders
                                                                        </Badge>
                                                                        <Badge size="xs" variant="light">
                                                                            {stat.averageRenderTime.toFixed(2)}ms avg
                                                                        </Badge>
                                                                    </Group>
                                                                    {stat.changedProps && stat.changedProps.length > 0 && (
                                                                        <Text size="xs" c="dimmed">
                                                                            Changed: {stat.changedProps.join(', ')}
                                                                        </Text>
                                                                    )}
                                                                </Stack>
                                                            </Group>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            </ScrollArea>
                                        </Paper>
                                    </Box>

                                    {performanceWarnings.length > 0 && (
                                        <Box>
                                            <Group justify="space-between" mb="xs">
                                                <Text fw={500}>⚠️ Performance Warnings</Text>
                                                <Badge size="xs" variant="light" color="red">
                                                    Scroll to see all →
                                                </Badge>
                                            </Group>
                                            <Paper withBorder p="xs" style={{ background: 'var(--mantine-color-red-0)' }}>
                                                <ScrollArea h={200} type="auto" scrollbarSize={8}>
                                                    <Stack gap="xs" pr="xs">
                                                        {performanceWarnings.map((warning, index) => (
                                                            <Alert
                                                                key={index}
                                                                color={warning.type === 'infinite-loop' ? 'red' : 'orange'}
                                                                icon={<IconAlertTriangle size={16} />}
                                                            >
                                                                <Stack gap={4}>
                                                                    <Text size="sm" fw={500}>{warning.componentName}</Text>
                                                                    <Text size="xs">{warning.message}</Text>
                                                                    {warning.details && (
                                                                        <Code block>
                                                                            {JSON.stringify(warning.details, null, 2)}
                                                                        </Code>
                                                                    )}
                                                                </Stack>
                                                            </Alert>
                                                        ))}
                                                    </Stack>
                                                </ScrollArea>
                                            </Paper>
                                        </Box>
                                    )}
                                </>
                            )}

                            <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                <Text size="sm" fw={500} mb="xs">Understanding Render Counts:</Text>
                                <Text size="xs" component="div" mb="md">
                                    • <strong>1-3 renders:</strong> ✅ Normal (initial + data loading)
                                    <br />
                                    • <strong>4-10 renders:</strong> ⚠️ Acceptable but investigate
                                    <br />
                                    • <strong>11-20 renders:</strong> ⚠️ Likely excessive - check console
                                    <br />
                                    • <strong>20+ renders:</strong> 🚨 Problematic - check props/context
                                    <br />
                                    • <strong>50+ renders:</strong> 🔥 Critical - infinite loop likely
                                </Text>
                                
                                <Text size="sm" fw={500} mb="xs">Pro Tips:</Text>
                                <Text size="xs" component="div">
                                    • <strong>Check console now</strong> for <Code>[Why Did You Update]</Code> logs
                                    <br />
                                    • Look for <Code>[Mount Monitor]</Code> logs showing remounts
                                    <br />
                                    • Remounting frequently = unstable keys or parent re-creating
                                    <br />
                                    • Props changing every render = missing memoization
                                    <br />
                                    • Read the guide: <Code>docs/performance-monitoring-guide.md</Code>
                                </Text>
                            </Alert>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Modal>

            <Menu shadow="md" width={300} position="bottom-end">
                <Menu.Dropdown>
                    <Menu.Item
                        leftSection={<IconLanguage size={16} />}
                        onClick={handleLanguageTest}
                        disabled={isUpdatingLanguage || languages.length === 0}
                    >
                        Test Random Language
                        {isUpdatingLanguage && <Loader size="xs" ml="auto" />}
                    </Menu.Item>
                    
                    <Menu.Item
                        leftSection={<IconInfoCircle size={16} />}
                        onClick={() => {
                            notifications.show({
                                title: 'Language Debug Info',
                                message: `Current: ${currentLanguage?.language || 'None'}, Available: ${languages.length}`,
                                color: 'blue'
                            });
                        }}
                    >
                        Show Language Info
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </>
    );
} 