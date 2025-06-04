"use client";

import { useEffect, useState, useMemo } from 'react';
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
    Paper
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IconGripVertical, IconInfoCircle, IconEdit, IconLock, IconPlus } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { PAGE_ACCESS_TYPES, PAGE_ACCESS_TYPES_MOBILE_AND_WEB } from '../../../../../constants/lookups.constants';
import { ICreatePageFormValues, ICreatePageModalProps, IMenuPageItem } from '../../../../../types/forms/create-page.types';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { debug } from '../../../../../utils/debug-logger';
import styles from './CreatePage.module.css';

export const CreatePageModal = ({ opened, onClose }: ICreatePageModalProps) => {
    const [headerMenuPages, setHeaderMenuPages] = useState<IMenuPageItem[]>([]);
    const [footerMenuPages, setFooterMenuPages] = useState<IMenuPageItem[]>([]);
    
    // Fetch lookups and admin pages
    const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);
    const { pages, isLoading: pagesLoading } = useAdminPages();

    // Use Mantine's useForm for form management
    const form = useForm<ICreatePageFormValues>({
        initialValues: {
            keyword: '',
            pageType: 'sections', // Keep for backend compatibility but don't show in UI
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

    // Process admin pages into menu items
    const processMenuPages = useMemo(() => {
        if (!pages.length) return { header: [], footer: [] };

        const headerPages: IMenuPageItem[] = [];
        const footerPages: IMenuPageItem[] = [];

        const processPage = (page: IAdminPage) => {
            // Header menu pages (pages with nav_position)
            if (page.nav_position !== null) {
                headerPages.push({
                    id: page.id_pages.toString(),
                    keyword: page.keyword,
                    label: page.keyword,
                    position: page.nav_position
                });
            }

            // Footer menu pages (for now, we'll use pages without nav_position as potential footer pages)
            // This might need adjustment based on actual footer_position field
            if (page.nav_position === null) {
                footerPages.push({
                    id: page.id_pages.toString(),
                    keyword: page.keyword,
                    label: page.keyword,
                    position: footerPages.length + 1
                });
            }

            // Process children recursively
            if (page.children) {
                page.children.forEach(processPage);
            }
        };

        pages.forEach(processPage);

        // Sort header pages by position
        headerPages.sort((a, b) => a.position - b.position);

        debug('Processed menu pages', 'CreatePageModal', {
            headerPagesCount: headerPages.length,
            footerPagesCount: footerPages.length
        });

        return { header: headerPages, footer: footerPages };
    }, [pages]);

    // Initialize menu pages when data is available
    useEffect(() => {
        setHeaderMenuPages(processMenuPages.header);
        setFooterMenuPages(processMenuPages.footer);
    }, [processMenuPages]);

    // Add new page to header menu list
    const addNewPageToHeaderMenu = useMemo(() => {
        if (!form.values.keyword || !form.values.headerMenu) return headerMenuPages;
        
        const newPage: IMenuPageItem = {
            id: 'new-page',
            keyword: form.values.keyword,
            label: form.values.keyword,
            position: form.values.headerMenuPosition || (headerMenuPages.length + 1) * 10,
            isNew: true
        };

        const allPages = [...headerMenuPages, newPage];
        return allPages.sort((a, b) => a.position - b.position);
    }, [headerMenuPages, form.values.keyword, form.values.headerMenu, form.values.headerMenuPosition]);

    // Add new page to footer menu list
    const addNewPageToFooterMenu = useMemo(() => {
        if (!form.values.keyword || !form.values.footerMenu) return footerMenuPages;
        
        const newPage: IMenuPageItem = {
            id: 'new-page-footer',
            keyword: form.values.keyword,
            label: form.values.keyword,
            position: form.values.footerMenuPosition || (footerMenuPages.length + 1) * 10,
            isNew: true
        };

        const allPages = [...footerMenuPages, newPage];
        return allPages.sort((a, b) => a.position - b.position);
    }, [footerMenuPages, form.values.keyword, form.values.footerMenu, form.values.footerMenuPosition]);

    // Handle drag end for header menu
    const handleHeaderMenuDragEnd = (result: DropResult) => {
        if (!result.destination || !form.values.keyword) return;

        const newPageIndex = addNewPageToHeaderMenu.findIndex(page => page.isNew);
        if (newPageIndex === -1) return;

        const destIndex = result.destination.index;
        const prevPage = destIndex > 0 ? addNewPageToHeaderMenu[destIndex - 1] : null;
        const nextPage = destIndex < addNewPageToHeaderMenu.length - 1 ? addNewPageToHeaderMenu[destIndex] : null;
        
        let newPosition: number;
        if (!prevPage) {
            newPosition = nextPage ? nextPage.position / 2 : 10;
        } else if (!nextPage) {
            newPosition = prevPage.position + 10;
        } else {
            newPosition = (prevPage.position + nextPage.position) / 2;
        }

        form.setFieldValue('headerMenuPosition', newPosition);
    };

    // Handle drag end for footer menu
    const handleFooterMenuDragEnd = (result: DropResult) => {
        if (!result.destination || !form.values.keyword) return;

        const newPageIndex = addNewPageToFooterMenu.findIndex(page => page.isNew);
        if (newPageIndex === -1) return;

        const destIndex = result.destination.index;
        const prevPage = destIndex > 0 ? addNewPageToFooterMenu[destIndex - 1] : null;
        const nextPage = destIndex < addNewPageToFooterMenu.length - 1 ? addNewPageToFooterMenu[destIndex] : null;
        
        let newPosition: number;
        if (!prevPage) {
            newPosition = nextPage ? nextPage.position / 2 : 10;
        } else if (!nextPage) {
            newPosition = prevPage.position + 10;
        } else {
            newPosition = (prevPage.position + nextPage.position) / 2;
        }

        form.setFieldValue('footerMenuPosition', newPosition);
    };

    // Handle form submission
    const handleSubmit = async (values: ICreatePageFormValues) => {
        debug('Creating new page', 'CreatePageModal', values);
        // TODO: Implement API call to create page
        onClose();
    };

    // Handle modal close
    const handleClose = () => {
        form.reset();
        setHeaderMenuPages(processMenuPages.header);
        setFooterMenuPages(processMenuPages.footer);
        onClose();
    };

    // Render menu item for drag and drop
    const renderMenuItem = (item: IMenuPageItem, index: number) => (
        <Draggable key={item.id} draggableId={item.id} index={index}>
            {(provided, snapshot) => (
                <Paper
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    p="xs"
                    mb="xs"
                    withBorder
                    className={item.isNew ? styles.newPageItem : ''}
                >
                    <Group gap="xs" wrap="nowrap">
                        <ActionIcon
                            {...provided.dragHandleProps}
                            variant="subtle"
                            size="sm"
                            className={item.isNew ? styles.dragItem : styles.dragItemDisabled}
                        >
                            <IconGripVertical size="0.8rem" />
                        </ActionIcon>
                        <Text size="sm" fw={item.isNew ? 600 : 400} style={{ flex: 1 }}>
                            {item.label}
                        </Text>
                        {item.isNew && (
                            <Text size="xs" c="blue" fw={500}>
                                New
                            </Text>
                        )}
                    </Group>
                </Paper>
            )}
        </Draggable>
    );

    // Render drag and drop area
    const renderDragDropArea = (
        items: IMenuPageItem[], 
        droppableId: string, 
        onDragEnd: (result: DropResult) => void,
        title: string
    ) => (
        <Box>
            <Text size="sm" fw={500} mb="xs">{title}</Text>
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={droppableId}>
                    {(provided, snapshot) => (
                        <Box
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            p="sm"
                            className={styles.dragArea}
                        >
                            {items.map((item, index) => renderMenuItem(item, index))}
                            {provided.placeholder}
                            {items.length === 0 && (
                                <Text size="sm" c="dimmed" ta="center" mt="md">
                                    No pages to display
                                </Text>
                            )}
                        </Box>
                    )}
                </Droppable>
            </DragDropContext>
        </Box>
    );

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group gap="sm">
                    <IconPlus size="1.2rem" />
                    <Title order={3}>Create New Page</Title>
                </Group>
            }
            size="xl"
            centered
            padding="lg"
        >
            <Box pos="relative">
                <LoadingOverlay visible={pagesLoading} />
                
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="lg">
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

                        {/* Menu Positioning - 2 Columns */}
                        <Paper p="md" withBorder>
                            <Stack gap="md">
                                <Title order={4} size="h5" c="blue">Menu Positioning</Title>
                                
                                <Group gap="md" align="flex-start">
                                    <Checkbox
                                        label="Header Menu"
                                        {...form.getInputProps('headerMenu', { type: 'checkbox' })}
                                    />
                                    <Checkbox
                                        label="Footer Menu"
                                        {...form.getInputProps('footerMenu', { type: 'checkbox' })}
                                    />
                                </Group>

                                {(form.values.headerMenu || form.values.footerMenu) && (
                                    <SimpleGrid cols={2} spacing="md">
                                        {/* Header Menu */}
                                        {form.values.headerMenu && (
                                            <Box>
                                                {renderDragDropArea(
                                                    addNewPageToHeaderMenu,
                                                    "header-menu",
                                                    handleHeaderMenuDragEnd,
                                                    "Header Menu Position"
                                                )}
                                                <Alert icon={<IconInfoCircle size="1rem" />} mt="xs" color="blue">
                                                    Drag the new page to set its position
                                                </Alert>
                                            </Box>
                                        )}

                                        {/* Footer Menu */}
                                        {form.values.footerMenu && (
                                            <Box>
                                                {renderDragDropArea(
                                                    addNewPageToFooterMenu,
                                                    "footer-menu",
                                                    handleFooterMenuDragEnd,
                                                    "Footer Menu Position"
                                                )}
                                                <Alert icon={<IconInfoCircle size="1rem" />} mt="xs" color="blue">
                                                    Drag the new page to set its position
                                                </Alert>
                                            </Box>
                                        )}
                                    </SimpleGrid>
                                )}
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

                        {/* Form Actions */}
                        <Group justify="flex-end" mt="md">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                Create Page
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Box>
        </Modal>
    );
};
