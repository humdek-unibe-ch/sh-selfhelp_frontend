'use client';

import { Modal, Stack, Select, Box, Text, Loader, Alert, Paper, Tabs, ScrollArea, Code, Group } from '@mantine/core';
import { useState } from 'react';
import { useVersionComparison } from '../../../../../hooks/usePageVersions';
import { IPageVersion } from '../../../../../types/responses/admin/page-version.types';

interface IVersionComparisonViewerProps {
    opened: boolean;
    onClose: () => void;
    pageId: number;
    versions: IPageVersion[];
    initialVersion1Id?: number;
    initialVersion2Id?: number;
}

export function VersionComparisonViewer({
    opened,
    onClose,
    pageId,
    versions,
    initialVersion1Id,
    initialVersion2Id
}: IVersionComparisonViewerProps) {
    const [version1Id, setVersion1Id] = useState<number | null>(initialVersion1Id || null);
    const [version2Id, setVersion2Id] = useState<number | null>(initialVersion2Id || null);
    const [format, setFormat] = useState<'unified' | 'side_by_side' | 'json_patch' | 'summary'>('side_by_side');

    const { data: comparison, isLoading, error } = useVersionComparison(
        pageId,
        version1Id,
        version2Id,
        format
    );

    const versionOptions = versions.map(v => ({
        value: v.id.toString(),
        label: v.version_name || `Version ${v.version_number}`
    }));

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Compare Versions"
            size="xl"
            fullScreen
        >
            <Stack gap="md" h="calc(100vh - 120px)">
                <Paper p="md" withBorder>
                    <Group grow>
                        <Select
                            label="Version 1"
                            placeholder="Select first version"
                            data={versionOptions}
                            value={version1Id?.toString() || null}
                            onChange={(value) => setVersion1Id(value ? parseInt(value) : null)}
                        />
                        <Select
                            label="Version 2"
                            placeholder="Select second version"
                            data={versionOptions}
                            value={version2Id?.toString() || null}
                            onChange={(value) => setVersion2Id(value ? parseInt(value) : null)}
                        />
                        <Select
                            label="Format"
                            data={[
                                { value: 'side_by_side', label: 'Side by Side' },
                                { value: 'unified', label: 'Unified Diff' },
                                { value: 'json_patch', label: 'JSON Patch' },
                                { value: 'summary', label: 'Summary' }
                            ]}
                            value={format}
                            onChange={(value) => setFormat(value as any)}
                        />
                    </Group>
                </Paper>

                <Box style={{ flex: 1, overflow: 'hidden' }}>
                    {isLoading && (
                        <Stack align="center" justify="center" h="100%">
                            <Loader size="lg" />
                            <Text>Loading comparison...</Text>
                        </Stack>
                    )}

                    {error && (
                        <Alert color="red" title="Error">
                            Failed to load comparison
                        </Alert>
                    )}

                    {!isLoading && !error && comparison && (
                        <ScrollArea h="100%">
                            {format === 'side_by_side' && (
                                <div 
                                    dangerouslySetInnerHTML={{ __html: comparison.diff as string }}
                                    style={{ fontSize: '12px' }}
                                />
                            )}
                            
                            {format === 'unified' && (
                                <Code block style={{ whiteSpace: 'pre-wrap' }}>
                                    {comparison.diff as string}
                                </Code>
                            )}
                            
                            {(format === 'json_patch' || format === 'summary') && (
                                <Code block style={{ whiteSpace: 'pre-wrap' }}>
                                    {JSON.stringify(comparison.diff, null, 2)}
                                </Code>
                            )}
                        </ScrollArea>
                    )}

                    {!version1Id || !version2Id && (
                        <Stack align="center" justify="center" h="100%">
                            <Text c="dimmed">
                                Select two versions to compare
                            </Text>
                        </Stack>
                    )}
                </Box>
            </Stack>
        </Modal>
    );
}

