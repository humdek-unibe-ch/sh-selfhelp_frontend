"use client";

import { useEffect} from 'react';

import { 
    Modal, 
    Stack, 
    TextInput, 
    Checkbox, 
    Radio, 
    Group, 
    Text, 
    Button, 
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

import { IconInfoCircle, IconEdit, IconLock } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { PAGE_ACCESS_TYPES, PAGE_ACCESS_TYPES_MOBILE_AND_WEB } from '../../../../../constants/lookups.constants';
import { ICreatePageFormValues, ICreatePageModalProps, IMenuPageItem } from '../../../../../types/forms/create-page.types';
import { DragDropMenuPositioner } from '../../../ui/drag-drop-menu-positioner/DragDropMenuPositioner';
import { ICreatePageRequest } from '../../../../../types/requests/admin/create-page.types';
import { debug } from '../../../../../utils/debug-logger';
import styles from './CreatePage.module.css';



export const CreatePageModal = ({ opened, onClose, parentPage = null }: ICreatePageModalProps) => {

    
    // React Query client for cache invalidation
    const queryClient = useQueryClient();
    
    // Create page mutation
    const createPageMutation = useCreatePageMutation({
        onSuccess: (createdPage) => {
                    // Reset form and state on successful creation
        form.reset();
        onClose();
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

    // Generate URL pattern based on keyword and navigation page setting
    const generateUrlPattern = (keyword: string, isNavigation: boolean) => {
        if (!keyword.trim()) return '';
        // Remove spaces and convert to lowercase for URL safety
        const cleanKeyword = keyword.trim().toLowerCase().replace(/\s+/g, '-');
        const baseUrl = `/${cleanKeyword}`;
        return isNavigation ? `${baseUrl}/[i:nav]` : baseUrl;
    };

    // Update URL pattern when keyword or navigation page changes
    useEffect(() => {
        const urlPattern = generateUrlPattern(form.values.keyword, form.values.navigationPage);
        form.setFieldValue('urlPattern', urlPattern);
    }, [form.values.keyword, form.values.navigationPage]);





    // Handle form submission
    const handleSubmit = async (values: ICreatePageFormValues) => {
        // The DragDropMenuPositioner component handles position calculation internally
        // We just need to pass the position values from the form
        const submitData: ICreatePageRequest = {
            keyword: values.keyword,
            page_access_type_code: values.pageAccessType,
            is_headless: values.headlessPage,
            is_open_access: values.openAccess,
            url: values.urlPattern,
            nav_position: values.headerMenu && values.headerMenuPosition !== null ? values.headerMenuPosition : undefined,
            footer_position: values.footerMenu && values.footerMenuPosition !== null ? values.footerMenuPosition : undefined,
            parent: values.parentPage || undefined,
        };

        debug('Creating new page', 'CreatePageModal', {
            ...submitData,
            headerMenuEnabled: values.headerMenu,
            footerMenuEnabled: values.footerMenu,
        });
        
        // Use the mutation instead of direct API call
        createPageMutation.mutate(submitData);
    };

    // Handle create button click
    const handleCreateClick = () => {
        form.onSubmit(handleSubmit)();
    };

    // Handle modal close
    const handleClose = () => {
        form.reset();
        form.setFieldValue('headerMenuPosition', null);
        form.setFieldValue('footerMenuPosition', null);
        onClose();
    };



    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={parentPage ? `Create Child Page under "${parentPage.keyword}"` : "Create New Page"}
            size="xl"
            centered
            className={styles.modalContainer}
        >
            <Box pos="relative" className={styles.modalContent}>
                <LoadingOverlay visible={pagesLoading} />
                

                    {/* Scrollable Content Area */}
                    <Box className={styles.scrollableContent}>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="lg" p="lg">
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
                                                <Group gap="xl" className={styles.pageAccessRadioGroup}>
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
                                                            style={{ cursor: 'pointer' }}
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
                                                parentPage={parentPage}
                                                checkboxLabel="Footer Menu"
                                            />
                                        </SimpleGrid>
                                    </Stack>
                                </Paper>
                            </Stack>
                        </form>
                    </Box>

                    {/* Fixed Action Buttons */}
                    <Box className={styles.actionButtons}>
                        <Group justify="flex-end" gap="md">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleCreateClick}
                                loading={createPageMutation.isPending}
                                disabled={createPageMutation.isPending}
                            >
                                Create Page
                            </Button>
                        </Group>
                    </Box>
            </Box>
        </Modal>
    );
};
