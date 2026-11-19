/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
"use client";

import { useState, useMemo, useEffect } from 'react';
import {
    Stack,
    Text,
    Group,
    Alert,
    LoadingOverlay,
    Collapse,
    Paper,
    TextInput,
    ActionIcon,
    Checkbox,
    Badge,
    Tooltip,
    Box,
} from '@mantine/core';
import {
    IconInfoCircle,
    IconChevronDown,
    IconChevronUp,
    IconSearch,
    IconX,
    IconLock,
} from '@tabler/icons-react';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import {
    useGroupDetails,
    useUpdateGroupAcls,
} from '../../../../../hooks/useGroups';
import { convertAclsToApiFormat, convertApiAclsToUiFormat } from '../../../../../utils/acl-conversion.utils';
import { ModalWrapper } from '../../../shared';

export interface IAclPage {
    id: number;
    keyword: string;
    title: string | null;
    type: number;
    isSystem: boolean;
    isConfiguration: boolean;
    permissions: {
        select: boolean;
    };
}

interface IAclManagementProps {
    selectedPages: IAclPage[];
    onChange: (pages: IAclPage[]) => void;
    readonly?: boolean;
    showHeader?: boolean;
    maxHeight?: number;
    initiallyExpanded?: boolean;
}

interface IAdvancedAclModalProps {
    opened: boolean;
    onClose: () => void;
    groupId: number;
    groupName: string;
}

// Reusable ACL Management Component
export function AclManagement({
    selectedPages,
    onChange,
    readonly = false,
    showHeader = true,
    initiallyExpanded = false,
}: IAclManagementProps) {
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
    const [searchTerm, setSearchTerm] = useState('');

    const { pages, isLoading } = useAdminPages();

    // Transform pages and filter by search term
    const filteredPages = useMemo(() => {
        const transformedPages = pages.map(page => ({
            id: page.id_pages,
            keyword: page.keyword,
            title: page.keyword,
            type: page.id_page_types || 3,
            isSystem: page.is_system,
            isConfiguration: (page.id_page_types || 0) > 3,
            permissions: {
                select: selectedPages.some(p => p.id === page.id_pages && p.permissions.select),
            },
        }));

        if (!searchTerm) return transformedPages;

        return transformedPages.filter(page =>
            page.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (page.title && page.title.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [pages, selectedPages, searchTerm]);

    // Group pages by category
    const groupedPages = useMemo(() => {
        const systemPages = filteredPages.filter(page => page.isSystem || [1, 2, 9].includes(page.type));
        const configurationPages = filteredPages.filter(page => page.isConfiguration && !page.isSystem);
        const experimentPages = filteredPages.filter(page =>
            !page.isSystem && !page.isConfiguration && [3, 4].includes(page.type)
        );

        return {
            system: systemPages,
            configuration: configurationPages,
            experiment: experimentPages,
        };
    }, [filteredPages]);

    const handleCanSeeChange = (pageId: number, checked: boolean) => {
        if (readonly) return;

        const existingPageIndex = selectedPages.findIndex(p => p.id === pageId);
        const pageData = filteredPages.find(p => p.id === pageId);

        if (!pageData) return;

        let updatedPages = [...selectedPages];

        if (existingPageIndex >= 0) {
            if (!checked) {
                updatedPages.splice(existingPageIndex, 1);
            } else {
                updatedPages[existingPageIndex] = {
                    ...updatedPages[existingPageIndex],
                    permissions: { select: true },
                };
            }
        } else if (checked) {
            updatedPages.push({
                id: pageId,
                keyword: pageData.keyword,
                title: pageData.title,
                type: pageData.type,
                isSystem: pageData.isSystem,
                isConfiguration: pageData.isConfiguration,
                permissions: { select: true },
            });
        }

        onChange(updatedPages);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const renderPageGroup = (title: string, pages: typeof filteredPages, color: string) => {
        if (pages.length === 0) return null;

        return (
            <Paper key={title} p="sm" withBorder>
                <Group justify="space-between" mb="xs">
                    <Group gap="xs">
                        <Badge color={color} variant="light">
                            {title}
                        </Badge>
                        <Text size="sm" fw={500}>{title} Pages</Text>
                    </Group>
                    <Text size="xs" c="dimmed">
                        {pages.length} pages
                    </Text>
                </Group>

                <Stack gap="xs">
                    {pages.map(page => (
                        <Paper key={page.id} p="xs" style={{ backgroundColor: 'var(--mantine-color-default)' }} withBorder>
                            <Group justify="space-between" wrap="nowrap">
                                <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                                    <Text size="sm" fw={500} truncate>
                                        {page.keyword}
                                    </Text>
                                    {page.isSystem && (
                                        <Tooltip label="System Page">
                                            <IconLock size="0.875rem" color="var(--mantine-color-orange-6)" />
                                        </Tooltip>
                                    )}
                                    {page.isConfiguration && (
                                        <Badge size="xs" color="purple" variant="outline">
                                            Config
                                        </Badge>
                                    )}
                                </Group>
                                <Checkbox
                                    label="Can see"
                                    size="xs"
                                    checked={page.permissions.select}
                                    onChange={(event) =>
                                        handleCanSeeChange(page.id, event.currentTarget.checked)
                                    }
                                    disabled={readonly}
                                    aria-label={`Can see ${page.keyword}`}
                                />
                            </Group>
                        </Paper>
                    ))}
                </Stack>
            </Paper>
        );
    };

    if (isLoading) {
        return <Text size="sm" c="dimmed">Loading pages...</Text>;
    }

    return (
        <Stack gap="md">
            {showHeader && (
                <Group justify="space-between">
                    <Group gap="xs">
                        <Text size="sm" fw={500}>
                            Page access
                        </Text>
                        <Badge variant="light" color="blue">
                            {selectedPages.length} pages selected
                        </Badge>
                    </Group>
                    <ActionIcon aria-label={isExpanded ? 'Collapse page list' : 'Expand page list'} aria-expanded={isExpanded}
                        variant="subtle"
                        onClick={() => setIsExpanded(!isExpanded)}
                        size="sm"
                    >
                        {isExpanded ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
                    </ActionIcon>
                </Group>
            )}

            <Collapse expanded={isExpanded}>
                <Stack gap="md">
                    <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
                        <Text size="sm">
                            Members of this group can see these pages and use their forms.
                        </Text>
                    </Alert>

                    <TextInput aria-label="Search pages"
                        placeholder="Search pages..."
                        leftSection={<IconSearch size="1rem" />}
                        rightSection={
                            searchTerm && (
                                <ActionIcon aria-label="Clear search"
                                    variant="subtle"
                                    color="gray"
                                    size="sm"
                                    onClick={clearSearch}
                                >
                                    <IconX size={14} />
                                </ActionIcon>
                            )
                        }
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.currentTarget.value)}
                    />

                    <Stack gap="md">
                        {renderPageGroup('System', groupedPages.system, 'red')}
                        {renderPageGroup('Configuration', groupedPages.configuration, 'violet')}
                        {renderPageGroup('Experiment', groupedPages.experiment, 'green')}
                    </Stack>

                    {selectedPages.length > 0 && (
                        <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-default)' }}>
                            <Text size="sm" fw={500} mb="xs">
                                Selected Pages ({selectedPages.length})
                            </Text>
                            <Group gap="xs">
                                {selectedPages.slice(0, 5).map(page => (
                                    <Badge key={page.id} variant="filled" size="sm">
                                        {page.keyword}
                                    </Badge>
                                ))}
                                {selectedPages.length > 5 && (
                                    <Badge variant="outline" size="sm">
                                        +{selectedPages.length - 5} more
                                    </Badge>
                                )}
                            </Group>
                        </Paper>
                    )}
                </Stack>
            </Collapse>
        </Stack>
    );
}

// Modal wrapper for standalone use
export function AdvancedAclModal({
    opened,
    onClose,
    groupId,
    groupName
}: IAdvancedAclModalProps) {
    const [selectedPages, setSelectedPages] = useState<IAclPage[]>([]);

    // Fetch group details (including ACLs) - with fresh data when modal opens
    const { data: groupDetails, isLoading: isLoadingGroup, refetch: refetchGroupDetails } = useGroupDetails(groupId);
    const updateAclsMutation = useUpdateGroupAcls();

    // Extract ACLs from group details
    const existingAcls = groupDetails?.acls || [];
    // Only block the body with the overlay on the FIRST load (no data yet). The
    // open effect below refetches group details every time the modal opens;
    // that background refetch must NOT re-show a full-body spinner.
    const isLoadingAcls = isLoadingGroup && !groupDetails;

    // Side effect on open: read the ACLs fresh, never from a cached copy, because
    // saving replaces the whole set. One refetch of the reader's own query is
    // enough; it needs no key of its own.
    useEffect(() => {
        if (opened) {
            void refetchGroupDetails();
        }
    }, [opened, groupId, refetchGroupDetails]);

    // Keep selectedPages in sync with open/close, group changes, and loaded ACLs
    // without a set-state-in-effect, tracking the previous inputs (this mirrors
    // the previous open-reset + load + close-reset effects).
    const [prevOpened, setPrevOpened] = useState(opened);
    const [prevGroupId, setPrevGroupId] = useState(groupId);
    const [prevGroupDetails, setPrevGroupDetails] = useState(groupDetails);
    if (prevOpened !== opened || prevGroupId !== groupId) {
        setPrevOpened(opened);
        setPrevGroupId(groupId);
        setPrevGroupDetails(groupDetails);
        if (opened && groupDetails && existingAcls.length > 0) {
            setSelectedPages(convertApiAclsToUiFormat(existingAcls));
        } else {
            setSelectedPages([]);
        }
    } else if (opened && prevGroupDetails !== groupDetails) {
        // Fresh group details arrived after the refetch above.
        setPrevGroupDetails(groupDetails);
        if (existingAcls.length > 0) {
            setSelectedPages(convertApiAclsToUiFormat(existingAcls));
        } else {
            setSelectedPages([]);
        }
    }

    const handleSave = async () => {
        try {
            const aclsData = convertAclsToApiFormat(selectedPages);

            // The mutation hook invalidates the group root on success, which
            // refetches the lists, this group's ACLs and its details.
            await updateAclsMutation.mutateAsync({ groupId, data: { acls: aclsData } });

            onClose();
        } catch {
            // Error handling is done in the mutation hook
        }
    };

    const isLoading = isLoadingAcls;
    const isSubmitting = updateAclsMutation.isPending;

    return (
        <ModalWrapper
            opened={opened}
            onClose={onClose}
            title={`Page access - ${groupName}`}
            size="xl"
            onCancel={onClose}
            onSave={() => {
                void handleSave();
            }}
            isLoading={isSubmitting}
            saveLabel="Save page access"
            cancelLabel="Cancel"
            scrollAreaHeight="calc(100dvh - 14rem)"
        >
            <Box pos="relative">
                <LoadingOverlay visible={isLoading} zIndex={1} overlayProps={{ blur: 1 }} />

                {/* Asset access is set per asset (its groups) on the Assets page. */}
                <AclManagement
                    selectedPages={selectedPages}
                    onChange={setSelectedPages}
                    showHeader={false}
                    maxHeight={500}
                    initiallyExpanded={true}
                />
            </Box>
        </ModalWrapper>
    );
}
