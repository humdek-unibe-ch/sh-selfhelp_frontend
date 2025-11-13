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
    IconCheck,
    IconX
} from '@tabler/icons-react';
import { isDebugEnabled, DEBUG_CONFIG } from '../../../../../config/debug.config';
import { debugLogger } from '../../../../../utils/debug-logger';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useLanguageContext } from '../../../contexts/LanguageContext';
import { useAuth } from '../../../../../hooks/useAuth';
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
    component?: string;
    message: string;
    data?: any;
    level: 'debug' | 'info' | 'warn' | 'error';
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
    const { permissionChecker } = useAuth();

    // Derived values for profile pages
    const profileLinkPage = profilePages.length > 0 ? profilePages[0] : null;
    const profileChildren = profileLinkPage?.children || [];
    const currentLanguage = languages.find(lang => lang.id === currentLanguageId);

    useEffect(() => {
        const listener = (newLogs: IDebugLogEntry[]) => {
            // Use setTimeout to avoid setState during render
            setTimeout(() => {
                setLogs(newLogs);
            }, 0);
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

    // WDYR is now set up globally in providers.tsx - no need for component-level control

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
            filtered = filtered.filter(log => log.component?.includes('SectionInspector'));
        }

        if (filterPageInspector) {
            filtered = filtered.filter(log => log.component?.includes('PageInspector'));
        }

        if (filterFieldHandler) {
            filtered = filtered.filter(log => log.component?.includes('FieldFormHandler') || log.component?.includes('FieldsSection'));
        }
        
        if (activeTab !== 'all') {
            filtered = filtered.filter(log => log.level === activeTab);
        }
        
        return filtered;
    };

    const getLogsByComponent = () => {
        const componentGroups: Record<string, IDebugLogEntry[]> = {};
        logs.forEach(log => {
            const componentKey = log.component || 'Unknown';
            if (!componentGroups[componentKey]) {
                componentGroups[componentKey] = [];
            }
            componentGroups[componentKey].push(log);
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
                    <Badge variant="light" size="sm">{log.component || 'Unknown'}</Badge>
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
    const sectionInspectorLogs = logs.filter(log => log.component?.includes('SectionInspector'));
    const pageInspectorLogs = logs.filter(log => log.component?.includes('PageInspector'));
    const fieldHandlerLogs = logs.filter(log => log.component?.includes('FieldFormHandler') || log.component?.includes('FieldsSection'));

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
                        <Tabs.Tab value="permissions">Permissions</Tabs.Tab>
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
                                    {JSON.stringify(categorizedSystemPages.profile.map((p: any) => ({
                                        keyword: p.keyword,
                                        label: p.label,
                                        link: p.link,
                                        children: p.children?.map((c: any) => ({
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

                    <Tabs.Panel value="permissions" pt="md">
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Admin panel permission system status and menu visibility checks.
                            </Text>

                            <Group>
                                <Badge color="blue">Permission Checker: {permissionChecker ? "Active" : "Not Available"}</Badge>
                            </Group>

                            {permissionChecker && (
                                <Box>
                                    <Text fw={500} mb="xs">Menu Permissions (Debug):</Text>
                                    <Group gap="xs" mb="xs">
                                        <Badge color={permissionChecker.canAccessAdmin() ? 'green' : 'red'} leftSection={permissionChecker.canAccessAdmin() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Admin Access
                                        </Badge>
                                        <Badge color={permissionChecker.canReadUsers() ? 'green' : 'red'} leftSection={permissionChecker.canReadUsers() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Users
                                        </Badge>
                                        <Badge color={permissionChecker.canReadGroups() ? 'green' : 'red'} leftSection={permissionChecker.canReadGroups() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Groups
                                        </Badge>
                                        <Badge color={permissionChecker.canReadRoles() ? 'green' : 'red'} leftSection={permissionChecker.canReadRoles() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Roles
                                        </Badge>
                                        <Badge color={permissionChecker.canReadPages() ? 'green' : 'red'} leftSection={permissionChecker.canReadPages() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Pages
                                        </Badge>
                                        <Badge color={permissionChecker.canCreatePages() ? 'green' : 'red'} leftSection={permissionChecker.canCreatePages() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Create Pages
                                        </Badge>
                                        <Badge color={permissionChecker.canReadAssets() ? 'green' : 'red'} leftSection={permissionChecker.canReadAssets() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Assets
                                        </Badge>
                                        <Badge color={permissionChecker.canViewAuditLogs() ? 'green' : 'red'} leftSection={permissionChecker.canViewAuditLogs() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Audit Logs
                                        </Badge>
                                        <Badge color={permissionChecker.canManageActions() ? 'green' : 'red'} leftSection={permissionChecker.canManageActions() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Actions
                                        </Badge>
                                        <Badge color={permissionChecker.canManageScheduledJobs() ? 'green' : 'red'} leftSection={permissionChecker.canManageScheduledJobs() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Scheduled Jobs
                                        </Badge>
                                        <Badge color={permissionChecker.canReadCache() ? 'green' : 'red'} leftSection={permissionChecker.canReadCache() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Cache
                                        </Badge>
                                        <Badge color={permissionChecker.canAccessDataBrowser() ? 'green' : 'red'} leftSection={permissionChecker.canAccessDataBrowser() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Data Browser
                                        </Badge>
                                        <Badge color={permissionChecker.canReadCmsPreferences() ? 'green' : 'red'} leftSection={permissionChecker.canReadCmsPreferences() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            CMS Preferences
                                        </Badge>
                                        <Badge color={permissionChecker.canManageLanguages() ? 'green' : 'red'} leftSection={permissionChecker.canManageLanguages() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Languages
                                        </Badge>
                                        <Badge color={permissionChecker.canDeleteSections() ? 'green' : 'red'} leftSection={permissionChecker.canDeleteSections() ? <IconCheck size={10} /> : <IconX size={10} />}>
                                            Unused Sections
                                        </Badge>
                                    </Group>
                                </Box>
                            )}

                            <Alert icon={<IconInfoCircle size={16} />} color="blue">
                                <Text size="sm" fw={500} mb="xs">Permission System Info:</Text>
                                <Text size="xs" component="div">
                                    • Green badges = Permission granted, menu item visible
                                    <br />
                                    • Red badges = Permission denied, menu item hidden
                                    <br />
                                    • Menu items are conditionally shown based on these permissions
                                    <br />
                                    • Buttons are disabled if user lacks specific permissions
                                    <br />
                                    • Check individual page components for more detailed permission checks
                                </Text>
                            </Alert>
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


                                <Group gap="xs">
                                    {/* AI Analysis Report Generator */}
                                    {(() => {
                                        // Collect performance monitoring logs from debug logger
                                        const performanceLogs = debugLogger.getLogs().filter(log =>
                                            log.message.includes('[Why Did You Update]') ||
                                            log.message.includes('[Performance Monitor]') ||
                                            log.message.includes('[Render Monitor]') ||
                                            log.message.includes('[Mount Monitor]') ||
                                            log.component?.includes('SectionInspector') ||
                                            log.component?.includes('PageInspector')
                                        );

                                        // Collect RenderLogger logs
                                        const renderLoggerLogs = debugLogger.getLogs().filter(log =>
                                            log.message.includes('[RenderLogger]') &&
                                            (log.component?.includes('SectionInspector') ||
                                             log.component?.includes('PageInspector'))
                                        );

                                        // Create comprehensive AI analysis prompt
                                        const generateAIPrompt = (): string => {
                                            const criticalComponents = performanceStats.filter(s => s.renderCount > 50).length;
                                            const highPriorityComponents = performanceStats.filter(s => s.renderCount > 20 && s.renderCount <= 50).length;
                                            const normalComponents = performanceStats.filter(s => s.renderCount <= 20).length;

                                            // Enhanced performance monitoring logs with more detailed analysis
                                            const performanceSummary = performanceLogs.length > 0 ? (() => {
                                                // Calculate component activity
                                                const componentActivity = performanceLogs.reduce((acc, log) => {
                                                    const component = log.component || 'Unknown';
                                                    acc[component] = (acc[component] || 0) + 1;
                                                    return acc;
                                                }, {} as Record<string, number>);

                                                const mostActiveComponent = Object.entries(componentActivity)
                                                    .sort(([,a], [,b]) => b - a)[0];

                                                // Group logs by component for detailed analysis
                                                const logsByComponent = performanceLogs.reduce((acc, log) => {
                                                    const component = log.component || 'Unknown';
                                                    if (!acc[component]) acc[component] = [];
                                                    acc[component].push(log);
                                                    return acc;
                                                }, {} as Record<string, IDebugLogEntry[]>);

                                                return `### 📋 Performance Monitor Detailed Analysis (${performanceLogs.length} total logs)

**Component Activity Overview:**
- Total Performance logs: ${performanceLogs.length}
- Components with Performance logs: ${Object.keys(componentActivity).length}
- Most active component: ${mostActiveComponent ? `${mostActiveComponent[0]} (${mostActiveComponent[1]} logs)` : 'None'}

**Performance Log Summary by Component:**
${Object.entries(componentActivity)
    .sort(([,a], [,b]) => b - a)
    .map(([component, count]) => `- **${component}:** ${count} logs`)
    .join('\n')}

**🔍 Detailed Performance Logs (Last 20 entries):**
${performanceLogs.slice(-20).map((log, idx) =>
`**${idx + 1}.** [${new Date(log.timestamp).toLocaleTimeString()}] **${log.component || 'Unknown'}**
- **Message:** ${log.message}
- **Data:** ${log.data ? Object.keys(log.data).join(', ') : 'No data'}
${log.data && Object.keys(log.data).length > 0 ? `- **Keys:** ${Object.keys(log.data).join(', ')}` : ''}
${log.data && typeof log.data === 'object' && log.data !== null ?
    Object.entries(log.data).slice(0, 3).map(([key, value]) =>
        `- **${key}:** ${typeof value === 'object' ? '[Object]' : String(value).slice(0, 50)}${String(value).length > 50 ? '...' : ''}`
    ).join('\n') : ''}
`).join('\n\n')}

**🎯 WDYR Pattern Analysis:**
${Object.entries(logsByComponent).map(([component, logs]) => {
    const uniqueMessages = new Set(logs.map(l => l.message.split(' ').slice(0, 5).join(' ')));
    const avgTimeBetweenLogs = logs.length > 1 ?
        logs.slice(1).reduce((sum, log, i) =>
            sum + (new Date(log.timestamp).getTime() - new Date(logs[i].timestamp).getTime()), 0
        ) / (logs.length - 1) : 0;

    return `**${component}:**
- Total logs: ${logs.length}
- Unique message patterns: ${uniqueMessages.size}
- Avg time between logs: ${avgTimeBetweenLogs > 0 ? `${(avgTimeBetweenLogs / 1000).toFixed(1)}s` : 'N/A'}
- Recent activity: ${logs.slice(-5).map(l => `[${new Date(l.timestamp).toLocaleTimeString()}]`).join(', ')}`;
}).join('\n\n')}`;
                                            })() : performanceLogs.length > 0 ?
                                                `### 📋 Performance Monitor Logs Analysis (${performanceLogs.length} total logs)

**Component Activity Overview:**
- Total Performance logs: ${performanceLogs.length}
- Components with Performance logs: ${new Set(performanceLogs.map(log => log.component || 'Unknown')).size}
- Most active component: ${(() => {
    const componentCounts = performanceLogs.reduce((acc, log) => {
        const component = log.component || 'Unknown';
        acc[component] = (acc[component] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const mostActive = Object.entries(componentCounts).sort(([,a], [,b]) => b - a)[0];
    return mostActive ? `${mostActive[0]} (${mostActive[1]} logs)` : 'None';
})()}

**🔍 Recent Performance Logs (Last 10 entries):**
${performanceLogs.slice(-10).map((log, idx) =>
`**${idx + 1}.** [${new Date(log.timestamp).toLocaleTimeString()}] **${log.component || 'Unknown'}**
- **Message:** ${log.message}
- **Data:** ${log.data ? Object.keys(log.data).join(', ') : 'No data'}`
).join('\n\n')}

**🎯 Performance Analysis:**
- Check browser console for detailed [RenderLogger] messages
- Use React DevTools Profiler for render timing analysis
- Monitor component re-render frequency and causes` : '**No performance monitoring logs captured.** Enable development mode and interact with components to generate render logs.';

                                            // Only analyze top 10 most problematic components to keep report size manageable
                                            const topComponents = performanceStats
                                                .sort((a, b) => b.renderCount - a.renderCount)
                                                .slice(0, 10);

                                            const componentAnalysis = topComponents.map(stat => {
                                                const isCritical = stat.renderCount > 50;
                                                const isWarning = stat.renderCount > 20 && stat.renderCount <= 50;

                                                // Detailed props analysis
                                                const propsSummary = stat.props ? (() => {
                                                    const propTypes = Object.entries(stat.props).map(([key, value]) => `${key}: ${typeof value}`);
                                                    const objectProps = Object.entries(stat.props)
                                                        .filter(([, value]) => typeof value === 'object' && value !== null)
                                                        .map(([key, value]) => `${key} (${Array.isArray(value) ? 'array' : 'object'})`);

                                                    return `Props: ${Object.keys(stat.props).length} keys
- Types: ${propTypes.join(', ')}
- Objects: ${objectProps.length > 0 ? objectProps.join(', ') : 'None'}
- Functions: ${Object.values(stat.props).filter(v => typeof v === 'function').length} detected`;
                                                })() : 'No props tracked';

                                                // Enhanced prop changes analysis
                                                const propChanges = stat.propChangeHistory && stat.propChangeHistory.length > 0 ? (() => {
                                                    const changes = stat.propChangeHistory.slice(-5).reverse(); // Last 5 changes
                                                    const changeFrequency = changes.reduce((acc, change) => {
                                                        acc[change.propName] = (acc[change.propName] || 0) + 1;
                                                        return acc;
                                                    }, {} as Record<string, number>);

                                                    return `Prop Changes (Last ${changes.length} of ${stat.propChangeHistory.length} total):
${Object.entries(changeFrequency)
    .sort(([,a], [,b]) => b - a)
    .map(([prop, count]) => `- **${prop}:** ${count} changes`)
    .join('\n')}

Detailed Changes:
${changes.map((change, idx) =>
`  ${idx + 1}. [${new Date(change.timestamp).toLocaleTimeString()}] ${change.propName}:
     Render #${change.renderNumber} | ${typeof change.oldValue} → ${typeof change.newValue}
     From: ${String(change.oldValue).slice(0, 30)}${String(change.oldValue).length > 30 ? '...' : ''}
     To: ${String(change.newValue).slice(0, 30)}${String(change.newValue).length > 30 ? '...' : ''}`
).join('\n')}`;
                                                })() : 'No prop changes tracked';

                                                // Performance monitor correlation for this component
                                                const componentPerformanceLogs = performanceLogs.filter(log => log.component === stat.componentName);
                                                const performanceCorrelation = componentPerformanceLogs.length > 0 ?
`Performance Monitor Correlation:
- Performance logs for this component: ${componentPerformanceLogs.length}
- Recent Performance messages: ${componentPerformanceLogs.slice(-3).map(log =>
    `"${log.message.split(' ').slice(0, 6).join(' ')}..."`
).join(', ')}` : '';

                                                return `${isCritical ? '## 🔥 CRITICAL' : isWarning ? '## ⚠️ HIGH PRIORITY' : '## ✅ NORMAL'}: ${stat.componentName}

**Performance Metrics:**
- Total Renders: ${stat.renderCount}
- Average Render Time: ${stat.averageRenderTime.toFixed(1)}ms
- Total Render Time: ${stat.totalRenderTime.toFixed(1)}ms
- Render Frequency: ${stat.renderCount > 10 ? `${(stat.renderCount / (Date.now() - performance.timing?.navigationStart || Date.now()) * 1000).toFixed(2)}/sec` : 'Low'}

**Props Analysis:**
${propsSummary}

**Change History:**
${propChanges}

${performanceCorrelation}

**Analysis & Recommendations:**
${stat.renderCount > 50 ?
    '🚨 CRITICAL: Potential infinite loop detected. Check for unstable dependencies in useEffect, useMemo, or useCallback. Look for objects/arrays being recreated on every render.' :
    stat.renderCount > 20 ?
    `⚠️ HIGH PRIORITY: Excessive renders (${stat.renderCount}). Consider memoization with React.memo, useMemo, or useCallback. Check if parent component is causing cascading re-renders.` :
    '✅ NORMAL: Acceptable render frequency. Monitor for any increases in render count.'}

**Quick Fixes to Try:**
${stat.renderCount > 20 ? `
- Wrap component with React.memo if props haven't changed
- Use useMemo for expensive computations
- Use useCallback for event handlers
- Check parent components for unnecessary re-renders
- Verify hook dependencies are stable` : 'No immediate fixes needed - performance is good.'}
`;
                                            }).join('\n\n');

                                            // Enhanced warnings with detailed analysis
                                            const topWarnings = performanceWarnings.slice(0, 10); // Increased to 10 for more info
                                            const warningsSection = topWarnings.length > 0 ? (() => {
                                                // Group warnings by component
                                                const warningsByComponent = topWarnings.reduce((acc, warning) => {
                                                    if (!acc[warning.componentName]) acc[warning.componentName] = [];
                                                    acc[warning.componentName].push(warning);
                                                    return acc;
                                                }, {} as Record<string, typeof topWarnings>);

                                                return `### ⚠️ Detailed Performance Warnings (${performanceWarnings.length} total)

**Warnings by Component:**
${Object.entries(warningsByComponent).map(([component, warnings]) =>
`**${component} (${warnings.length} warnings):**
${warnings.map((warning, idx) =>
`  ${idx + 1}. [${warning.type.toUpperCase()}] ${warning.message}
     ${warning.details ? `Details: ${JSON.stringify(warning.details).slice(0, 100)}${JSON.stringify(warning.details).length > 100 ? '...' : ''}` : 'No additional details'}`
).join('\n')}`
).join('\n\n')}

**Warning Type Summary:**
${['slow-render', 'infinite-loop', 'memory-leak'].map(type => {
    const count = topWarnings.filter(w => w.type === type).length;
    return count > 0 ? `- **${type}:** ${count} instances` : '';
}).filter(Boolean).join('\n')}

**Most Critical Warnings:**
${topWarnings
    .sort((a, b) => {
        const severity = { 'infinite-loop': 3, 'memory-leak': 2, 'slow-render': 1 };
        return (severity[b.type as keyof typeof severity] || 0) - (severity[a.type as keyof typeof severity] || 0);
    })
    .slice(0, 3)
    .map((warning, idx) =>
`  ${idx + 1}. ${warning.componentName}: ${warning.type} - ${warning.message.slice(0, 50)}...`
).join('\n')}`;
                                            })() : 'No critical performance warnings.';

                                            // RenderLogger analysis
                                            const renderLoggerAnalysis = renderLoggerLogs.length > 0 ? (() => {
                                                // Group RenderLogger logs by component
                                                const renderLoggerByComponent = renderLoggerLogs.reduce((acc, log) => {
                                                    const component = log.component || 'Unknown';
                                                    if (!acc[component]) acc[component] = [];
                                                    acc[component].push(log);
                                                    return acc;
                                                }, {} as Record<string, IDebugLogEntry[]>);

                                                // Analyze render patterns for each component
                                                const componentAnalysis = Object.entries(renderLoggerByComponent).map(([component, logs]) => {
                                                    const renderLogs = logs.filter(log => log.message.includes('re-rendered'));
                                                    const internalRenders = logs.filter(log => log.message.includes('internal re-render detected'));
                                                    const totalRenders = renderLogs.length;
                                                    const avgRenderTime = renderLogs.reduce((sum, log) => {
                                                        const timeMatch = log.message.match(/after (\d+)ms/);
                                                        return sum + (timeMatch ? parseInt(timeMatch[1]) : 0);
                                                    }, 0) / Math.max(renderLogs.length, 1);

                                                    return {
                                                        component,
                                                        totalRenders,
                                                        internalRenders: internalRenders.length,
                                                        avgRenderTime: Math.round(avgRenderTime),
                                                        lastRenderTime: renderLogs.length > 0 ? renderLogs[renderLogs.length - 1].timestamp : null
                                                    };
                                                });

                                                return `### 🔄 RenderLogger Analysis (${renderLoggerLogs.length} total logs)

**Component Render Analysis:**
${componentAnalysis.map((analysis, idx) =>
`**${idx + 1}. ${analysis.component}:**
- Total renders: ${analysis.totalRenders}
- Internal re-renders: ${analysis.internalRenders}
- Average time between renders: ${analysis.avgRenderTime}ms
- Last render: ${analysis.lastRenderTime ? new Date(analysis.lastRenderTime).toLocaleTimeString() : 'Unknown'}
`).join('\n')}

**🔍 Detailed RenderLogger Logs (Last 15 entries):**
${renderLoggerLogs.slice(-15).map((log, idx) =>
`**${idx + 1}.** [${new Date(log.timestamp).toLocaleTimeString()}] **${log.component || 'Unknown'}**
- **Message:** ${log.message}
${log.data ? `- **Details:** ${JSON.stringify(log.data, null, 2)}` : ''}
`).join('\n\n')}

**🚨 Critical Internal Re-render Issues:**
${componentAnalysis
    .filter(analysis => analysis.internalRenders > 0)
    .map(analysis =>
`**${analysis.component}:** ${analysis.internalRenders} internal re-renders detected
- **Issue:** Component is re-rendering without prop changes
- **Cause:** useMemo dependencies, object creation in render, or unstable references
- **Impact:** ${analysis.totalRenders} total renders, ${Math.round(analysis.avgRenderTime)}ms average render time
`).join('\n\n') || 'No internal re-render issues detected.'}`;
                                            })() : '**No RenderLogger data captured.** Add useRenderLogger hooks to components to track render causes.';

                                            const performanceAnalysis = performanceLogs.length > 0 ? `

**🎯 Performance Monitor Analysis Priorities:**

**Immediate Investigation Required:**
1. **Infinite Loop Detection**: Check components with >50 renders for:
   - useEffect without proper dependencies
   - State updates triggering re-renders in render phase
   - Object/array creation in render without memoization

2. **Prop Stability Analysis**: For each component with WDYR logs:
   - Are objects/arrays being recreated on every render?
   - Are functions being redefined without useCallback?
   - Are context values properly memoized?

3. **Parent-Child Relationship Issues**:
   - Is a parent component causing cascading re-renders?
   - Are children receiving unstable props?
   - Check component hierarchy for memoization gaps

**Performance Monitor Log Interpretation Guide:**
- "[Why Did You Update] Component re-rendered" = Props changed between renders
- "[Performance Monitor] Slow render detected" = Component took too long to render
- "[Render Monitor] Component rendered" = Component re-rendered with timing info
- "[Mount Monitor] Component remounted" = Component unmounted and remounted unnecessarily
- "Same value, different reference" = Objects/functions not memoized

**Pattern Recognition:**
- Frequent renders with same props = Missing React.memo
- Props changing constantly = Unstable parent data
- Hook differences = Custom hook dependency issues
- Owner differences = Parent re-rendering unnecessarily

**Code Investigation Checklist:**
- Review useEffect dependencies in all tracked components
- Check useMemo usage for expensive computations
- Verify useCallback for event handlers
- Audit context providers for proper memoization
- Look for inline object/array creation in JSX` : '**No performance logs captured.** Enable development mode and interact with tracked components to generate performance analysis.';

                                            return `# 🐛 React Performance Analysis Report

Generated: ${new Date().toISOString()}
Total Components Tracked: ${performanceStats.length}
Total Warnings: ${performanceWarnings.length}
Performance Monitor Status: ${process.env.NODE_ENV === 'development' ? 'Active' : 'Disabled'}

---

## 📊 Executive Summary

### 🔥 CRITICAL ISSUES (${criticalComponents} components)
Immediate Action Required - These components have excessive renders (>50) indicating potential infinite loops

### ⚠️ HIGH PRIORITY (${highPriorityComponents} components)
Fix Soon - Components with 20-50 renders need optimization

### ✅ NORMAL (${normalComponents} components)
Good Performance - Components with acceptable render counts

---

## 🔍 Performance Monitor Analysis

${performanceSummary}

---

${performanceAnalysis}

---

## 🔄 RenderLogger Internal Re-render Analysis

${renderLoggerAnalysis}

---

## 🔍 Top 10 Most Problematic Components

${componentAnalysis}

---

## ⚠️ Performance Warnings

${warningsSection}

---

## 🎯 Comprehensive AI Diagnostic Assistant Prompt

You are a senior React performance expert. Analyze the above data and provide detailed solutions.

### 🎯 Comprehensive Performance Analysis Guide

**🔥 CRITICAL Priority (Fix Immediately):**
1. **Components with >50 renders** - Potential infinite loops
2. **useEffect without dependencies** causing cascading re-renders
3. **Objects/arrays created in render** without memoization
4. **State updates during render phase**

**⚠️ HIGH Priority (Fix Soon):**
1. **Components with 20-50 renders** - Excessive re-rendering
2. **Missing React.memo** on components receiving same props
3. **Unstable hook dependencies** in useEffect/useMemo/useCallback
4. **Context values not memoized** causing provider re-renders

**✅ MEDIUM Priority (Review):**
1. **Components with 10-20 renders** - Monitor for increases
2. **Expensive computations** not memoized
3. **Event handlers** not using useCallback
4. **Inline function definitions** in JSX

**🔧 Specific Fix Strategies:**

**For Infinite Loops (>50 renders):**
- Check useEffect dependencies array
- Look for setState calls during render
- Verify no circular dependencies between components
- Check for unstable object references in dependencies

**For Excessive Renders (20-50):**
- Add React.memo to component exports
- Use useMemo for expensive calculations
- Use useCallback for event handlers
- Memoize context provider values

**For Props Instability:**
- Audit parent components for object creation in render
- Use useMemo to stabilize object/array props
- Implement proper dependency arrays
- Consider component composition over prop drilling

**Code Investigation Workflow:**

1. **Start with Performance Monitor Logs:**
   - Identify which props are changing unnecessarily
   - Look for "[Why Did You Update]" messages
   - Check render timestamps for frequency patterns

2. **Component Hierarchy Analysis:**
   - Trace re-render cascade from parent to children
   - Check if memoization boundaries are properly placed
   - Verify context consumers aren't over-re-rendering

3. **Hook Dependency Audit:**
   - Review all useEffect, useMemo, useCallback dependencies
   - Check for missing dependencies causing stale closures
   - Look for dependencies that change too frequently

4. **Performance Testing:**
   - Use React DevTools Profiler to measure impact
   - Test fixes incrementally to verify improvements
   - Monitor for regression after changes

**Key Files to Investigate:**
- \`src/app/components/cms/pages/section-inspector/SectionInspector.tsx\` - Main problematic component
- Context provider files (check useMemo usage)
- Custom hooks (verify dependency stability)
- Parent components passing props to SectionInspector

**Debugging Commands to Run:**
- Check browser console for Performance Monitor logs during interaction
- Use React DevTools to profile component renders
- Monitor network tab for excessive API calls
- Check memory usage for potential leaks

**🔍 RenderLogger Analysis Guide:**
- **Internal re-renders** = Component re-rendering without prop changes
- **Check useMemo dependencies** for object/array references
- **Look for object creation in render** phase (anti-pattern)
- **Verify useEffect dependencies** are stable and complete
- **Check for unstable function references** in props/dependencies
- **Context providers** should memoize values to prevent cascading re-renders
- **Component composition** over prop drilling for stable references

---

Report Generated: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV}
Performance Monitor Active: ${process.env.NODE_ENV === 'development'}

---

End of Analysis Report - Send this complete report to your AI assistant for comprehensive React performance optimization guidance.`;
                                        };

                                        return (
                                            <Button
                                                size="xs"
                                                leftSection={reportCopied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                                                color={reportCopied ? 'green' : 'blue'}
                                                variant="filled"
                                                onClick={async () => {
                                                    const aiAnalysisPrompt = generateAIPrompt();

                                                    try {
                                                        await navigator.clipboard.writeText(aiAnalysisPrompt);
                                                        setReportCopied(true);
                                                        notifications.show({
                                                            title: 'AI Analysis Report Copied!',
                                                            message: 'Comprehensive performance report with WDYR analysis copied to clipboard. Send to AI assistant for detailed optimization guidance.',
                                                            color: 'green',
                                                            icon: <IconCheck size={16} />,
                                                        });
                                                        setTimeout(() => setReportCopied(false), 3000);
                                                    } catch (error) {
                                                        notifications.show({
                                                            title: 'Copy Failed',
                                                            message: 'Failed to copy AI analysis report to clipboard',
                                                            color: 'red',
                                                        });
                                                    }
                                                }}
                                            >
                                                {reportCopied ? 'Copied!' : 'Copy AI Report'}
                                            </Button>
                                        );
                                    })()}
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
                                            <ScrollArea h={300} type="auto" scrollbarSize={8}>
                                                <Stack gap="xs" pr="xs">
                                                    {performanceStats
                                                        .sort((a, b) => b.renderCount - a.renderCount)
                                                        .map((stat) => (
                                                        <Paper key={stat.componentName} p="xs" withBorder bg="white">
                                                            <Stack gap="xs">
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
                                                                            <Badge size="xs" variant="light" color="gray">
                                                                                {stat.totalRenderTime.toFixed(2)}ms total
                                                                            </Badge>
                                                                        </Group>
                                                                    </Stack>
                                                                </Group>

                                                                {/* Prop Change History */}
                                                                {stat.propChangeHistory && stat.propChangeHistory.length > 0 && (
                                                                    <Box>
                                                                        <Text size="xs" fw={500} c="dimmed" mb={4}>
                                                                            🔍 Why Did You Update (Last {Math.min(stat.propChangeHistory.length, 10)} changes):
                                                                        </Text>
                                                                        <Paper p="xs" withBorder style={{ background: 'var(--mantine-color-gray-1)' }}>
                                                                            <Stack gap={6}>
                                                                                {stat.propChangeHistory.slice(-10).reverse().map((change, idx) => {
                                                                                    const timeAgo = Date.now() - change.timestamp;
                                                                                    const timeStr = timeAgo < 1000 ? 'just now' : 
                                                                                                   timeAgo < 60000 ? `${Math.floor(timeAgo / 1000)}s ago` :
                                                                                                   `${Math.floor(timeAgo / 60000)}m ago`;
                                                                                    
                                                                                    // Simplified value display
                                                                                    const formatValue = (val: any): string => {
                                                                                        if (val === undefined) return 'undefined';
                                                                                        if (val === null) return 'null';
                                                                                        if (typeof val === 'function') return '[Function]';
                                                                                        if (typeof val === 'object') {
                                                                                            try {
                                                                                                const str = JSON.stringify(val);
                                                                                                return str.length > 50 ? `${str.substring(0, 50)}...` : str;
                                                                                            } catch {
                                                                                                return '[Object]';
                                                                                            }
                                                                                        }
                                                                                        const str = String(val);
                                                                                        return str.length > 50 ? `${str.substring(0, 50)}...` : str;
                                                                                    };

                                                                                    return (
                                                                                        <Box key={idx} p={4} style={{ background: 'white', borderRadius: 4, fontSize: '11px' }}>
                                                                                            <Group gap={4} mb={2}>
                                                                                                <Badge size="xs" variant="light" color="blue">
                                                                                                    Render #{change.renderNumber}
                                                                                                </Badge>
                                                                                                <Text size="xs" c="dimmed">{timeStr}</Text>
                                                                                            </Group>
                                                                                            <Text size="xs" fw={500} c="blue" mb={2}>
                                                                                                {change.propName}
                                                                                            </Text>
                                                                                            <Stack gap={2}>
                                                                                                <Group gap={4}>
                                                                                                    <Text size="xs" c="dimmed" style={{ minWidth: 30 }}>From:</Text>
                                                                                                    <Code style={{ fontSize: '10px', padding: '2px 4px' }}>
                                                                                                        {formatValue(change.oldValue)}
                                                                                                    </Code>
                                                                                                </Group>
                                                                                                <Group gap={4}>
                                                                                                    <Text size="xs" c="dimmed" style={{ minWidth: 30 }}>To:</Text>
                                                                                                    <Code style={{ fontSize: '10px', padding: '2px 4px' }}>
                                                                                                        {formatValue(change.newValue)}
                                                                                                    </Code>
                                                                                                </Group>
                                                                                            </Stack>
                                                                                        </Box>
                                                                                    );
                                                                                })}
                                                                            </Stack>
                                                                        </Paper>
                                                                    </Box>
                                                                )}

                                                                {/* Current Props */}
                                                                {stat.props && Object.keys(stat.props).length > 0 && (
                                                                    <Box>
                                                                        <Text size="xs" fw={500} c="dimmed" mb={4}>
                                                                            Current Props:
                                                                        </Text>
                                                                        <Code block style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto' }}>
                                                                            {JSON.stringify(
                                                                                Object.keys(stat.props).reduce((acc, key) => {
                                                                                    acc[key] = typeof stat.props![key];
                                                                                    return acc;
                                                                                }, {} as Record<string, string>),
                                                                                null,
                                                                                2
                                                                            )}
                                                                        </Code>
                                                                    </Box>
                                                                )}
                                                            </Stack>
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

                            {/* Performance Monitor Info Section */}
                            {process.env.NODE_ENV === 'development' && (
                                <Box>
                                    <Text fw={500} mb="xs">🔍 Performance Monitor Active</Text>
                                    <Alert icon={<IconInfoCircle size="1rem" />} color="green">
                                        <Text size="sm" mb="xs">
                                            Custom performance monitoring is active and tracking components. Check your browser console for render logs.
                                        </Text>
                                        <Text size="xs" component="div">
                                            • Tracked components: SectionInspector, PageInspector<br/>
                                            • Excluded: Mantine components, Notifications, DebugMenu<br/>
                                            • Look for <Code>[Performance Monitor]</Code>, <Code>[Why Did You Update]</Code>, <Code>[Render Monitor]</Code> logs in console<br/>
                                            • Use the test component above to trigger renders
                                        </Text>
                                    </Alert>
                                </Box>
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
                                    • <strong>Enable WDYR toggle</strong> above to track unnecessary re-renders
                                    <br />
                                    • <strong>Check WDYR logs section</strong> below for detailed re-render reasons
                                    <br />
                                    • Look for <Code>[Mount Monitor]</Code> logs showing remounts
                                    <br />
                                    • Remounting frequently = unstable keys or parent re-creating
                                    <br />
                                    • Props changing every render = missing memoization
                                    <br />
                                    • WDYR logs are included in the <Code>Copy AI Report</Code> button
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