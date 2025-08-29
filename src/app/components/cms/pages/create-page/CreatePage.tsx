"use client";

import { useEffect, useRef} from 'react';
import { useRouter } from 'next/navigation';

import {
    Stack,
    TextInput,
    Checkbox,
    Radio,
    Group,
    Text,
    Box,
    Alert,
    LoadingOverlay,
    SimpleGrid,
    ActionIcon,
    Tooltip,
    Title,
    Paper,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useQueryClient } from '@tanstack/react-query';
import { useCreatePageMutation } from '../../../../../hooks/mutations/useCreatePageMutation';
import { ModalWrapper } from '../../../shared';

import { IconInfoCircle, IconEdit, IconLock } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { PAGE_ACCESS_TYPES, PAGE_ACCESS_TYPES_MOBILE_AND_WEB } from '../../../../../constants/lookups.constants';
import { ICreatePageFormValues, ICreatePageModalProps, IMenuPageItem } from '../../../../../types/forms/create-page.types';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { DragDropMenuPositioner } from '../../ui/drag-drop-menu-positioner/DragDropMenuPositioner';
import { ICreatePageRequest } from '../../../../../types/requests/admin/create-page.types';


export const CreatePageModal = ({ opened, onClose, parentPage = null }: ICreatePageModalProps) => {
    const router = useRouter();

    // References to get final positions from DragDropMenuPositioner components
    const headerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);
    const footerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);
    
    // React Query client for cache invalidation
    const queryClient = useQueryClient();
    
    // Create page mutation
    const createPageMutation = useCreatePageMutation({
        onSuccess: (createdPage) => {
            // Reset form and state on successful creation
            form.reset();
            onClose();
            
            // Navigate to the created page after a short delay to allow modal to close
            setTimeout(() => {
                router.push(`/admin/pages/${createdPage.keyword}`);
            }, 100);
        }
    });
    
    // Fetch lookups and admin pages
    const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);
    const { pages, isLoading: pagesLoading } = useAdminPages();

    // Use Mantine's useForm for form management
    const form = useForm<ICreatePageFormValues>({
        initialValues: {
            keyword: '',
            headerMenu: false,
            headerMenuPosition: null,
            footerMenu: false,
            footerMenuPosition: null,
            headlessPage: false,
            pageAccessType: PAGE_ACCESS_TYPES_MOBILE_AND_WEB,
            urlPattern: '',
            navigationPage: false,
            openAccess: false,
            customUrlEdit: false,
            parentPage: parentPage?.id_pages || null,
        },
        validate: {
            keyword: (value) => {
                if (!value?.trim()) return 'Keyword is required';
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Keyword can only contain letters, numbers, hyphens, and underscores';
                return null;
            },
            urlPattern: (value) => {
                if (!value?.trim()) return 'URL pattern is required';
                // Check for valid URL pattern (no spaces, starts with /, valid characters)
                if (!/^\/[a-zA-Z0-9_\-\/\[\]:]+$/.test(value)) {
                    return 'URL pattern must start with / and contain only valid URL characters (no spaces)';
                }
                return null;
            },
        },
    });

    // Generate URL pattern based on keyword, navigation page setting, and parent context
    const generateUrlPattern = (keyword: string, isNavigation: boolean, parentPage: IAdminPage | null) => {
        if (!keyword.trim()) return '';
        
        // Remove spaces and convert to lowercase for URL safety
        const cleanKeyword = keyword.trim().toLowerCase().replace(/\s+/g, '-');
        
        let baseUrl = `/${cleanKeyword}`;
        
        // If this is a child page, prepend the parent's URL path
        if (parentPage && parentPage.url) {
            // Remove leading slash from parent URL and append child keyword
            const parentPath = parentPage.url.startsWith('/') ? parentPage.url.slice(1) : parentPage.url;
            // Remove any existing parameters from parent URL for clean hierarchy
            const cleanParentPath = parentPath.split('/[')[0]; // Remove [i:nav] or other parameters
            baseUrl = `/${cleanParentPath}/${cleanKeyword}`;
        }
        
        return isNavigation ? `${baseUrl}/[i:nav]` : baseUrl;
    };

    // Update URL pattern when keyword, navigation page, or parent changes
    useEffect(() => {
        const urlPattern = generateUrlPattern(form.values.keyword, form.values.navigationPage, parentPage);
        form.setFieldValue('urlPattern', urlPattern);
    }, [form.values.keyword, form.values.navigationPage, parentPage]);





    // Handle form submission
    const handleSubmit = async (values: ICreatePageFormValues) => {
        // Get final calculated positions from DragDropMenuPositioner components
        const finalHeaderPosition = headerMenuGetFinalPosition.current ? headerMenuGetFinalPosition.current() : null;
        const finalFooterPosition = footerMenuGetFinalPosition.current ? footerMenuGetFinalPosition.current() : null;
        
        const submitData: ICreatePageRequest = {
            keyword: values.keyword,
            pageAccessTypeCode: values.pageAccessType,
            headless: values.headlessPage,
            openAccess: values.openAccess,
            url: values.urlPattern,
            navPosition: finalHeaderPosition,
            footerPosition: finalFooterPosition,
            parent: values.parentPage,
        };

        
        // Use the mutation instead of direct API call
        createPageMutation.mutate(submitData);
    };

    // Handle modal close
    const handleClose = () => {
        form.reset();
        form.setFieldValue('headerMenuPosition', null);
        form.setFieldValue('footerMenuPosition', null);
        onClose();
    };



    // Handle create button click
    const handleCreateClick = () => {
        form.onSubmit(handleSubmit)();
    };

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title={parentPage ? `Create Child Page under "${parentPage.keyword}"` : "Create New Page"}
            size="xl"
            onSave={handleCreateClick}
            onCancel={handleClose}
            isLoading={createPageMutation.isPending}
            saveLabel="Create Page"
            cancelLabel="Cancel"
            scrollAreaHeight={600}
        >
            <LoadingOverlay visible={pagesLoading} />

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="lg">
                                {/* Context Information */}
                                {parentPage && (
                                    <Alert icon={<IconInfoCircle size="1rem" />} color="blue" mb="md">
                                        <Text size="sm">
                                            Creating a child page under: <Text span fw={600}>{parentPage.keyword}</Text>
                                        </Text>
                                    </Alert>
                                )}

                                {/* Basic Page Information */}
                                <Paper p="md" withBorder>
                                    <Stack gap="md">
                                        <Title order={4} size="h5" c="blue">Basic Information</Title>
                                        
                                        <TextInput
                                            label="Keyword"
                                            placeholder="Enter page keyword"
                                            required
                                            {...form.getInputProps('keyword')}
                                        />

                                        {/* Page Access Type - Horizontal Layout */}
                                        <Box>
                                            <Text size="sm" fw={500} mb="xs">Page Access Type</Text>
                                            <Radio.Group
                                                value={form.values.pageAccessType}
                                                onChange={(value) => form.setFieldValue('pageAccessType', value)}
                                            >
                                                <Group gap="xl">
                                                    {pageAccessTypes.map((type) => (
                                                        <Radio
                                                            key={type.lookupCode}
                                                            value={type.lookupCode}
                                                            label={type.lookupValue}
                                                        />
                                                    ))}
                                                </Group>
                                            </Radio.Group>
                                        </Box>
                                    </Stack>
                                </Paper>

                                {/* Page Settings */}
                                <Paper p="md" withBorder>
                                    <Stack gap="md">
                                        <Title order={4} size="h5" c="blue">Page Settings</Title>
                                        
                                        {/* Horizontal Checkbox Group */}
                                        <Group gap="xl">
                                            <Checkbox
                                                label="Headless Page"
                                                description="No header/footer layout"
                                                {...form.getInputProps('headlessPage', { type: 'checkbox' })}
                                            />
                                            <Checkbox
                                                label="Navigation Page"
                                                description="Add [i:nav] parameter"
                                                {...form.getInputProps('navigationPage', { type: 'checkbox' })}
                                            />
                                            <Checkbox
                                                label="Open Access"
                                                description="Public access"
                                                {...form.getInputProps('openAccess', { type: 'checkbox' })}
                                            />
                                        </Group>

                                        {/* URL Pattern with Floating Edit Button */}
                                        <Box pos="relative">
                                            <TextInput
                                                label="URL Pattern"
                                                placeholder="/your-page-url"
                                                readOnly={!form.values.customUrlEdit}
                                                {...form.getInputProps('urlPattern')}
                                                rightSection={
                                                    <Tooltip 
                                                        label={form.values.customUrlEdit ? "Lock URL editing" : "Enable URL editing"}
                                                        position="left"
                                                    >
                                                        <ActionIcon
                                                            variant={form.values.customUrlEdit ? "filled" : "subtle"}
                                                            color={form.values.customUrlEdit ? "blue" : "gray"}
                                                            onClick={() => form.setFieldValue('customUrlEdit', !form.values.customUrlEdit)}
                                                            className="cursor-pointer"
                                                        >
                                                            {form.values.customUrlEdit ? (
                                                                <IconEdit size="1rem" />
                                                            ) : (
                                                                <IconLock size="1rem" />
                                                            )}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                }
                                            />
                                        </Box>
                                    </Stack>
                                </Paper>

                                {/* Menu Positioning - 2 Columns */}
                                <Paper p="md" withBorder>
                                    <Stack gap="md">
                                        <Title order={4} size="h5" c="blue">Menu Positioning</Title>
                                        
                                        <SimpleGrid cols={2} spacing="md">
                                            {/* Header Menu */}
                                            <DragDropMenuPositioner
                                                menuType="header"
                                                title="Header Menu Position"
                                                newPageKeyword={form.values.keyword}
                                                enabled={form.values.headerMenu}
                                                position={form.values.headerMenuPosition}
                                                onEnabledChange={(enabled) => form.setFieldValue('headerMenu', enabled)}
                                                onPositionChange={(position) => form.setFieldValue('headerMenuPosition', position)}
                                                onGetFinalPosition={(getFinalPositionFn) => {
                                                    headerMenuGetFinalPosition.current = getFinalPositionFn;
                                                }}
                                                parentPage={parentPage}
                                                checkboxLabel="Header Menu"
                                            />

                                            {/* Footer Menu */}
                                            <DragDropMenuPositioner
                                                menuType="footer"
                                                title="Footer Menu Position"
                                                newPageKeyword={form.values.keyword}
                                                enabled={form.values.footerMenu}
                                                position={form.values.footerMenuPosition}
                                                onEnabledChange={(enabled) => form.setFieldValue('footerMenu', enabled)}
                                                onPositionChange={(position) => form.setFieldValue('footerMenuPosition', position)}
                                                onGetFinalPosition={(getFinalPositionFn) => {
                                                    footerMenuGetFinalPosition.current = getFinalPositionFn;
                                                }}
                                                parentPage={parentPage}
                                                checkboxLabel="Footer Menu"
                                            />
                                        </SimpleGrid>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </form>
        </ModalWrapper>
    );
};
