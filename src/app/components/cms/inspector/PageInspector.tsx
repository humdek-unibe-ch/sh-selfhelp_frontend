'use client';

import {
    Paper,
    Text,
    Stack,
    Alert,
    Modal,
    TextInput,
    Button,
    Group
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// API and Hooks
import { usePageFields } from '../../../../hooks/usePageDetails';
import { useLookupsByType } from '../../../../hooks/useLookups';
import { useDeletePageMutation } from '../../../../hooks/mutations/useDeletePageMutation';
import { useUpdatePageMutation } from '../../../../hooks/mutations/useUpdatePageMutation';
import { useLanguages } from '../../../../hooks/useLanguages';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import { exportPageSections } from '../../../../api/admin/section.api';

// Types
import { IAdminPage } from '../../../../types/responses/admin/admin.types';
import { IPageField } from '../../../../types/responses/admin/page-details.types';
import { IUpdatePageData, IUpdatePageField } from '../../../../types/requests/admin/update-page.types';

// Utils
import { downloadJsonFile, generateExportFilename } from '../../../../utils/export-import.utils';
import { isContentField, isPropertyField, initializeFieldFormValues } from '../../../../utils/field-processing.utils';
import {
    initializeContentFieldValues,
    initializePropertyFieldValues
} from '../../../../utils/field-value-extraction.utils';

// Constants
import { PAGE_ACCESS_TYPES } from '../../../../constants/lookups.constants';
// Components
import {
    InspectorContainer,
    PageInfo,
    generatePageActions,
    PageContentFields,
    PageProperties,
    type IInspectorButton,
} from './index';
import { CreatePageModal } from '../pages/create-page/CreatePage';

// Styles
import styles from './PageInspector.module.css';

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
    fields: Record<string, Record<number, string>>;
}

export function PageInspector({ page, isConfigurationPage = false, onButtonsChange }: PageInspectorProps) {
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [createChildModalOpened, setCreateChildModalOpened] = useState(false);
    // Language tab state for content fields
    const [activeLanguageTab, setActiveLanguageTab] = useState('1');

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

    // Form state managed by Mantine form (like ConfigurationPageEditor)

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
            footerPosition: null,
            fields: {}
        }
    });

    // Update active tab when languages change
    useEffect(() => {
        if (languages.length > 0) {
            if (!languages.find(l => l.id.toString() === activeLanguageTab)) {
                setActiveLanguageTab(languages[0].id.toString());
            }
        }
    }, [languages, activeLanguageTab]);

    // Initialize field values when fields data loads (like ConfigurationPageEditor)
    useEffect(() => {
        console.log('🔄 PageInspector field initialization useEffect triggered:', {
            hasFieldsData: !!pageFieldsData?.fields,
            fieldsCount: pageFieldsData?.fields?.length || 0,
            languagesCount: languages.length
        });

        if (pageFieldsData?.fields && languages.length > 0) {
            // Use the modular field initialization utility that handles content vs property fields correctly
            const fieldsObject = initializeFieldFormValues(pageFieldsData.fields, languages);

            console.log('🔄 PageInspector: Setting form fields:', {
                fieldsObject,
                sampleField: fieldsObject['description'],
                languages: languages.map(l => ({ id: l.id, language: l.language })),
                fieldsWithTranslations: pageFieldsData.fields.filter(f => f.translations?.length > 0).map(f => ({
                    name: f.name,
                    translations: f.translations
                }))
            });

            // Initialize Mantine form fields structure (single source of truth like ConfigurationPageEditor)
            form.setFieldValue('fields', fieldsObject);
            
            // Debug: Check what the form has after setting
            console.log('🔄 PageInspector: Form after setting fields:', {
                formFields: form.values.fields,
                descriptionField: form.values.fields?.['description']
            });
        }
    }, [pageFieldsData?.fields, languages]);

    // Update form when page or page details change
    useEffect(() => {
        const pageDetails = pageFieldsData?.page;

        if (pageDetails) {
            form.setValues({
                keyword: pageDetails.keyword,
                url: pageDetails.url,
                pageAccessType: pageDetails.pageAccessType.lookupCode,
                headless: pageDetails.headless,
                openAccess: pageDetails.openAccess,
                headerMenuEnabled: pageDetails.navPosition !== null,
                footerMenuEnabled: pageDetails.footerPosition !== null,
                navPosition: pageDetails.navPosition || null,
                footerPosition: pageDetails.footerPosition || null,
            });
        } else if (page) {
            // Fallback for when details are not yet loaded
            form.setValues({
                keyword: page.keyword,
                url: page.url,
                pageAccessType: 'both', // Default fallback since access_type doesn't exist on IAdminPage
                headless: page.is_headless === 1,
                openAccess: false, // Default fallback since open_access doesn't exist on IAdminPage
                headerMenuEnabled: page.nav_position !== null,
                footerMenuEnabled: page.footer_position !== null,
                navPosition: page.nav_position || null,
                footerPosition: page.footer_position || null,
            });
        }
    }, [page, pageFieldsData?.page]);

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
        if (!page || !pageFieldsData?.fields) return;

        try {
            // Prepare page data for update (matching backend schema)
            const pageData: IUpdatePageData = {
                url: form.values.url || null,
                protocol: null, // Not currently handled in the form
                headless: form.values.headless,
                navPosition: form.values.navPosition,
                footerPosition: form.values.footerPosition,
                openAccess: form.values.openAccess,
                pageAccessTypeCode: form.values.pageAccessType,
                parent: null // Not currently handled in the form
            };

            // Prepare field updates
            const fields: IUpdatePageField[] = [];

            // Process content fields (translatable)
            const contentFields = pageFieldsData.fields.filter(field => isContentField(field));
            contentFields.forEach(field => {
                languages.forEach(language => {
                    const currentValue = form.values.fields?.[field.name]?.[language.id];
                    const originalValue = field.translations?.find(t => t.language_id === language.id)?.content || '';

                    // Only include changed fields
                    if (currentValue !== undefined && currentValue !== originalValue) {
                        fields.push({
                            fieldId: field.id,
                            languageId: language.id,
                            content: currentValue || null
                        });
                    }
                });
            });

            // Process property fields (non-translatable)
            const propertyFields = pageFieldsData.fields.filter(field => isPropertyField(field));
            propertyFields.forEach(field => {
                const currentValue = form.values.fields?.[field.name]?.[1];
                const originalValue = field.translations?.find(t => t.language_id === 1)?.content || '';

                // Only include changed fields
                if (currentValue !== undefined && String(currentValue) !== originalValue) {
                    fields.push({
                        fieldId: field.id,
                        languageId: 1, // Property fields always use language ID 1
                        content: currentValue !== null ? String(currentValue) : null
                    });
                }
            });

            // Execute the update
            await updatePageMutation.mutateAsync({
                pageId: page.id_pages,
                updateData: {
                    pageData,
                    fields
                }
            });

        } catch (error) {
            // Error handling is done by the mutation hook
            console.error('Failed to save page:', error);
        }
    }, [page, pageFieldsData?.fields, form.values, languages, updatePageMutation]);

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

    // Handle content field change - update Mantine form like ConfigurationPageEditor
    const handleContentFieldChange = useCallback((fieldName: string, languageId: number, value: string | boolean) => {
        // Ensure the field structure exists before setting the value
        if (!form.values.fields[fieldName]) {
            const fieldObj = {} as Record<number, string>;
            form.setFieldValue(`fields.${fieldName}`, fieldObj);
        }
        const fieldKey = `fields.${fieldName}.${languageId}`;
        form.setFieldValue(fieldKey, String(value));
    }, [form]);

    // Handle property field change - update Mantine form like ConfigurationPageEditor  
    const handlePropertyFieldChange = useCallback((fieldName: string, value: string | boolean) => {
        console.log('🔧 PageInspector handlePropertyFieldChange:', {
            fieldName,
            value,
            formFieldsValue: form.values.fields?.[fieldName]
        });

        // Ensure the field structure exists before setting the value
        if (!form.values.fields[fieldName]) {
            const fieldObj = {} as Record<number, string>;
            form.setFieldValue(`fields.${fieldName}`, fieldObj);
        }
        // Update the form fields structure for property fields (language ID 1)
        const fieldKey = `fields.${fieldName}.1`;
        form.setFieldValue(fieldKey, String(value));
    }, [form]);

    // Note: renderPropertyField function removed - now using InspectorFields through PageProperties

    // Generate action buttons for PageActions component
    const pageActions = useMemo(() => ({
        page,
        isConfigurationPage,
        fieldsLoading,
        updateMutationPending: updatePageMutation.isPending,
        onSave: handleSavePage,
        onExport: handleExportPage,
        onCreateChild: () => setCreateChildModalOpened(true),
        onDelete: () => setDeleteModalOpened(true)
    }), [
        page,
        isConfigurationPage,
        fieldsLoading,
        updatePageMutation.isPending,
        handleSavePage,
        handleExportPage
    ]);

    // Generate inspector buttons for parent callback
    useEffect(() => {
        if (onButtonsChange && page) {
            const actions = generatePageActions(pageActions);
            onButtonsChange(actions);
        }
    }, [onButtonsChange, page, pageActions]);

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

    const hasPageFields = Boolean((pageFieldsData as any)?.fields?.length);
    if ((fieldsLoading && !hasPageFields) || (languagesLoading && languages.length === 0)) {
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
                inspectorButtons={generatePageActions(pageActions)}
            >
                {/* Page Information Section */}
                <PageInfo
                    page={page}
                    pageId={pageDetails?.id || page.id_pages}
                    isConfigurationPage={isConfigurationPage}
                />

                {/* Content Fields Section */}
                <PageContentFields
                    contentFields={contentFields}
                    languages={languages}
                    fieldValues={form.values.fields}
                    onFieldChange={handleContentFieldChange}
                    form={{ values: { fields: form.values.fields }, setFieldValue: (path: string, value: string) => form.setFieldValue(path, value) }}
                    className={styles.fullWidthLabel}
                />

                {/* Properties Section */}
                <PageProperties
                    form={form}
                    pageAccessTypes={pageAccessTypes}
                    page={page}
                    parentPage={parentPage}
                    propertyFields={propertyFields}
                    isConfigurationPage={isConfigurationPage}
                    className={styles.compactStack}
                    languages={languages}
                    propertyValues={{}} // No longer needed - using form.values.fields
                    onPropertyFieldChange={handlePropertyFieldChange}
                    fieldsForm={{ values: { fields: form.values.fields }, setFieldValue: (path: string, value: string) => form.setFieldValue(path, value) }}
                    headerMenuGetFinalPosition={headerMenuGetFinalPosition}
                    footerMenuGetFinalPosition={footerMenuGetFinalPosition}
                    onHeaderMenuChange={handleHeaderMenuChange}
                    onHeaderPositionChange={handleHeaderPositionChange}
                    onFooterMenuChange={handleFooterMenuChange}
                    onFooterPositionChange={handleFooterPositionChange}
                />
            </InspectorContainer>

            {/* Create Child Page Modal */}
            <CreatePageModal
                opened={createChildModalOpened}
                onClose={() => setCreateChildModalOpened(false)}
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
