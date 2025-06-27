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
    IconLanguage
} from '@tabler/icons-react';
import { isDebugEnabled, DEBUG_CONFIG } from '../../../../config/debug.config';
import { debugLogger } from '../../../../utils/debug-logger';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { CssClassValidator } from './CssClassValidator';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { useLanguageContext } from '../../../contexts/LanguageContext';
import { notifications } from '@mantine/notifications';

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
    
    // Navigation data for the navigation debug tab
    const { pages, menuPages, footerPages, routes, isLoading, profilePages } = useAppNavigation();
    const { systemPageLinks, categorizedSystemPages } = useAdminPages();
    const { currentLanguageId, languages, isUpdatingLanguage, setCurrentLanguageId } = useLanguageContext();

    // Derived values for profile pages
    const profileLinkPage = profilePages.length > 0 ? profilePages[0] : null;
    const profileChildren = profileLinkPage?.children || [];
    const currentLanguage = languages.find(lang => lang.id === currentLanguageId);

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
            <Tooltip label="Debug Menu" position="left">
                <ActionIcon
                    onClick={toggle}
                    variant="subtle"
                    size="lg"
                    style={{
                        position: 'fixed',
                        top: 16,
                        right: 16,
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
                                        parent: p.parent,
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
                                        {JSON.stringify(profileChildren.map(c => ({
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

                    <Tabs.Panel value="css" pt="md">
                        <CssClassValidator />
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
                                            console.log('Language Debug Info:', languageInfo);
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