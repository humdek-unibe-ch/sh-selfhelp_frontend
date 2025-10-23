'use client';

import {
    Stack,
    Group,
    Text,
    Button,
    Card,
    Badge,
    TextInput,
    Modal,
    Select,
    SegmentedControl,
    ScrollArea,
    Divider,
    ActionIcon,
    Tooltip,
    Paper
} from '@mantine/core';
import {
    IconRocket,
    IconGitCompare,
    IconSearch,
    IconEye,
    IconArrowsRightLeft,
    IconCheck,
    IconClock,
    IconTrash,
    IconRestore
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { IPageVersion } from '../../../../../types/responses/admin/page-version.types';
import { useUnpublishedChanges } from '../../../../../hooks/useUnpublishedChanges';
import { VersionDetailsModal } from '../version-details-modal/VersionDetailsModal';
import { VersionComparisonViewer } from '../version-comparison-viewer/VersionComparisonViewer';
import { PublishVersionModal } from '../publish-version-modal/PublishVersionModal';
import { DeleteVersionModal } from '../delete-version-modal/DeleteVersionModal';
import { RestoreFromVersionModal } from '../restore-from-version-modal/RestoreFromVersionModal';
import styles from './PublishingPanel.module.css';

interface IPublishingPanelProps {
    pageId: number;
    versions: IPageVersion[];
    currentPublishedVersionId: number | null;
    isLoading: boolean;
    error: Error | null;
    onPublishNew: (data?: any) => void;
    onPublishSpecific: (versionId: number) => void;
    onDelete: (versionId: number) => void;
    onRestore?: (versionId: number) => void;
    isPublishing: boolean;
    isDeleting?: boolean;
    isRestoring?: boolean;
}

export function PublishingPanel({
    pageId,
    versions,
    currentPublishedVersionId,
    isLoading,
    error,
    onPublishNew,
    onPublishSpecific,
    onDelete,
    onRestore,
    isPublishing,
    isDeleting = false,
    isRestoring = false
}: IPublishingPanelProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVersion, setSelectedVersion] = useState<IPageVersion | null>(null);
    const [detailsModalOpened, setDetailsModalOpened] = useState(false);
    const [compareModalOpened, setCompareModalOpened] = useState(false);
    const [publishModalOpened, setPublishModalOpened] = useState(false);
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [versionToDelete, setVersionToDelete] = useState<IPageVersion | null>(null);
    const [selectedComparisonVersionId, setSelectedComparisonVersionId] = useState<number | null>(null);
    const [restoreModalOpened, setRestoreModalOpened] = useState(false);
    const [versionToRestore, setVersionToRestore] = useState<IPageVersion | null>(null);

    // Check for unpublished changes
    const { data: changesStatus, isLoading: changesLoading } = useUnpublishedChanges(pageId);

    // Determine publish button state
    const hasUnpublishedChanges = changesStatus?.has_unpublished_changes ?? false;
    const shouldDisablePublish = !hasUnpublishedChanges || changesLoading;

    // Separate published and draft versions
    const publishedVersion = versions.find(v => v.id === currentPublishedVersionId);
    const draftVersions = versions.filter(v => v.id !== currentPublishedVersionId);

    // Filter versions based on search query
    const filteredVersions = useMemo(() => {
        if (!searchQuery.trim()) return [...draftVersions];

        const query = searchQuery.toLowerCase();
        return draftVersions.filter(version =>
            version.version_name?.toLowerCase().includes(query) ||
            version.metadata?.description?.toLowerCase().includes(query) ||
            version.version_number.toString().includes(query)
        );
    }, [draftVersions, searchQuery]);

    // All versions for comparison (Current Draft + published + filtered drafts)
    const allVersionsForComparison = useMemo(() => {
        const result = [...filteredVersions];
        if (publishedVersion) {
            result.unshift(publishedVersion);
        }
        // Add "Current Draft" as the first option
        result.unshift({
            id: -1, // Special ID for draft
            id_pages: pageId,
            version_number: 0,
            version_name: 'Current Draft',
            created_by: null,
            created_at: new Date().toISOString(),
            published_at: null,
            metadata: null,
            is_draft: true
        } as IPageVersion);
        return result;
    }, [filteredVersions, publishedVersion, pageId]);

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

    const handlePublishModalSubmit = (data: { version_name?: string; metadata?: { description?: string } }) => {
        onPublishNew(data);
        setPublishModalOpened(false);
    };

    const handleDeleteVersion = (versionId: number) => {
        const version = versions.find(v => v.id === versionId);
        if (version) {
            setVersionToDelete(version);
            setDeleteModalOpened(true);
        }
    };

    const handleDeleteConfirm = () => {
        if (versionToDelete) {
            onDelete(versionToDelete.id);
            setDeleteModalOpened(false);
            setVersionToDelete(null);
        }
    };

    const handleRestoreVersion = (versionId: number) => {
        if (onRestore) {
            const version = versions.find(v => v.id === versionId);
            if (version) {
                setVersionToRestore(version);
                setRestoreModalOpened(true);
            }
        }
    };

    const handleRestoreConfirm = () => {
        if (versionToRestore && onRestore) {
            onRestore(versionToRestore.id);
            setRestoreModalOpened(false);
            setVersionToRestore(null);
        }
    };

    const formatTimestamp = (dateString: string) => {
        return format(new Date(dateString), 'MMM dd, yyyy • HH:mm');
    };

    return (
        <Stack gap="lg">
            {/* Publish Section */}
            <Paper p="lg" withBorder radius="md" bg="gray.0">
                <Stack gap="md">
                    <Group justify="space-between" align="center">
                        <Stack gap="xs">
                            <Text size="lg" fw={600}>Publishing</Text>
                            {hasUnpublishedChanges && (
                                <Text size="sm" c="orange" fw={500}>
                                    Changes detected since last publish
                                </Text>
                            )}
                        </Stack>

                        <Group gap="sm">
                            {hasUnpublishedChanges && (
                                <Button
                                    variant="light"
                                    color="blue"
                                    leftSection={<IconGitCompare size={16} />}
                                    onClick={() => {
                                        setSelectedComparisonVersionId(-1); // Draft
                                        setCompareModalOpened(true);
                                    }}
                                >
                                    Compare Draft vs Published
                                </Button>
                            )}

                            <Button
                                leftSection={<IconRocket size={16} />}
                                color="green"
                                onClick={() => setPublishModalOpened(true)}
                                loading={isPublishing}
                                disabled={shouldDisablePublish}
                                title={shouldDisablePublish
                                    ? (changesLoading ? 'Checking for changes...' : 'No unpublished changes to publish')
                                    : 'Publish current changes'
                                }
                            >
                                Publish Changes
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Paper>

            {/* Version History Section */}
            <Paper p="lg" withBorder radius="md">
                <Stack gap="md">
                    <Group justify="space-between" align="center">
                        <Text size="lg" fw={600}>Version History</Text>
                        <Badge size="sm" variant="light" color="gray">
                            {versions.length} version{versions.length !== 1 ? 's' : ''}
                        </Badge>
                    </Group>

                    {/* Search Bar */}
                    <TextInput
                        placeholder="Search versions..."
                        leftSection={<IconSearch size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        size="sm"
                        radius="md"
                    />

                    <Divider />

                    {/* Published Version (Pinned at top) */}
                    {publishedVersion && (
                        <Card
                            withBorder
                            radius="md"
                            style={{
                                borderColor: 'var(--mantine-color-green-5)',
                                backgroundColor: 'var(--mantine-color-green-0)'
                            }}
                        >
                            <Group justify="space-between" align="center">
                                <Group gap="sm">
                                    <Badge color="green" variant="filled" leftSection={<IconCheck size={12} />}>
                                        Published
                                    </Badge>
                                    <Stack gap={0}>
                                        <Text size="sm" fw={500}>
                                            {publishedVersion.version_name || `Version ${publishedVersion.version_number}`}
                                        </Text>
                                        <Group gap="xs" align="center">
                                            <IconClock size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                            <Text size="xs" c="dimmed">
                                                {formatTimestamp(publishedVersion.published_at || publishedVersion.created_at)}
                                            </Text>
                                        </Group>
                                    </Stack>
                                </Group>

                                <Group gap="xs">
                                    <Tooltip label="View Info">
                                        <ActionIcon
                                            variant="light"
                                            color="blue"
                                            onClick={() => handleViewVersion(publishedVersion.id)}
                                        >
                                            <IconEye size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    <Tooltip label="Compare">
                                        <ActionIcon
                                            variant="light"
                                            color="gray"
                                            onClick={() => handleCompareVersion(publishedVersion.id)}
                                        >
                                            <IconArrowsRightLeft size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                    {onRestore && (
                                        <Tooltip label="Restore from this version">
                                            <ActionIcon
                                                variant="light"
                                                color="purple"
                                                onClick={() => handleRestoreVersion(publishedVersion.id)}
                                            >
                                                <IconRestore size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>
                            </Group>
                        </Card>
                    )}

                    {/* Draft Versions */}
                    <Stack gap="sm">
                        {filteredVersions.map((version) => (
                            <Card
                                key={version.id}
                                withBorder
                                radius="md"
                                className={styles.versionCard}
                            >
                                <Group justify="space-between" align="center">
                                    <Group gap="sm">
                                        <Badge color="gray" variant="light" leftSection={<IconClock size={12} />}>
                                            Draft
                                        </Badge>
                                        <Stack gap={0}>
                                            <Text size="sm" fw={500}>
                                                {version.version_name || `Version ${version.version_number}`}
                                            </Text>
                                            <Group gap="xs" align="center">
                                                <IconClock size={12} style={{ color: 'var(--mantine-color-dimmed)' }} />
                                                <Text size="xs" c="dimmed">
                                                    {formatTimestamp(version.created_at)}
                                                </Text>
                                            </Group>
                                            {version.metadata?.description && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                    {version.metadata.description}
                                                </Text>
                                            )}
                                        </Stack>
                                    </Group>

                                    <Group gap="xs">
                                        <Tooltip label="View Info">
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                onClick={() => handleViewVersion(version.id)}
                                            >
                                                <IconEye size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <Tooltip label="Compare">
                                            <ActionIcon
                                                variant="light"
                                                color="gray"
                                                onClick={() => handleCompareVersion(version.id)}
                                            >
                                                <IconArrowsRightLeft size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                        {onRestore && (
                                            <Tooltip label="Restore from this version">
                                                <ActionIcon
                                                    variant="light"
                                                    color="purple"
                                                    onClick={() => handleRestoreVersion(version.id)}
                                                >
                                                    <IconRestore size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        )}
                                        <Tooltip label="Delete Version">
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDeleteVersion(version.id)}
                                            >
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>
                            </Card>
                        ))}

                        {filteredVersions.length === 0 && searchQuery && (
                            <Text size="sm" c="dimmed" ta="center" py="md">
                                No versions match your search
                            </Text>
                        )}
                    </Stack>
                </Stack>
            </Paper>

            {/* Version Details Modal */}
            <VersionDetailsModal
                opened={detailsModalOpened}
                onClose={() => {
                    setDetailsModalOpened(false);
                    setSelectedVersion(null);
                }}
                version={selectedVersion}
                isPublished={selectedVersion?.id === currentPublishedVersionId}
            />

            {/* Delete Version Modal */}
            <DeleteVersionModal
                opened={deleteModalOpened}
                onClose={() => {
                    setDeleteModalOpened(false);
                    setVersionToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                version={versionToDelete}
                isLoading={isDeleting}
            />

            {/* Publish Version Modal */}
            <PublishVersionModal
                opened={publishModalOpened}
                onClose={() => setPublishModalOpened(false)}
                onPublish={handlePublishModalSubmit}
                isLoading={isPublishing}
            />

            {/* Version Comparison Modal */}
            <VersionComparisonViewer
                opened={compareModalOpened}
                onClose={() => {
                    setCompareModalOpened(false);
                    setSelectedComparisonVersionId(null);
                }}
                pageId={pageId}
                versions={allVersionsForComparison}
                initialVersion1Id={selectedComparisonVersionId === -1 ? -1 : (selectedComparisonVersionId || undefined)}
                initialVersion2Id={currentPublishedVersionId ?? undefined}
            />

            {/* Restore from Version Modal */}
            <RestoreFromVersionModal
                opened={restoreModalOpened}
                onClose={() => {
                    setRestoreModalOpened(false);
                    setVersionToRestore(null);
                }}
                onConfirm={handleRestoreConfirm}
                version={versionToRestore}
                hasUnpublishedChanges={hasUnpublishedChanges}
                isRestoring={isRestoring}
            />
        </Stack>
    );
}
