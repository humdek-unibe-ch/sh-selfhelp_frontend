"use client";

import { useState, useMemo, useEffect } from 'react';
import {
    Modal,
    Stack,
    Text,
    Button,
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
} from '@mantine/core';
import {
    IconInfoCircle,
    IconDeviceFloppy,
    IconChevronDown,
    IconChevronUp,
    IconSearch,
    IconX,
    IconLock,
} from '@tabler/icons-react';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { useGroupDetails, useUpdateGroupAcls } from '../../../../../hooks/useGroups';
import { convertAclsToApiFormat, convertApiAclsToUiFormat } from '../../../../../utils/acl-conversion.utils';
import { useQueryClient } from '@tanstack/react-query';

export interface IAclPage {
    id: number;
    keyword: string;
    title: string | null;
    type: number;
    isSystem: boolean;
    isConfiguration: boolean;
    permissions: {
        select: boolean;
        insert: boolean;
        update: boolean;
        delete: boolean;
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

const PAGE_TYPE_INFO = {
    1: { label: 'Internal', color: 'gray', description: 'Internal system pages' },
    2: { label: 'Core', color: 'blue', description: 'Core system functionality' },
    3: { label: 'Experiment', color: 'green', description: 'User-accessible experiment pages' },
    4: { label: 'Open', color: 'cyan', description: 'Public access pages' },
    5: { label: 'Maintenance', color: 'orange', description: 'Maintenance pages' },
    6: { label: 'Global Values', color: 'violet', description: 'Global configuration' },
    7: { label: 'Emails', color: 'pink', description: 'Email templates' },
    8: { label: 'Global CSS', color: 'indigo', description: 'Global styling' },
    9: { label: 'Security', color: 'red', description: 'Security related pages' },
} as const;

// Reusable ACL Management Component
export function AclManagement({
    selectedPages,
    onChange,
    readonly = false,
    showHeader = true,
    maxHeight = 400,
    initiallyExpanded = false,
}: IAclManagementProps) {
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
    const [searchTerm, setSearchTerm] = useState('');

    const { pages, isLoading } = useAdminPages();

    useEffect(() => {

    }, [selectedPages]);

    useEffect(() => {
        if (pages.length > 0) {

        }
    }, [pages]);

    // Transform pages and filter by search term
    const filteredPages = useMemo(() => {
        const transformedPages = pages.map(page => {
            const pagePermissions = {
                select: selectedPages.some(p => p.id === page.id_pages && p.permissions.select),
                insert: selectedPages.some(p => p.id === page.id_pages && p.permissions.insert),
                update: selectedPages.some(p => p.id === page.id_pages && p.permissions.update),
                delete: selectedPages.some(p => p.id === page.id_pages && p.permissions.delete),
            };

            if (page.keyword === 'agb' && page.id_pages === 30) {

            }

            return {
                id: page.id_pages,
                keyword: page.keyword,
                title: page.keyword,
                type: page.id_type || 3,
                isSystem: page.is_system === 1,
                isConfiguration: (page.id_type || 0) > 3,
                permissions: pagePermissions,
            };
        });

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

    const handlePermissionChange = (pageId: number, permissionType: keyof IAclPage['permissions'], checked: boolean) => {
        if (readonly) return;

        const existingPageIndex = selectedPages.findIndex(p => p.id === pageId);
        const pageData = filteredPages.find(p => p.id === pageId);

        if (!pageData) return;

        let updatedPages = [...selectedPages];

        if (existingPageIndex >= 0) {
            // Update existing page permissions
            updatedPages[existingPageIndex] = {
                ...updatedPages[existingPageIndex],
                permissions: {
                    ...updatedPages[existingPageIndex].permissions,
                    [permissionType]: checked,
                },
            };

            // Remove page if all permissions are false
            const hasAnyPermission = Object.values(updatedPages[existingPageIndex].permissions).some(Boolean);
            if (!hasAnyPermission) {
                updatedPages.splice(existingPageIndex, 1);
            }
        } else if (checked) {
            // Add new page with the specific permission
            const newPage: IAclPage = {
                id: pageId,
                keyword: pageData.keyword,
                title: pageData.title,
                type: pageData.type,
                isSystem: pageData.isSystem,
                isConfiguration: pageData.isConfiguration,
                permissions: {
                    select: permissionType === 'select',
                    insert: permissionType === 'insert',
                    update: permissionType === 'update',
                    delete: permissionType === 'delete',
                },
            };
            updatedPages.push(newPage);
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
                        <Paper key={page.id} p="xs" style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                            <Stack gap="xs">
                                <Group justify="space-between">
                                    <Group gap="xs">
                                        <Text size="sm" fw={500}>
                                            {page.keyword}
                                        </Text>
                                        {page.title && (
                                            <Text size="xs" c="dimmed">
                                                ({page.title})
                                            </Text>
                                        )}
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
                                </Group>

                                <Group gap="lg">
                                    {(['select', 'insert', 'update', 'delete'] as const).map(permission => (
                                        <Checkbox
                                            key={permission}
                                            label={permission.charAt(0).toUpperCase() + permission.slice(1)}
                                            size="xs"
                                            checked={page.permissions[permission]}
                                            onChange={(event) =>
                                                handlePermissionChange(page.id, permission, event.currentTarget.checked)
                                            }
                                            disabled={readonly}
                                        />
                                    ))}
                                </Group>
                            </Stack>
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
                            Page-based Access Control
                        </Text>
                        <Badge variant="light" color="blue">
                            {selectedPages.length} pages selected
                        </Badge>
                    </Group>
                    <ActionIcon
                        variant="subtle"
                        onClick={() => setIsExpanded(!isExpanded)}
                        size="sm"
                    >
                        {isExpanded ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
                    </ActionIcon>
                </Group>
            )}

            <Collapse in={isExpanded}>
                <Stack gap="md">
                    <Alert icon={<IconInfoCircle size="1rem" />} color="blue" variant="light">
                        <Text size="sm">
                            Configure page-based access control. Set different permission levels
                            (Select, Insert, Update, Delete) for each page category.
                        </Text>
                    </Alert>

                    {/* Search */}
                    <TextInput
                        placeholder="Search pages..."
                        leftSection={<IconSearch size="1rem" />}
                        rightSection={
                            searchTerm && (
                                <ActionIcon
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

                    {/* Page Groups */}
                    <Stack gap="md">
                        {renderPageGroup('System', groupedPages.system, 'red')}
                        {renderPageGroup('Configuration', groupedPages.configuration, 'violet')}
                        {renderPageGroup('Experiment', groupedPages.experiment, 'green')}
                    </Stack>

                    {/* Selected Pages Summary */}
                    {selectedPages.length > 0 && (
                        <Paper p="sm" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
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
    const queryClient = useQueryClient();

    // Fetch group details (including ACLs) - with fresh data when modal opens
    const { data: groupDetails, isLoading: isLoadingGroup, refetch: refetchGroupDetails } = useGroupDetails(groupId);
    const updateAclsMutation = useUpdateGroupAcls();

    // Extract ACLs from group details
    const existingAcls = groupDetails?.acls || [];
    const isLoadingAcls = isLoadingGroup;

    // Refetch group details when modal opens to get fresh data
    useEffect(() => {
        if (opened) {

            // Reset selected pages first to avoid stale data
            setSelectedPages([]);
            // First invalidate to ensure we don't get cached data
            queryClient.invalidateQueries({ queryKey: ['groups', 'detail', groupId] });
            // Then refetch to get fresh data
            refetchGroupDetails();
        }
    }, [opened, groupId, refetchGroupDetails, queryClient]);

    // Load existing ACLs when data is available
    useEffect(() => {
        // Only process if modal is open and we have group details
        if (opened && groupDetails) {


            if (existingAcls.length > 0) {
                const aclPages = convertApiAclsToUiFormat(existingAcls);

                setSelectedPages(aclPages);
            } else {
                // No existing ACLs, start with empty state

                setSelectedPages([]);
            }
        }
    }, [opened, groupDetails, existingAcls]);

    // Reset state when modal closes
    useEffect(() => {
        if (!opened) {
            setSelectedPages([]);
        }
    }, [opened]);

    const handleSave = async () => {
        try {
            // Convert to API format
            const aclsData = convertAclsToApiFormat(selectedPages);


            // Execute the API call
            await updateAclsMutation.mutateAsync({
                groupId,
                data: { acls: aclsData }
            });

            // Force invalidate and refetch all related queries using correct query keys
            await queryClient.invalidateQueries({ queryKey: ['groups'] });
            await queryClient.invalidateQueries({ queryKey: ['groups', 'acls', groupId] });
            await queryClient.invalidateQueries({ queryKey: ['groups', 'detail', groupId] });

            // Also refetch the group details to ensure fresh data immediately
            await refetchGroupDetails();


            onClose();
        } catch (error) {
            // Error handling is done in the mutation hook

        }
    };

    const isLoading = isLoadingAcls;
    const isSubmitting = updateAclsMutation.isPending;

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Text size="lg" fw={600}>
                    Advanced ACL Management - {groupName}
                </Text>
            }
            size="xl"
            centered
        >
            <LoadingOverlay visible={isLoading} />

            <Stack gap="md">
                <AclManagement
                    selectedPages={selectedPages}
                    onChange={setSelectedPages}
                    showHeader={false}
                    maxHeight={500}
                    initiallyExpanded={true}
                />

                <Group justify="flex-end" gap="sm">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        leftSection={<IconDeviceFloppy size="1rem" />}
                        onClick={handleSave}
                        loading={isSubmitting}
                    >
                        Save ACL Changes
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
} 