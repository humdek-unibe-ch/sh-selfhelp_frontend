"use client";

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
    Portal
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IconGripVertical, IconInfoCircle, IconEdit, IconLock, IconPlus, IconCheck, IconX } from '@tabler/icons-react';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { AdminApi } from '../../../../../api/admin.api';
import { PAGE_ACCESS_TYPES, PAGE_ACCESS_TYPES_MOBILE_AND_WEB } from '../../../../../constants/lookups.constants';
import { ICreatePageFormValues, ICreatePageModalProps, IMenuPageItem } from '../../../../../types/forms/create-page.types';
import { ICreatePageRequest } from '../../../../../types/requests/admin/create-page.types';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { debug } from '../../../../../utils/debug-logger';
import styles from './CreatePage.module.css';

// DragClonePortal: render children in a portal to <body>
const DragClonePortal = ({ children }: { children: React.ReactNode }) => {
    // Make sure we're in the browser
    if (typeof window === "undefined") return null;
    return createPortal(children, document.body);
};

export const CreatePageModal = ({ opened, onClose }: ICreatePageModalProps) => {
    const [headerMenuPages, setHeaderMenuPages] = useState<IMenuPageItem[]>([]);
    const [footerMenuPages, setFooterMenuPages] = useState<IMenuPageItem[]>([]);
    const [headerDroppedIndex, setHeaderDroppedIndex] = useState<number | null>(null);
    const [footerDroppedIndex, setFooterDroppedIndex] = useState<number | null>(null);
    
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
            position: (headerMenuPages.length + 1) * 10, // Simple default position
            isNew: true
        };

        // If we have a dropped index, insert at that position
        if (headerDroppedIndex !== null) {
            const result = [...headerMenuPages];
            result.splice(headerDroppedIndex, 0, newPage);
            return result;
        }

        // Default: add at the end
        return [...headerMenuPages, newPage];
    }, [headerMenuPages, form.values.keyword, form.values.headerMenu, headerDroppedIndex]);

    // Add new page to footer menu list
    const addNewPageToFooterMenu = useMemo(() => {
        if (!form.values.keyword || !form.values.footerMenu) return footerMenuPages;
        
        const newPage: IMenuPageItem = {
            id: 'new-page-footer',
            keyword: form.values.keyword,
            label: form.values.keyword,
            position: (footerMenuPages.length + 1) * 10, // Simple default position
            isNew: true
        };

        // If we have a dropped index, insert at that position
        if (footerDroppedIndex !== null) {
            const result = [...footerMenuPages];
            result.splice(footerDroppedIndex, 0, newPage);
            return result;
        }

        // Default: add at the end
        return [...footerMenuPages, newPage];
    }, [footerMenuPages, form.values.keyword, form.values.footerMenu, footerDroppedIndex]);

    // Handle drag end for header menu - just store the final index
    const handleHeaderMenuDragEnd = (result: DropResult) => {
        if (!result.destination || !form.values.keyword) return;
        
        // Store both the form position and the visual dropped index
        const destinationIndex = result.destination.index;
        form.setFieldValue('headerMenuPosition', destinationIndex);
        setHeaderDroppedIndex(destinationIndex);
    };

    // Handle drag end for footer menu - just store the final index
    const handleFooterMenuDragEnd = (result: DropResult) => {
        if (!result.destination || !form.values.keyword) return;
        
        // Store both the form position and the visual dropped index
        const destinationIndex = result.destination.index;
        form.setFieldValue('footerMenuPosition', destinationIndex);
        setFooterDroppedIndex(destinationIndex);
    };

    // Calculate final position based on index and existing pages
    const calculateFinalPosition = (pages: IMenuPageItem[], targetIndex: number) => {
        if (targetIndex === 0) {
            // First position
            return pages.length > 0 ? pages[0].position / 2 : 10;
        } else if (targetIndex >= pages.length) {
            // Last position
            return pages.length > 0 ? pages[pages.length - 1].position + 10 : 10;
        } else {
            // Between two pages
            const prevPage = pages[targetIndex - 1];
            const nextPage = pages[targetIndex];
            return (prevPage.position + nextPage.position) / 2;
        }
    };

    // Handle form submission
    const handleSubmit = async (values: ICreatePageFormValues) => {
        // Calculate final positions only on submit
        let finalHeaderPosition = null;
        let finalFooterPosition = null;

        if (values.headerMenu && values.headerMenuPosition !== null) {
            finalHeaderPosition = calculateFinalPosition(headerMenuPages, values.headerMenuPosition);
        }

        if (values.footerMenu && values.footerMenuPosition !== null) {
            finalFooterPosition = calculateFinalPosition(footerMenuPages, values.footerMenuPosition);
        }

        const submitData: ICreatePageRequest = {
            keyword: values.keyword,
            page_access_type_id: values.pageAccessType,
            is_headless: values.headlessPage,
            is_open_page: values.openAccess,
            url: values.customUrlEdit ? values.urlPattern : undefined,
            nav_position: finalHeaderPosition || undefined,
            footer_position: finalFooterPosition || undefined,
        };

        debug('Creating new page with calculated positions', 'CreatePageModal', submitData);
        
        try {
            const createdPage = await AdminApi.createPage(submitData);
            
            // Success notification
            notifications.show({
                title: 'Page Created Successfully',
                message: `Page "${createdPage.keyword}" was created successfully!`,
                icon: <IconCheck size="1rem" />,
                color: 'green',
                autoClose: 5000,
                position: 'top-center',
            });
            
            debug('Page created successfully', 'CreatePageModal', createdPage);
            onClose();
            
        } catch (error: any) {
            debug('Error creating page', 'CreatePageModal', { error, submitData });
            console.log('Full error object:', error);
            console.log('Error type:', typeof error);
            console.log('Error keys:', Object.keys(error || {}));
            console.log('Error response:', error?.response);
            console.log('Error response data:', error?.response?.data);
            
            let errorMessage = 'Page creation failed. Please try again.';
            let errorTitle = 'Page Creation Failed';
            let errorCaught = false;
            
            try {
                // Handle different types of errors
                if (error?.response?.data) {
                    // Axios error with response data (most common case)
                    const status = error.response.status;
                    const responseData = error.response.data;
                    console.log('Axios error with data - Status:', status, 'Data:', responseData);
                    
                    // Check if responseData has status/message/error fields (your error format)
                    if (responseData.status || responseData.message || responseData.error) {
                        const errorStatus = responseData.status || status;
                        
                        if (errorStatus === 500) {
                            errorTitle = 'Server Error';
                            errorMessage = responseData.error || responseData.message || 'A server error occurred. Please try again later or contact support.';
                        } else if (errorStatus === 400) {
                            errorTitle = 'Invalid Request';
                            errorMessage = responseData.error || responseData.message || 'The request is invalid. Please check your inputs and try again.';
                        } else if (errorStatus === 422) {
                            errorTitle = 'Validation Error';
                            errorMessage = responseData.error || responseData.message || 'Request validation failed. Please check your inputs and try again.';
                        } else if (errorStatus === 409) {
                            errorTitle = 'Page Already Exists';
                            errorMessage = `A page with keyword "${values.keyword}" already exists. Please choose a different keyword.`;
                        } else {
                            errorMessage = responseData.error || responseData.message || `Server returned error ${errorStatus}. Please try again.`;
                        }
                        errorCaught = true;
                    } else {
                        // Standard Axios error response
                        if (status === 400) {
                            errorTitle = 'Invalid Page Data';
                            errorMessage = 'The page data is invalid. Please check your inputs and try again.';
                        } else if (status === 409) {
                            errorTitle = 'Page Already Exists';
                            errorMessage = `A page with keyword "${values.keyword}" already exists. Please choose a different keyword.`;
                        } else if (status === 422) {
                            errorTitle = 'Validation Error';
                            errorMessage = 'Please check your form inputs and try again.';
                        } else if (status === 500) {
                            errorTitle = 'Server Error';
                            errorMessage = 'A server error occurred. Please try again later or contact support.';
                        } else {
                            errorMessage = `Server returned error ${status}. Please try again.`;
                        }
                        errorCaught = true;
                    }
                } else if (error?.response) {
                    // Axios error without data
                    const status = error.response.status;
                    console.log('Axios error without data - Status:', status);
                    errorMessage = `Server returned error ${status}. Please try again.`;
                    errorCaught = true;
                } else if (error?.status) {
                    // Direct error object with status (your error format)
                    const status = error.status;
                    console.log('Direct error object - Status:', status, 'Message:', error.message, 'Error:', error.error);
                    
                    if (status === 500) {
                        errorTitle = 'Server Error';
                        errorMessage = error.error || error.message || 'A server error occurred. Please try again later or contact support.';
                    } else if (status === 400) {
                        errorTitle = 'Invalid Request';
                        errorMessage = error.error || error.message || 'The request is invalid. Please check your inputs and try again.';
                    } else if (status === 422) {
                        errorTitle = 'Validation Error';
                        errorMessage = error.error || error.message || 'Request validation failed. Please check your inputs and try again.';
                    } else {
                        errorMessage = error.error || error.message || `Server returned error ${status}. Please try again.`;
                    }
                    errorCaught = true;
                } else if (error?.message) {
                    // Network or other errors
                    console.log('Message-based error:', error.message);
                    if (error.message.includes('fetch')) {
                        errorTitle = 'Network Error';
                        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
                    } else if (error.message.includes('timeout')) {
                        errorTitle = 'Request Timeout';
                        errorMessage = 'The request took too long to complete. Please try again.';
                    } else {
                        errorMessage = error.message;
                    }
                    errorCaught = true;
                } else if (typeof error === 'string') {
                    // String error
                    console.log('String error:', error);
                    errorMessage = error;
                    errorCaught = true;
                }
                
                if (!errorCaught) {
                    // Completely unknown error format
                    console.log('Unknown error format, using fallback');
                    errorTitle = 'Page Creation Failed';
                    errorMessage = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
                }
                
            } catch (parseError) {
                // If error parsing fails, use fallback
                debug('Error parsing error response', 'CreatePageModal', { parseError, originalError: error });
                console.error('Error parsing failed:', parseError);
                errorTitle = 'Page Creation Failed';
                errorMessage = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
            }
            
            // GUARANTEED error notification - this will ALWAYS execute
            console.log('Showing error notification:', { errorTitle, errorMessage });
            notifications.show({
                title: errorTitle,
                message: errorMessage,
                icon: <IconX size="1rem" />,
                color: 'red',
                autoClose: 8000,
                position: 'top-center',
            });
            
            console.error('Page creation failed:', {
                error,
                submitData,
                errorMessage,
                errorTitle
            });
        }
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
        setHeaderDroppedIndex(null);
        setFooterDroppedIndex(null);
        setHeaderMenuPages(processMenuPages.header);
        setFooterMenuPages(processMenuPages.footer);
        onClose();
    };

    // Render menu item for drag and drop
    const renderMenuItem = (item: IMenuPageItem, index: number) => {
        return (
            <Draggable 
                key={item.id} 
                draggableId={item.id} 
                index={index}
                isDragDisabled={!item.isNew} // Only new pages can be dragged
            >
                {(provided, snapshot) => {
                    const draggableContent = (
                        <Paper
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...(item.isNew ? provided.dragHandleProps : {})} // Only apply drag handle to new items
                            p="xs"
                            mb="xs"
                            withBorder
                            className={`${styles.item} ${item.isNew ? styles.newPageItem : ''} ${snapshot.isDragging ? styles.itemDragging : ''}`}
                            style={{
                                ...provided.draggableProps.style,
                            }}
                        >
                            <Group gap="xs" wrap="nowrap">
                                <ActionIcon
                                    variant="subtle"
                                    size="sm"
                                    className={item.isNew ? styles.dragItem : styles.dragItemDisabled}
                                    style={{ pointerEvents: 'none' }}
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
                    );

                    // If dragging, render in portal to escape modal transform
                    if (snapshot.isDragging) {
                        return <DragClonePortal>{draggableContent}</DragClonePortal>;
                    }
                    
                    // Normal rendering
                    return draggableContent;
                }}
            </Draggable>
        );
    };

    // Render drag and drop area
    const renderDragDropArea = (
        items: IMenuPageItem[], 
        droppableId: string, 
        onDragEnd: (result: DropResult) => void,
        title: string
    ) => (
        <Box className={styles.dragContainer}>
            <Text size="sm" fw={500} mb="xs">{title}</Text>
            <DragDropContext 
                onDragEnd={onDragEnd}
            >
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
            title="Create New Page"
            size="xl"
            centered
            className={styles.modalContainer}
        >
            <Box pos="relative" className={styles.modalContent}>
                <LoadingOverlay visible={pagesLoading} />
                
                <DragDropContext 
                    onDragEnd={(result) => {
                        if (result.source.droppableId === 'header-menu') {
                            handleHeaderMenuDragEnd(result);
                        } else if (result.source.droppableId === 'footer-menu') {
                            handleFooterMenuDragEnd(result);
                        }
                    }}
                >
                    {/* Scrollable Content Area */}
                    <Box className={styles.scrollableContent}>
                        <form onSubmit={form.onSubmit(handleSubmit)}>
                            <Stack gap="lg" p="lg">
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
                            >
                                Create Page
                            </Button>
                        </Group>
                    </Box>
                </DragDropContext>
            </Box>
        </Modal>
    );
};
