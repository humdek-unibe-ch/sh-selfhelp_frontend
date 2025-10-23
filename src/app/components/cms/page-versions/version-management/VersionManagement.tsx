'use client';

import { Stack, Group, Text, Button, Divider, Box, Paper, Collapse, Badge } from '@mantine/core';
import { IconRocket, IconHistory, IconGitBranch, IconGitCompare, IconAlertCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { IPageVersion } from '../../../../../types/responses/admin/page-version.types';
import { VersionStatusBadge } from '../version-status-badge/VersionStatusBadge';
import { VersionHistoryList } from '../version-history-list/VersionHistoryList';
import { PublishVersionModal } from '../publish-version-modal/PublishVersionModal';
import { AutoVersionComparison } from '../auto-version-comparison/AutoVersionComparison';
import { VersionDetailsModal } from '../version-details-modal/VersionDetailsModal';
import { VersionComparisonViewer } from '../version-comparison-viewer/VersionComparisonViewer';
import { useUnpublishedChanges } from '../../../../../hooks/useUnpublishedChanges';

interface IVersionManagementProps {
    pageId: number;
    versions: IPageVersion[];
    currentPublishedVersionId: number | null;
    isLoading: boolean;
    error: Error | null;
    onPublishNew: (data?: any) => void;
    onPublishSpecific: (versionId: number) => void;
    onUnpublish: () => void;
    onDelete: (versionId: number) => void;
    onCompare: (versionId: number) => void;
    isPublishing: boolean;
    isUnpublishing: boolean;
}

export function VersionManagement({
    pageId,
    versions,
    currentPublishedVersionId,
    isLoading,
    error,
    onPublishNew,
    onPublishSpecific,
    onUnpublish,
    onDelete,
    onCompare,
    isPublishing,
    isUnpublishing
}: IVersionManagementProps) {
    const [publishModalOpened, setPublishModalOpened] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<IPageVersion | null>(null);
    const [detailsModalOpened, setDetailsModalOpened] = useState(false);
    const [compareModalOpened, setCompareModalOpened] = useState(false);
    const [selectedComparisonVersionId, setSelectedComparisonVersionId] = useState<number | null>(null);
    
    const hasPublishedVersion = currentPublishedVersionId !== null && currentPublishedVersionId !== undefined;
    const publishedVersion = versions.find(v => v.id === currentPublishedVersionId);
    
    // Check for unpublished changes using fast hash-based comparison
    const { data: changesStatus, isLoading: changesLoading } = useUnpublishedChanges(pageId);

    // Determine if publish button should be disabled
    const hasUnpublishedChanges = changesStatus?.has_unpublished_changes ?? false;
    const shouldDisablePublish = !hasUnpublishedChanges || changesLoading;

    const handlePublish = (data?: any) => {
        onPublishNew(data);
        setPublishModalOpened(false);
    };

    const handleViewVersion = (versionId: number) => {
        const version = versions.find(v => v.id === versionId);
        if (version) {
            setSelectedVersion(version);
            setDetailsModalOpened(true);
        }
    };

    const handleCompareVersion = (versionId: number) => {
        setSelectedComparisonVersionId(versionId);
        setCompareModalOpened(true);
    };

    return (
        <Stack gap="md">
            {/* Status Header */}
            <Paper p="md" withBorder bg="gray.0" style={{ borderColor: 'var(--mantine-color-gray-3)' }}>
                <Group justify="space-between" align="center">
                    <Stack gap="xs" style={{ flex: 1 }}>
                        <Group gap="xs">
                            <Text size="sm" c="dimmed">Current Status</Text>
                            {changesStatus?.has_unpublished_changes && hasPublishedVersion && (
                                <Badge 
                                    size="sm" 
                                    color="yellow" 
                                    variant="dot"
                                    leftSection={<IconAlertCircle size={12} />}
                                >
                                    Unpublished Changes
                                </Badge>
                            )}
                        </Group>
                        <VersionStatusBadge
                            hasPublishedVersion={hasPublishedVersion}
                            publishedVersionName={publishedVersion?.version_name}
                            publishedAt={publishedVersion?.published_at}
                        />
                    </Stack>
                    
                    <Group gap="xs">
                        <Button
                            leftSection={<IconRocket size={16} />}
                            variant="filled"
                            color="green"
                            onClick={() => setPublishModalOpened(true)}
                            loading={isPublishing}
                            disabled={shouldDisablePublish}
                            title={shouldDisablePublish ? (changesLoading ? 'Checking for changes...' : 'No unpublished changes to publish') : 'Publish current changes'}
                        >
                            Publish
                        </Button>
                        {hasPublishedVersion && (
                            <Button
                                leftSection={<IconHistory size={16} />}
                                variant="outline"
                                color="gray"
                                onClick={onUnpublish}
                                loading={isUnpublishing}
                            >
                                Unpublish
                            </Button>
                        )}
                    </Group>
                </Group>
            </Paper>

            {/* Auto Comparison Section */}
            {hasPublishedVersion && (
                <>
                    <Divider />
                    <Box>
                        <Button
                            variant="light"
                            size="sm"
                            leftSection={<IconGitCompare size={16} />}
                            onClick={() => setShowComparison(!showComparison)}
                            fullWidth
                        >
                            {showComparison ? 'Hide' : 'Show'} Draft vs Published Comparison
                        </Button>
                        
                        <Collapse in={showComparison} mt="md">
                            <AutoVersionComparison
                                pageId={pageId}
                                publishedVersionId={currentPublishedVersionId}
                            />
                        </Collapse>
                    </Box>
                </>
            )}

            <Divider />

            {/* Version History */}
            <Box>
                <Group justify="space-between" mb="sm">
                    <Group gap="xs">
                        <IconGitBranch size={20} />
                        <Text size="sm" fw={600}>Version History</Text>
                    </Group>
                    {versions.length > 0 && (
                        <Text size="xs" c="dimmed">
                            {versions.length} version{versions.length !== 1 ? 's' : ''}
                        </Text>
                    )}
                </Group>

                <VersionHistoryList
                    versions={versions}
                    currentPublishedVersionId={currentPublishedVersionId}
                    isLoading={isLoading}
                    error={error}
                    onPublish={onPublishSpecific}
                    onDelete={onDelete}
                    onCompare={handleCompareVersion}
                    onView={handleViewVersion}
                />
            </Box>

            {/* Publish Modal */}
            <PublishVersionModal
                opened={publishModalOpened}
                onClose={() => setPublishModalOpened(false)}
                onPublish={handlePublish}
                isLoading={isPublishing}
            />

            {/* Version Details Modal */}
            <VersionDetailsModal
                opened={detailsModalOpened}
                onClose={() => {
                    setDetailsModalOpened(false);
                    setSelectedVersion(null);
                }}
                version={selectedVersion}
                isPublished={selectedVersion?.id === currentPublishedVersionId}
                onDelete={onDelete}
                onCompare={handleCompareVersion}
                onPublish={onPublishSpecific}
            />

            {/* Version Comparison Modal */}
            <VersionComparisonViewer
                opened={compareModalOpened}
                onClose={() => {
                    setCompareModalOpened(false);
                    setSelectedComparisonVersionId(null);
                }}
                pageId={pageId}
                versions={versions}
                initialVersion1Id={selectedComparisonVersionId || undefined}
                initialVersion2Id={currentPublishedVersionId || undefined}
            />
        </Stack>
    );
}

