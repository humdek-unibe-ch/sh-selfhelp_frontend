'use client';

import { Paper, Stack, Text, Group, Button, Loader, Alert, Center } from '@mantine/core';
import { IconGitCompare, IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { PageVersionApi } from '../../../../../api/admin/page-version.api';
import styles from './AutoVersionComparison.module.css';

interface IAutoVersionComparisonProps {
    pageId: number;
    publishedVersionId: number | null;
    onRefresh?: () => void;
}

export function AutoVersionComparison({
    pageId,
    publishedVersionId,
    onRefresh
}: IAutoVersionComparisonProps) {
    
    // Auto-compare draft with published using the new endpoint
    const { data: comparison, isLoading, error, refetch } = useQuery({
        queryKey: ['draft-comparison', pageId, publishedVersionId],
        queryFn: () => PageVersionApi.compareDraftWithVersion(pageId, publishedVersionId!),
        enabled: !!pageId && !!publishedVersionId,
        staleTime: 30000, // 30 seconds
    });

    // If no published version, show info
    if (!publishedVersionId) {
        return (
            <Paper p="md" withBorder>
                <Alert color="blue" icon={<IconAlertCircle size={16} />}>
                    <Text size="sm">
                        No published version to compare with. Publish a version first.
                    </Text>
                </Alert>
            </Paper>
        );
    }

    if (isLoading) {
        return (
            <Paper p="md" withBorder>
                <Center>
                    <Stack align="center" gap="sm">
                        <Loader size="sm" />
                        <Text size="sm" c="dimmed">Comparing versions...</Text>
                    </Stack>
                </Center>
            </Paper>
        );
    }

    if (error) {
        return (
            <Paper p="md" withBorder>
                <Alert color="red" icon={<IconAlertCircle size={16} />}>
                    <Text size="sm">Failed to load comparison</Text>
                    <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconRefresh size={14} />}
                        onClick={() => refetch()}
                        mt="xs"
                    >
                        Retry
                    </Button>
                </Alert>
            </Paper>
        );
    }

    if (!comparison) {
        return null;
    }

    return (
        <Paper p="md" withBorder>
            <Stack gap="md">
                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <IconGitCompare size={18} />
                        <Text size="sm" fw={600}>Draft vs Published</Text>
                    </Group>
                    <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconRefresh size={14} />}
                        onClick={() => refetch()}
                    >
                        Refresh
                    </Button>
                </Group>

                {/* Render the comparison diff */}
                <div 
                    className={styles.diffContainer}
                    dangerouslySetInnerHTML={{ __html: comparison.diff }} 
                />
            </Stack>
        </Paper>
    );
}

