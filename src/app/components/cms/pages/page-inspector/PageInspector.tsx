'use client';

import { 
    Paper, 
    Text, 
    Group, 
    Stack,
    Box,
    Alert,
    Button,
    TextInput,
    Modal
} from '@mantine/core';
import { 
    IconDeviceFloppy, 
    IconPlus, 
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { usePageFields } from '../../../../../hooks/usePageDetails';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useDeletePageMutation } from '../../../../../hooks/mutations/useDeletePageMutation';
import { useUpdatePageMutation } from '../../../../../hooks/mutations/useUpdatePageMutation';
import { useLanguages } from '../../../../../hooks/useLanguages';
import { IPageField } from '../../../../../types/responses/admin/page-details.types';
import { 
    FieldRenderer, 
    IFieldData, 
    IInspectorButton,
    InspectorContainer,
    InspectorInfoSection,
} from '../../shared';
import { 
    PageInformation, 
    PageContentSection, 
    PagePropertiesSection 
} from './components';
import { PAGE_ACCESS_TYPES } from '../../../../../constants/lookups.constants';
import styles from './PageInspector.module.css';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { CreatePageModal } from '../create-page/CreatePage';
import { exportPageSections } from '../../../../../api/admin/section.api';
import { downloadJsonFile, generateExportFilename } from '../../../../../utils/export-import.utils';
import { useQueryClient } from '@tanstack/react-query';
import { useInspectorStore, INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../store/inspectorStore';
import { 
    isContentField, 
    isPropertyField, 
} from '../../../../../utils/field-processing.utils';

interface PageInspectorProps {
    page: IAdminPage | null;
    isConfigurationPage?: boolean;
    // Callback to expose inspector buttons to parent
    onButtonsChange?: (buttons: IInspectorButton[]) => void;
}

interface IPageFormValues {
    // Page properties
    keyword: string;
    url: string;
    pageAccessType: string;
    headless: boolean;
    openAccess: boolean;
    headerMenuEnabled: boolean;
    footerMenuEnabled: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    
    // Field values by language (translatable fields)
    // fields[fieldName][languageId] = content
}

export function PageInspector({ page, isConfigurationPage = false, onButtonsChange }: PageInspectorProps) {
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [createChildModalOpened, setCreateChildModalOpened] = useState(false);
    // Use persistent inspector state
    const { isCollapsed, setCollapsed } = useInspectorStore();
    
    const [contentExpanded, setContentExpanded] = useState(() => 
        !isCollapsed(INSPECTOR_TYPES.PAGE, INSPECTOR_SECTIONS.CONTENT)
    );
    const [propertiesExpanded, setPropertiesExpanded] = useState(() => 
        !isCollapsed(INSPECTOR_TYPES.PAGE, INSPECTOR_SECTIONS.PROPERTIES)
    );
    
    // Update persistent state when expanded states change
    useEffect(() => {
        setCollapsed(INSPECTOR_TYPES.PAGE, INSPECTOR_SECTIONS.CONTENT, !contentExpanded);
    }, [contentExpanded, setCollapsed]);
    
    useEffect(() => {
        setCollapsed(INSPECTOR_TYPES.PAGE, INSPECTOR_SECTIONS.PROPERTIES, !propertiesExpanded);
    }, [propertiesExpanded, setCollapsed]);
    const [activeLanguageTab, setActiveLanguageTab] = useState<string>('');
    
    // References to get final positions from DragDropMenuPositioner components
    const headerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);
    const footerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);
    
    // Get query client for cache invalidation
    const queryClient = useQueryClient();
    
    // Fetch page fields when page is selected
    const { 
        data: pageFieldsData, 
        isLoading: fieldsLoading, 
        error: fieldsError 
    } = usePageFields(page?.id_pages || null, !!page);

    // Fetch page access types
    const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);

    // Fetch available languages
    const { languages, isLoading: languagesLoading } = useLanguages();

    // Fetch admin pages for parent context
    const { pages: adminPages } = useAdminPages();

    // Find parent page if this page has a parent
    const parentPage = useMemo(() => {
        if (!page?.parent || !adminPages.length) return null;
        return adminPages.find(p => p.id_pages === page.parent) || null;
    }, [page?.parent, adminPages]);

    // Memoize fields data
    const { contentFields, propertyFields } = useMemo(() => {
        if (!pageFieldsData?.fields) {
            return { contentFields: [], propertyFields: [] };
        }

        const content = pageFieldsData.fields.filter(field => isContentField(field));
        const property = pageFieldsData.fields.filter(field => isPropertyField(field));

        return { contentFields: content, propertyFields: property };
    }, [pageFieldsData?.fields]);

    // Check if we have multiple languages for content fields
    const hasMultipleLanguages = useMemo(() => {
        return languages.length > 1;
    }, [languages]);

    // Initialize form with page data
    const form = useForm<IPageFormValues>({
        initialValues: {
            keyword: page?.keyword || '',
            url: page?.url || '',
            pageAccessType: 'both',
            headless: page?.is_headless === 1,
            openAccess: false,
            headerMenuEnabled: page?.nav_position !== null,
            footerMenuEnabled: false,
            navPosition: page?.nav_position || null,
            footerPosition: null
        }
    });

    // Update form when page changes
    useEffect(() => {
        if (page) {
            form.setValues({
                keyword: page.keyword,
                url: page.url,
                pageAccessType: 'both',
                headless: page.is_headless === 1,
                openAccess: false,
                headerMenuEnabled: page.nav_position !== null,
                footerMenuEnabled: false,
                navPosition: page.nav_position || null,
                footerPosition: null
            });
        }
    }, [page?.id_pages, page?.keyword, page?.url, page?.is_headless, page?.nav_position]); // Only depend on specific page properties

    // Initialize active language tab
    useEffect(() => {
        if (languages.length > 0 && !activeLanguageTab) {
            setActiveLanguageTab(languages[0].id.toString());
        }
    }, [languages, activeLanguageTab]);

    // Page mutations
    const updatePageMutation = useUpdatePageMutation({
        showNotifications: true,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            queryClient.invalidateQueries({ queryKey: ['pages'] });
        }
    });

    const deletePageMutation = useDeletePageMutation({
        showNotifications: true,
        onSuccess: () => {
            setDeleteModalOpened(false);
            setDeleteConfirmText('');
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
        }
    });

    // Event handlers
    const handleHeaderMenuChange = useCallback((enabled: boolean) => {
        form.setFieldValue('headerMenuEnabled', enabled);
        if (!enabled) {
            form.setFieldValue('navPosition', null);
        }
    }, [form]);

    const handleFooterMenuChange = useCallback((enabled: boolean) => {
        form.setFieldValue('footerMenuEnabled', enabled);
        if (!enabled) {
            form.setFieldValue('footerPosition', null);
        }
    }, [form]);

    const handleHeaderPositionChange = useCallback((position: number) => {
        form.setFieldValue('navPosition', position);
    }, [form]);

    const handleFooterPositionChange = useCallback((position: number) => {
        form.setFieldValue('footerPosition', position);
    }, [form]);

    const handleSavePage = useCallback(async () => {
        if (!page) return;

        // For now, just show a notification that save functionality needs to be implemented
        console.log('Save page functionality needs to be implemented with correct API structure');
        
        // The actual save would need to match the correct API interface
        // This is just a placeholder to prevent errors
    }, [page]);

    const handleDeletePage = useCallback(async () => {
        if (!page || deleteConfirmText !== page.keyword) return;

        try {
            await deletePageMutation.mutateAsync(page.id_pages);
        } catch (error) {
            // Error handling is done by the mutation hook
        }
    }, [page, deleteConfirmText, deletePageMutation]);

    const handleExportPage = useCallback(async () => {
        if (!page) return;

        try {
            const response = await exportPageSections(page.id_pages);
            const filename = generateExportFilename(`page_${page.keyword}_${page.id_pages}`);
            downloadJsonFile(response.data.sectionsData, filename);
        } catch (error) {
            // Error notification is handled by the download function
        }
    }, [page]);

    const handleCloseChildModal = useCallback(() => {
        setCreateChildModalOpened(false);
    }, []);

    // Generate inspector buttons
    const generateInspectorButtons = useCallback((): IInspectorButton[] => {
        if (!page) return [];

        const buttons: IInspectorButton[] = [
            {
                id: 'save',
                label: 'Save',
                icon: <IconDeviceFloppy size="0.875rem" />,
                onClick: handleSavePage,
                variant: 'filled',
                loading: updatePageMutation.isPending,
                disabled: !page || fieldsLoading
            }
        ];

        if (!isConfigurationPage) {
            buttons.push(
                {
                    id: 'export',
                    label: 'Export',
                    icon: <IconFileExport size="1rem" />,
                    onClick: handleExportPage,
                    variant: 'outline',
                    color: 'blue',
                    disabled: !page || fieldsLoading
                },
                {
                    id: 'create-child',
                    label: 'Create Child',
                    icon: <IconPlus size="1rem" />,
                    onClick: () => setCreateChildModalOpened(true),
                    variant: 'outline',
                    color: 'green',
                    disabled: !page
                }
            );
        }

        buttons.push({
            id: 'delete',
            label: 'Delete',
            icon: <IconTrash size="1rem" />,
            onClick: () => setDeleteModalOpened(true),
            variant: 'outline',
            color: 'red',
            disabled: !page
        });

        return buttons;
    }, [page, isConfigurationPage, handleSavePage, handleExportPage, updatePageMutation.isPending, fieldsLoading]);

    // Convert field data for rendering
    const convertToFieldData = (field: IPageField): IFieldData => ({
        id: field.id,
        name: field.name,
        title: field.name, // Use name as title for now
        type: field.type,
        default_value: '',
        help: '',
        disabled: false,
        hidden: 0,
        display: Boolean(field.display),
        fieldConfig: {}
    });

    // Render content field
    const renderContentField = useCallback((field: IPageField, languageId: number) => {
        return (
            <FieldRenderer
                key={`${field.id}-${languageId}`}
                field={convertToFieldData(field)}
                value={field.translations?.find(t => t.language_id === languageId)?.content || ''}
                onChange={(value) => {
                    // Handle field change
                }}
            />
        );
    }, []);

    // Render property field
    const renderPropertyField = useCallback((field: IPageField) => {
        return (
            <FieldRenderer
                key={field.id}
                field={convertToFieldData(field)}
                value={field.translations?.find(t => t.language_id === 1)?.content || ''}
                onChange={(value) => {
                    // Handle field change
                }}
            />
        );
    }, []);

    // Memoize inspector buttons
    const inspectorButtons = useMemo(() => generateInspectorButtons(), [
        page?.id_pages, 
        isConfigurationPage, 
        updatePageMutation.isPending, 
        fieldsLoading
    ]);

    // Expose inspector buttons to parent
    useEffect(() => {
        if (onButtonsChange) {
            onButtonsChange(inspectorButtons);
        }
    }, [onButtonsChange, inspectorButtons]);

    // Show loading state
    if (!page) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <Text>No page selected</Text>
                    <Text size="sm" c="dimmed">Select a page from the navigation to view its details</Text>
                </Stack>
            </Paper>
        );
    }

    if (fieldsLoading || languagesLoading) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <Text>Loading page details...</Text>
                </Stack>
            </Paper>
        );
    }

    if (fieldsError) {
        return (
            <Paper p="xl" withBorder>
                <Alert color="red" title="Error loading page details">
                    {fieldsError.message}
                </Alert>
            </Paper>
        );
    }

    const pageDetails = pageFieldsData?.page;

    return (
        <>
            <InspectorContainer
                inspectorType="page"
                inspectorTitle={page.title || page.keyword}
                inspectorId={pageDetails?.id || page.id_pages}
                inspectorButtons={inspectorButtons}
            >
                {/* Page Information Section - Using modular component */}
                <PageInformation 
                    page={page}
                    pageId={pageDetails?.id || page.id_pages}
                    isConfigurationPage={isConfigurationPage}
                />

                {/* Content Section - Using modular component */}
                <PageContentSection 
                    contentFields={contentFields}
                    languages={languages}
                    hasMultipleLanguages={hasMultipleLanguages}
                    activeLanguageTab={activeLanguageTab}
                    onLanguageTabChange={(value) => setActiveLanguageTab(value || (languages[0]?.id.toString() || ''))}
                    renderField={(field, languageId) => renderContentField(field as IPageField, languageId)}
                    className={styles.fullWidthLabel}
                />

                {/* Properties Section - Using modular component */}
                {!isConfigurationPage && (
                    <PagePropertiesSection 
                        form={form}
                        pageAccessTypes={pageAccessTypes}
                        page={page}
                        parentPage={parentPage}
                        headerMenuGetFinalPosition={headerMenuGetFinalPosition}
                        footerMenuGetFinalPosition={footerMenuGetFinalPosition}
                        onHeaderMenuChange={handleHeaderMenuChange}
                        onHeaderPositionChange={handleHeaderPositionChange}
                        onFooterMenuChange={handleFooterMenuChange}
                        onFooterPositionChange={handleFooterPositionChange}
                        className={styles.compactStack}
                    />
                )}

                {/* Property Fields for Configuration Pages */}
                {isConfigurationPage && propertyFields.length > 0 && (
                    <InspectorInfoSection
                        title="Configuration Properties"
                        infoItems={[]}
                    >
                        <Stack gap="sm">
                            {propertyFields.map(field => (
                                <Box key={field.id}>{renderPropertyField(field)}</Box>
                            ))}
                        </Stack>
                    </InspectorInfoSection>
                )}
            </InspectorContainer>

            {/* Create Child Page Modal */}
            <CreatePageModal
                opened={createChildModalOpened}
                onClose={handleCloseChildModal}
                parentPage={page}
            />

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpened}
                onClose={() => {
                    setDeleteModalOpened(false);
                    setDeleteConfirmText('');
                }}
                title="Delete Page"
                centered
            >
                <Stack gap="md">
                    <Alert color="red" title="Warning">
                        This action cannot be undone. The page and all its content will be permanently deleted.
                    </Alert>
                    
                    <Text>
                        To confirm deletion, please type the page keyword: <strong>{page.keyword}</strong>
                    </Text>
                    
                    <TextInput
                        placeholder={`Type "${page.keyword}" to confirm`}
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                    />
                    
                    <Group justify="flex-end">
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setDeleteModalOpened(false);
                                setDeleteConfirmText('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            disabled={deleteConfirmText !== page.keyword}
                            loading={deletePageMutation.isPending}
                            onClick={handleDeletePage}
                        >
                            Delete Page
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
