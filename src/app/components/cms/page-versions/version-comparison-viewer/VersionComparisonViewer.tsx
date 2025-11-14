'use client';

import { Modal, Stack, Select, Box, Text, Loader, Alert, Paper, ScrollArea, Code, Group } from '@mantine/core';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageVersionApi } from '../../../../../api/admin/page-version.api';
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

    // Update state when modal opens with new initial values
    useEffect(() => {
        if (opened) {
            setVersion1Id(initialVersion1Id || null);
            setVersion2Id(initialVersion2Id || null);
        }
    }, [opened, initialVersion1Id, initialVersion2Id]);

    // Handle draft comparison specially
    const isDraftComparison = version1Id === -1 || version2Id === -1;
    const draftVersionId = version1Id === -1 ? version2Id : version1Id;

    const { data: comparison, isLoading, error } = useQuery({
        queryKey: isDraftComparison
            ? ['draft-comparison', pageId, draftVersionId, format]
            : ['version-comparison', pageId, version1Id, version2Id, format],
        queryFn: () => isDraftComparison
            ? PageVersionApi.compareDraftWithVersion(pageId!, draftVersionId!, format)
            : PageVersionApi.compareVersions(pageId!, version1Id!, version2Id!, { format }),
        enabled: !!pageId && (isDraftComparison ? !!draftVersionId : !!version1Id && !!version2Id),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

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

                    {(!version1Id || !version2Id) && (
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

