'use client';

/**
 * Performance Monitor Debug Panel
 * 
 * Visual interface for monitoring component performance in development
 * Shows render statistics, warnings, and helps identify performance issues
 * 
 * @module components/debug/PerformanceMonitorPanel
 */

import { useEffect, useState } from 'react';
import {
    Modal,
    Stack,
    Text,
    Group,
    Badge,
    Table,
    Alert,
    Button,
    Tabs,
    ActionIcon,
    Tooltip,
    ScrollArea,
    Card
} from '@mantine/core';
import {
    IconAlertTriangle,
    IconRefresh,
    IconX,
    IconActivity,
    IconBug,
    IconChartLine
} from '@tabler/icons-react';
import {
    getRenderStats,
    getWarnings,
    resetPerformanceMonitor
} from '../../../utils/performance-monitor.utils';

interface IPerformanceMonitorPanelProps {
    opened: boolean;
    onClose: () => void;
}

export function PerformanceMonitorPanel({ opened, onClose }: IPerformanceMonitorPanelProps) {
    const [stats, setStats] = useState(getRenderStats());
    const [warnings, setWarnings] = useState(getWarnings());
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Auto-refresh data every second when panel is open
    useEffect(() => {
        if (!opened || !autoRefresh) return;

        const interval = setInterval(() => {
            setStats(getRenderStats());
            setWarnings(getWarnings());
        }, 1000);

        return () => clearInterval(interval);
    }, [opened, autoRefresh]);

    const handleRefresh = () => {
        setStats(getRenderStats());
        setWarnings(getWarnings());
    };

    const handleReset = () => {
        resetPerformanceMonitor();
        setStats([]);
        setWarnings([]);
    };

    // Sort stats by render count (descending)
    const sortedStats = [...stats].sort((a, b) => b.renderCount - a.renderCount);

    // Group warnings by type
    const warningsByType = warnings.reduce((acc, warning) => {
        if (!acc[warning.type]) {
            acc[warning.type] = [];
        }
        acc[warning.type].push(warning);
        return acc;
    }, {} as Record<string, typeof warnings>);

    const getWarningColor = (type: string) => {
        switch (type) {
            case 'infinite-loop':
                return 'red';
            case 'excessive-renders':
                return 'orange';
            case 'slow-render':
                return 'yellow';
            case 'unstable-props':
                return 'blue';
            default:
                return 'gray';
        }
    };

    const getWarningIcon = (type: string) => {
        return <IconAlertTriangle size={16} />;
    };

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconActivity size={20} />
                    <Text fw={600}>Performance Monitor</Text>
                    <Badge size="xs" color="blue">Development Only</Badge>
                </Group>
            }
            size="xl"
            styles={{
                body: { padding: 0 },
                content: { maxHeight: '90vh', display: 'flex', flexDirection: 'column' }
            }}
        >
            <Stack gap="md" style={{ flex: 1, overflow: 'hidden' }}>
                {/* Controls */}
                <Group justify="space-between" px="md" pt="md">
                    <Group gap="xs">
                        <Tooltip label="Refresh data">
                            <ActionIcon variant="light" onClick={handleRefresh}>
                                <IconRefresh size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Reset all data">
                            <ActionIcon variant="light" color="red" onClick={handleReset}>
                                <IconX size={18} />
                            </ActionIcon>
                        </Tooltip>
                        <Button
                            size="xs"
                            variant={autoRefresh ? 'filled' : 'light'}
                            onClick={() => setAutoRefresh(!autoRefresh)}
                        >
                            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'}
                        </Button>
                    </Group>
                    <Group gap="xs">
                        <Badge color="green" variant="light">
                            {stats.length} Components
                        </Badge>
                        <Badge color={warnings.length > 0 ? 'red' : 'gray'} variant="light">
                            {warnings.length} Warnings
                        </Badge>
                    </Group>
                </Group>

                <Tabs defaultValue="stats" px="md" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <Tabs.List>
                        <Tabs.Tab value="stats" leftSection={<IconChartLine size={16} />}>
                            Render Stats
                        </Tabs.Tab>
                        <Tabs.Tab 
                            value="warnings" 
                            leftSection={<IconBug size={16} />}
                            rightSection={warnings.length > 0 ? <Badge size="xs" color="red">{warnings.length}</Badge> : null}
                        >
                            Warnings
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="stats" pt="md" style={{ flex: 1, overflow: 'hidden' }}>
                        <ScrollArea h="100%" offsetScrollbars>
                            {sortedStats.length === 0 ? (
                                <Alert color="blue" icon={<IconActivity />}>
                                    No data yet. Use components with <code>useRenderMonitor</code> hook to track performance.
                                </Alert>
                            ) : (
                                <Table striped highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Component</Table.Th>
                                            <Table.Th>Renders</Table.Th>
                                            <Table.Th>Avg Time</Table.Th>
                                            <Table.Th>Total Time</Table.Th>
                                            <Table.Th>Changed Props</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {sortedStats.map((stat) => (
                                            <Table.Tr key={stat.componentName}>
                                                <Table.Td>
                                                    <Text size="sm" fw={500}>{stat.componentName}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        color={stat.renderCount > 50 ? 'red' : stat.renderCount > 20 ? 'orange' : 'green'}
                                                        variant="light"
                                                    >
                                                        {stat.renderCount}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c={stat.averageRenderTime > 16 ? 'red' : 'dimmed'}>
                                                        {stat.averageRenderTime.toFixed(2)}ms
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">
                                                        {stat.totalRenderTime.toFixed(2)}ms
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    {stat.changedProps && stat.changedProps.length > 0 ? (
                                                        <Group gap="xs">
                                                            {stat.changedProps.map((prop) => (
                                                                <Badge key={prop} size="xs" variant="dot">
                                                                    {prop}
                                                                </Badge>
                                                            ))}
                                                        </Group>
                                                    ) : (
                                                        <Text size="sm" c="dimmed">-</Text>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            )}
                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="warnings" pt="md" style={{ flex: 1, overflow: 'hidden' }}>
                        <ScrollArea h="100%" offsetScrollbars>
                            {warnings.length === 0 ? (
                                <Alert color="green" icon={<IconActivity />}>
                                    No performance warnings detected. Your components are performing well!
                                </Alert>
                            ) : (
                                <Stack gap="md">
                                    {Object.entries(warningsByType).map(([type, typeWarnings]) => (
                                        <Card key={type} withBorder>
                                            <Stack gap="sm">
                                                <Group gap="xs">
                                                    {getWarningIcon(type)}
                                                    <Text fw={600} tt="capitalize">
                                                        {type.replace(/-/g, ' ')}
                                                    </Text>
                                                    <Badge color={getWarningColor(type)} variant="light">
                                                        {typeWarnings.length}
                                                    </Badge>
                                                </Group>
                                                <Stack gap="xs">
                                                    {typeWarnings.map((warning, index) => (
                                                        <Alert
                                                            key={index}
                                                            color={getWarningColor(type)}
                                                            icon={getWarningIcon(type)}
                                                        >
                                                            <Stack gap="xs">
                                                                <Text size="sm" fw={500}>
                                                                    {warning.componentName}
                                                                </Text>
                                                                <Text size="xs">{warning.message}</Text>
                                                                {warning.details && (
                                                                    <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                                                                        {JSON.stringify(warning.details, null, 2)}
                                                                    </Text>
                                                                )}
                                                            </Stack>
                                                        </Alert>
                                                    ))}
                                                </Stack>
                                            </Stack>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </ScrollArea>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Modal>
    );
}


