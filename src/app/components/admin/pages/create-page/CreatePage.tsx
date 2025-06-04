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
    Divider,
    Alert,
    LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IconGripVertical, IconInfoCircle } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { PAGE_ACCESS_TYPES, PAGE_ACTIONS } from '../../../../../constants/lookups.constants';
import { ICreatePageFormValues, ICreatePageModalProps, IMenuPageItem } from '../../../../../types/forms/create-page.types';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { debug } from '../../../../../utils/debug-logger';

export const CreatePageModal = ({ opened, onClose }: ICreatePageModalProps) => {
    const [headerMenuPages, setHeaderMenuPages] = useState<IMenuPageItem[]>([]);
    const [footerMenuPages, setFooterMenuPages] = useState<IMenuPageItem[]>([]);
    
    // Fetch lookups and admin pages
    const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);
    const pageTypes = useLookupsByType(PAGE_ACTIONS);
    const { pages, isLoading: pagesLoading } = useAdminPages();

    const form = useForm<ICreatePageFormValues>({
        initialValues: {
            keyword: '',
            pageType: 'sections',
            headerMenu: false,
            headerMenuPosition: null,
            footerMenu: false,
            footerMenuPosition: null,
            headlessPage: false,
            pageAccessType: 'mobile_and_web',
            urlPattern: '',
            navigationPage: false,
            openAccess: false,
            customUrlEdit: false,
        },
        validate: {
            keyword: (value) => {
                if (!value.trim()) return 'Keyword is required';
                if (!/^[a-zA-Z0-9_-]+$/.test(value)) return 'Keyword can only contain letters, numbers, hyphens, and underscores';
                return null;
            },
        },
    });

    // Generate URL pattern based on keyword and navigation page setting
    const generateUrlPattern = (keyword: string, isNavigation: boolean) => {
        if (!keyword.trim()) return '';
        const baseUrl = `/${keyword}`;
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
    const handleSubmit = (values: ICreatePageFormValues) => {
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
                <Box
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    style={{
                        ...provided.draggableProps.style,
                        backgroundColor: item.isNew ? 'var(--mantine-color-blue-0)' : 'var(--mantine-color-gray-0)',
                        border: item.isNew ? '2px solid var(--mantine-color-blue-4)' : '1px solid var(--mantine-color-gray-3)',
                        borderRadius: 'var(--mantine-radius-sm)',
                        padding: '8px 12px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: snapshot.isDragging ? 0.8 : 1,
                    }}
                >
                    <Box
                        {...provided.dragHandleProps}
                        style={{
                            cursor: item.isNew ? 'grab' : 'not-allowed',
                            color: item.isNew ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-4)',
                        }}
                    >
                        <IconGripVertical size="1rem" />
                    </Box>
                    <Text size="sm" fw={item.isNew ? 600 : 400}>
                        {item.label}
                    </Text>
                    {item.isNew && (
                        <Text size="xs" c="blue" fw={500}>
                            (New)
                        </Text>
                    )}
                </Box>
            )}
        </Draggable>
    );

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title="Create New Page"
            size="lg"
            centered
        >
            <Box pos="relative">
                <LoadingOverlay visible={pagesLoading} />
                
                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack gap="md">
                        {/* Basic Page Information */}
                        <TextInput
                            label="Keyword"
                            placeholder="Enter page keyword"
                            required
                            {...form.getInputProps('keyword')}
                        />

                        {/* Page Type */}
                        <Box>
                            <Text size="sm" fw={500} mb="xs">Page Type</Text>
                            <Radio.Group
                                value={form.values.pageType}
                                onChange={(value) => form.setFieldValue('pageType', value)}
                            >
                                <Stack gap="xs">
                                    {pageTypes.map((type) => (
                                        <Radio
                                            key={type.lookupCode}
                                            value={type.lookupCode}
                                            label={
                                                <Box>
                                                    <Text size="sm">{type.lookupValue}</Text>
                                                    {type.lookupDescription && (
                                                        <Text size="xs" c="dimmed">{type.lookupDescription}</Text>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    ))}
                                </Stack>
                            </Radio.Group>
                        </Box>

                        <Divider />

                        {/* Header Menu */}
                        <Box>
                            <Checkbox
                                label="Header Menu"
                                {...form.getInputProps('headerMenu', { type: 'checkbox' })}
                            />
                            
                            {form.values.headerMenu && (
                                <Box mt="md">
                                    <Text size="sm" fw={500} mb="xs">Header Menu Position</Text>
                                    <DragDropContext onDragEnd={handleHeaderMenuDragEnd}>
                                        <Droppable droppableId="header-menu">
                                            {(provided) => (
                                                <Box
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    style={{
                                                        minHeight: '100px',
                                                        padding: '8px',
                                                        backgroundColor: 'var(--mantine-color-gray-0)',
                                                        borderRadius: 'var(--mantine-radius-sm)',
                                                        border: '1px dashed var(--mantine-color-gray-4)',
                                                    }}
                                                >
                                                    {addNewPageToHeaderMenu.map((item, index) => 
                                                        renderMenuItem(item, index)
                                                    )}
                                                    {provided.placeholder}
                                                </Box>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                    <Alert icon={<IconInfoCircle size="1rem" />} mt="xs" color="blue">
                                        Drag the new page to set its position in the header menu
                                    </Alert>
                                </Box>
                            )}
                        </Box>

                        {/* Footer Menu */}
                        <Box>
                            <Checkbox
                                label="Footer Menu"
                                {...form.getInputProps('footerMenu', { type: 'checkbox' })}
                            />
                            
                            {form.values.footerMenu && (
                                <Box mt="md">
                                    <Text size="sm" fw={500} mb="xs">Footer Menu Position</Text>
                                    <DragDropContext onDragEnd={handleFooterMenuDragEnd}>
                                        <Droppable droppableId="footer-menu">
                                            {(provided) => (
                                                <Box
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                    style={{
                                                        minHeight: '100px',
                                                        padding: '8px',
                                                        backgroundColor: 'var(--mantine-color-gray-0)',
                                                        borderRadius: 'var(--mantine-radius-sm)',
                                                        border: '1px dashed var(--mantine-color-gray-4)',
                                                    }}
                                                >
                                                    {addNewPageToFooterMenu.map((item, index) => 
                                                        renderMenuItem(item, index)
                                                    )}
                                                    {provided.placeholder}
                                                </Box>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                    <Alert icon={<IconInfoCircle size="1rem" />} mt="xs" color="blue">
                                        Drag the new page to set its position in the footer menu
                                    </Alert>
                                </Box>
                            )}
                        </Box>

                        <Divider />

                        {/* Page Settings */}
                        <Checkbox
                            label="Headless Page"
                            description="Page without header/footer layout"
                            {...form.getInputProps('headlessPage', { type: 'checkbox' })}
                        />

                        {/* Page Access Type */}
                        <Box>
                            <Text size="sm" fw={500} mb="xs">Page Access Type</Text>
                            <Radio.Group
                                value={form.values.pageAccessType}
                                onChange={(value) => form.setFieldValue('pageAccessType', value)}
                            >
                                <Stack gap="xs">
                                    {pageAccessTypes.map((type) => (
                                        <Radio
                                            key={type.lookupCode}
                                            value={type.lookupCode}
                                            label={
                                                <Box>
                                                    <Text size="sm">{type.lookupValue}</Text>
                                                    {type.lookupDescription && (
                                                        <Text size="xs" c="dimmed">{type.lookupDescription}</Text>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    ))}
                                </Stack>
                            </Radio.Group>
                        </Box>

                        {/* URL Pattern */}
                        <TextInput
                            label="URL Pattern"
                            readOnly={!form.values.customUrlEdit}
                            {...form.getInputProps('urlPattern')}
                        />

                        <Checkbox
                            label="Navigation Page"
                            description="Add [i:nav] parameter to URL"
                            {...form.getInputProps('navigationPage', { type: 'checkbox' })}
                        />

                        <Checkbox
                            label="Open Access"
                            description="Page accessible without authentication"
                            {...form.getInputProps('openAccess', { type: 'checkbox' })}
                        />

                        <Checkbox
                            label="Custom URL Edit"
                            description="Enable manual URL pattern editing"
                            {...form.getInputProps('customUrlEdit', { type: 'checkbox' })}
                        />

                        {/* Form Actions */}
                        <Group justify="flex-end" mt="xl">
                            <Button variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={false}>
                                Create Page
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Box>
        </Modal>
    );
};
