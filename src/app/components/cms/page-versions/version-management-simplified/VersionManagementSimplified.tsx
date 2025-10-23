'use client';

import { Stack, Group, Text, Button, Paper, Badge, Divider, Modal } from '@mantine/core';
import { IconRocket, IconHistory, IconGitCompare, IconAlertCircle, IconEye } from '@tabler/icons-react';
import { useState } from 'react';
import { IPageVersion } from '../../../../../types/responses/admin/page-version.types';
import { VersionStatusBadge } from '../version-status-badge/VersionStatusBadge';
import { VersionHistoryList } from '../version-history-list/VersionHistoryList';
import { PublishVersionModal } from '../publish-version-modal/PublishVersionModal';
import { VersionDetailsModal } from '../version-details-modal/VersionDetailsModal';
import { VersionComparisonViewer } from '../version-comparison-viewer/VersionComparisonViewer';
import { useUnpublishedChanges } from '../../../../../hooks/useUnpublishedChanges';
import { AutoVersionComparison } from '../auto-version-comparison/AutoVersionComparison';

interface IVersionManagementSimplifiedProps {
    pageId: number;
    versions: IPageVersion[];
    currentPublishedVersionId: number | null;
    isLoading: boolean;
    error: Error | null;
    onPublishNew: (data?: any) => void;
    onPublishSpecific: (versionId: number) => void;
    onUnpublish: () => void;
    onDelete: (versionId: number) => void;
    isPublishing: boolean;
    isUnpublishing: boolean;
}

export function VersionManagementSimplified({
    pageId,
    versions,
    currentPublishedVersionId,
    isLoading,
    error,
    onPublishNew,
    onPublishSpecific,
    onUnpublish,
    onDelete,
    isPublishing,
    isUnpublishing
}: IVersionManagementSimplifiedProps) {
    const [publishModalOpened, setPublishModalOpened] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<IPageVersion | null>(null);
    const [detailsModalOpened, setDetailsModalOpened] = useState(false);
    const [compareModalOpened, setCompareModalOpened] = useState(false);
    const [draftCompareModalOpened, setDraftCompareModalOpened] = useState(false);
    const [selectedComparisonVersionId, setSelectedComparisonVersionId] = useState<number | null>(null);
    
    const hasPublishedVersion = currentPublishedVersionId !== null && currentPublishedVersionId !== undefined;
    const publishedVersion = versions.find(v => v.id === currentPublishedVersionId);
    
    // Check for unpublished changes
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
        <Stack gap="lg">
            {/* Status Card */}
            <Paper p="lg" withBorder radius="md">
                <Group justify="space-between" wrap="nowrap">
                    <Stack gap="xs" style={{ flex: 1 }}>
                        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Status</Text>
                        <Group gap="sm">
                            <VersionStatusBadge
                                hasPublishedVersion={hasPublishedVersion}
                                publishedVersionName={publishedVersion?.version_name}
                                publishedAt={publishedVersion?.published_at}
                            />
                            {changesStatus?.has_unpublished_changes && hasPublishedVersion && (
                                <Badge 
                                    size="md" 
                                    color="yellow" 
                                    variant="light"
                                    leftSection={<IconAlertCircle size={14} />}
                                >
                                    Unpublished Changes
                                </Badge>
                            )}
                        </Group>
                    </Stack>

                    <Group gap="xs">
                        <Button
                            leftSection={<IconRocket size={18} />}
                            size="md"
                            onClick={() => setPublishModalOpened(true)}
                            loading={isPublishing}
                            disabled={shouldDisablePublish}
                            title={shouldDisablePublish ? (changesLoading ? 'Checking for changes...' : 'No unpublished changes to publish') : 'Publish current changes'}
                        >
                            Publish
                        </Button>
                        {hasPublishedVersion && (
                            <Button
                                leftSection={<IconHistory size={18} />}
                                variant="light"
                                color="gray"
                                size="md"
                                onClick={onUnpublish}
                                loading={isUnpublishing}
                            >
                                Unpublish
                            </Button>
                        )}
                    </Group>
                </Group>
            </Paper>

            {/* Comparison Actions */}
            {hasPublishedVersion && (
                <Paper p="md" withBorder radius="md">
                    <Group gap="xs">
                        <Button
                            variant="light"
                            leftSection={<IconGitCompare size={18} />}
                            onClick={() => setDraftCompareModalOpened(true)}
                            fullWidth
                        >
                            Compare Draft vs Published
                        </Button>
                        <Button
                            variant="light"
                            color="blue"
                            leftSection={<IconEye size={18} />}
                            onClick={() => handleViewVersion(currentPublishedVersionId)}
                        >
                            View Published
                        </Button>
                    </Group>
                </Paper>
            )}

            {/* Version History */}
            <Paper p="lg" withBorder radius="md">
                <Group justify="space-between" mb="md">
                    <Text size="sm" fw={600}>Version History</Text>
                    {versions.length > 0 && (
                        <Badge size="sm" variant="light" color="gray">
                            {versions.length} version{versions.length !== 1 ? 's' : ''}
                        </Badge>
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
            </Paper>

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

            {/* Draft vs Published Comparison Modal */}
            <Modal
                opened={draftCompareModalOpened}
                onClose={() => setDraftCompareModalOpened(false)}
                title={
                    <Group gap="xs">
                        <IconGitCompare size={20} />
                        <Text fw={600}>Draft vs Published</Text>
                    </Group>
                }
                size="xl"
                centered
            >
                <AutoVersionComparison
                    pageId={pageId}
                    publishedVersionId={currentPublishedVersionId}
                />
            </Modal>
        </Stack>
    );
}

