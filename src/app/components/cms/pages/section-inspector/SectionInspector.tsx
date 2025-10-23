'use client';

import {
    Paper,
    Box,
    Modal,
    Stack,
    Group,
    Text,
    TextInput,
    Button,
    Alert,
    Tabs,
} from '@mantine/core';
import { 
    IconInfoCircle, 
    IconDeviceFloppy, 
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSectionDetails } from '../../../../../hooks/useSectionDetails';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { useUpdateSectionMutation, useDeleteSectionMutation } from '../../../../../hooks/mutations';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';
import {
    IFieldData,
    GlobalFieldRenderer,
    GlobalFieldType,
    createFieldChangeHandlers,
} from '../../shared';
import styles from './SectionInspector.module.css';
import { exportSection } from '../../../../../api/admin/section.api';
import { downloadJsonFile, generateExportFilename } from '../../../../../utils/export-import.utils';
import { AdminApi } from '../../../../../api/admin';
import { validateName, getNameValidationError } from '../../../../../utils/name-validation.utils';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { CollapsibleSection } from '../../shared/collapsible-section/CollapsibleSection';
import { FieldRenderer } from '../../shared/field-renderer/FieldRenderer';
import { InspectorLayout } from '../../shared/inspector-layout/InspectorLayout';
import { InspectorHeader } from '../../shared/inspector-header/InspectorHeader';
import { INSPECTOR_TYPES } from '../../../../../store/inspectorStore';
import { useRenderMonitor, useWhyDidYouUpdate, useMountMonitor } from '../../../../../utils/performance-monitor.utils';

interface ISectionInspectorProps {
    pageId: number | null;
    sectionId: number | null;
}

interface ISectionFormValues {
    // Section name (editable)
    sectionName: string;

    // Section properties (non-translatable fields)
    properties: Record<string, string | boolean>;

    // Field values by language (translatable fields)
    fields: Record<string, Record<number, string>>; // fields[fieldName][languageId] = content

    // Global section-level properties
    globalFields: {
        condition: string;
        data_config: string;
        css: string;
        css_mobile: string;
        debug: boolean;
    };
}

interface ISectionSubmitData {
    // Section name (only if changed)
    sectionName?: string;
    
    // Content fields with language and field IDs (only changed fields)
    contentFields: Array<{
        fieldId: number;
        languageId: number;
        value: string;
        fieldName: string; // For debugging
    }>;
    
    // Property fields (only changed fields)
    propertyFields: Array<{
        fieldId: number;
        value: string | boolean;
        fieldName: string; // For debugging
    }>;
}

// Mark component for WDYR tracking
SectionInspector.whyDidYouRender = process.env.NODE_ENV === 'development';

export function SectionInspector({ pageId, sectionId }: ISectionInspectorProps) {
    // Performance monitoring - track renders, prop changes, and mount/unmount
    useRenderMonitor('SectionInspector', { pageId, sectionId });
    useWhyDidYouUpdate('SectionInspector', { pageId, sectionId });
    useMountMonitor('SectionInspector');
    
    const router = useRouter();
    const queryClient = useQueryClient();
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [activeLanguageTab, setActiveLanguageTab] = useState<string>('');
    const [formValues, setFormValues] = useState<ISectionFormValues>({
        sectionName: '',
        properties: {},
        fields: {},
        globalFields: {
            condition: '',
            data_config: '',
            css: '',
            css_mobile: '',
            debug: false
        }
    });

    // Track original values to detect changes
    const [originalValues, setOriginalValues] = useState<ISectionFormValues>({
        sectionName: '',
        properties: {},
        fields: {},
        globalFields: {
            condition: '',
            data_config: '',
            css: '',
            css_mobile: '',
            debug: false
        }
    });
    
    // Fetch section details when section is selected
    const { 
        data: sectionDetailsData, 
        isLoading: sectionLoading, 
        error: sectionError,
        isFetching,
        isStale
    } = useSectionDetails(pageId, sectionId, !!pageId && !!sectionId);

    // Fetch available languages
    const { languages: languagesData, isLoading: languagesLoading } = useAdminLanguages();
    
    // Section update mutation
    const updateSectionMutation = useUpdateSectionMutation({
        showNotifications: true,
        pageId: pageId || undefined,
        onSuccess: () => {
            // Update original values after successful save
            setOriginalValues({ ...formValues });

            
            // Invalidate relevant queries to refresh data - using consistent query keys
            if (pageId) {
                queryClient.invalidateQueries({ queryKey: ['adminPages'] }); // Admin pages list
                queryClient.invalidateQueries({ queryKey: ['pageFields', pageId] }); // Page fields
                queryClient.invalidateQueries({ queryKey: ['pageSections', pageId] }); // Page sections
                queryClient.invalidateQueries({ queryKey: ['admin', 'sections', 'details', pageId, sectionId] }); // Section details (correct key)
                queryClient.invalidateQueries({ queryKey: ['pages'] }); // Frontend pages
                queryClient.invalidateQueries({ queryKey: ['page-content'] }); // Frontend page content
                queryClient.invalidateQueries({ queryKey: ['frontend-pages'] }); // Frontend pages with language
                
                // Also invalidate any admin-specific queries that might exist
                queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
                queryClient.invalidateQueries({ queryKey: ['admin', 'page', pageId] });
                queryClient.invalidateQueries({ queryKey: ['admin', 'section', pageId, sectionId] });
                queryClient.invalidateQueries({ queryKey: ['admin', 'sections', 'details', pageId, sectionId] });
            }
        },
        onError: (error) => {

        }
    });

    // Section delete mutation
    const deleteSectionMutation = useDeleteSectionMutation({
        showNotifications: true,
        pageId: pageId || undefined,
        onSuccess: () => {
            setDeleteModalOpened(false);
            setDeleteConfirmText('');

            
            // Navigate to page view after successful deletion
            const currentPath = window.location.pathname;
            const pathParts = currentPath.split('/');
            const adminIndex = pathParts.indexOf('admin');
            const pagesIndex = pathParts.indexOf('pages', adminIndex);
            
            if (pagesIndex !== -1 && pathParts[pagesIndex + 1]) {
                const pageKeyword = pathParts[pagesIndex + 1];
                const newPath = `/admin/pages/${pageKeyword}`;
                router.push(newPath, { scroll: false });
            }
        },
        onError: (error) => {

        }
    });

    // Note: Field processing is done directly in useEffect to avoid circular dependencies

    // Set default active language tab when languages are loaded
    useEffect(() => {
        if (languagesData.length > 0 && !activeLanguageTab) {
            const firstLangId = languagesData[0].id.toString();
            setActiveLanguageTab(firstLangId);
        }
    }, [languagesData, activeLanguageTab]);

    // Memoize processed form values to prevent recreation on every render
    const processedFormValues = useMemo(() => {
        if (!sectionDetailsData || languagesData.length === 0) {
            return {
                sectionName: '',
                properties: {},
                fields: {},
                globalFields: {
                    condition: '',
                    data_config: '',
                    css: '',
                    css_mobile: '',
                    debug: false
                }
            };
        }

        const { section, fields } = sectionDetailsData;
        const globalFields = section.global_fields || {
            condition: null,
            data_config: null,
            css: null,
            css_mobile: null,
            debug: false
        };

        // Process fields for SectionInspector (which has different structure than PageInspector)
        const contentFields = fields.filter(field => field.display);
        const propertyFields = fields.filter(field => !field.display);

        // Process content fields (translatable) - use similar logic to the utility but adapted for ISectionField
        const contentFieldsObject: Record<string, Record<number, string>> = {};
        contentFields.forEach(field => {
            contentFieldsObject[field.name] = {};

            // Initialize all languages with default values first
            languagesData.forEach(lang => {
                contentFieldsObject[field.name][lang.id] = field.default_value || '';
            });

            if (field.display) {
                // Content fields: populate based on actual language_id from translations if available
                if (field.translations && field.translations.length > 0) {
                    field.translations.forEach(translation => {
                        const language = languagesData.find(l => l.id === translation.language_id);
                        if (language) {
                            contentFieldsObject[field.name][language.id] = translation.content || field.default_value || '';
                        }
                    });
                }
                // If no translations, keep the default values set above
            } else {
                // Property fields: find content from language_id = 1 or use default value
                let propertyContent = field.default_value || '';

                if (field.translations && field.translations.length > 0) {
                    const propertyTranslation = field.translations.find(t => t.language_id === 1);
                    if (propertyTranslation?.content !== undefined && propertyTranslation?.content !== null) {
                        propertyContent = propertyTranslation.content;
                    }
                }

                // Replicate property field content to all language tabs for editing convenience
                languagesData.forEach(language => {
                    contentFieldsObject[field.name][language.id] = propertyContent;
                });
            }
        });

        // Process property fields for the properties object (SectionInspector uses a different structure)
        const propertyFieldsObject: Record<string, string | boolean> = {};

        propertyFields.forEach(field => {
            // Get the property field content from language ID 1 or use default value
            let value = field.default_value || '';

            if (field.translations && field.translations.length > 0) {
                const propertyTranslation = field.translations.find(t => t.language_id === 1);
                if (propertyTranslation?.content !== undefined && propertyTranslation?.content !== null) {
                    value = propertyTranslation.content;
                }
            }

            // Convert to appropriate type based on field type
            if (field.type === 'checkbox') {
                propertyFieldsObject[field.name] = value === '1' || value === 'true' || value === 'on';
            } else {
                propertyFieldsObject[field.name] = value;
            }
        });

        return {
            sectionName: section.name,
            properties: propertyFieldsObject,
            fields: contentFieldsObject,
            globalFields: {
                condition: globalFields.condition || '',
                data_config: globalFields.data_config || '',
                css: globalFields.css || '',
                css_mobile: globalFields.css_mobile || '',
                debug: globalFields.debug || false
            }
        };
    }, [sectionDetailsData, languagesData]);

    // Update form values only when processed data changes
    useEffect(() => {
        setFormValues(processedFormValues);
        setOriginalValues(processedFormValues);
    }, [processedFormValues]);

    // Memoize computed values to prevent recreation on every render
    const hasMultipleLanguages = useMemo(() => languagesData.length > 1, [languagesData.length]);

    const dataVariables = useMemo(() => sectionDetailsData?.data_variables || {}, [sectionDetailsData?.data_variables]);

    const contentFields = useMemo(() => sectionDetailsData?.fields.filter(field => field.display) || [], [sectionDetailsData?.fields]);

    const propertyFields = useMemo(() => sectionDetailsData?.fields.filter(field => !field.display) || [], [sectionDetailsData?.fields]);

    // Use shared field change handlers
    const { handleContentFieldChange, handlePropertyFieldChange } = createFieldChangeHandlers(
        setFormValues,
        'SectionInspector'
    );

    // Memoize handlers to prevent recreation on every render
    const handleSave = useCallback(async () => {
        if (!sectionId || !sectionDetailsData || !languagesData.length || !pageId) return;

        // Validate section name if it has changed
        if (formValues.sectionName !== originalValues.sectionName) {
            const validation = validateName(formValues.sectionName);
            if (!validation.isValid) {
                notifications.show({
                    title: 'Invalid Section Name',
                    message: validation.error || getNameValidationError(),
                    color: 'red'
                });
                return;
            }
        }

        // Prepare submit data structure (only changed fields)
        const submitData = {
            contentFields: [] as Array<{
                fieldId: number;
                languageId: number;
                value: string;
            }>,
            propertyFields: [] as Array<{
                fieldId: number;
                value: string | boolean;
            }>,
            globalFields: {} as any
        } as any;

        // Check if section name changed
        if (formValues.sectionName !== originalValues.sectionName) {
            submitData.sectionName = formValues.sectionName;
        }

        // Process content fields (translatable) - send all values
        contentFields.forEach(field => {
            const currentFieldValues = formValues.fields[field.name] || {};

            languagesData.forEach(language => {
                const currentValue = currentFieldValues[language.id] || '';

                submitData.contentFields.push({
                    fieldId: field.id,
                    languageId: language.id,
                    value: currentValue
                });
            });
        });

        // Process property fields (non-translatable) - send all values
        propertyFields.forEach(field => {
            const currentValue = formValues.properties[field.name];

            const fieldEntry = {
                fieldId: field.id,
                value: currentValue !== undefined ? currentValue : ''
            };

            submitData.propertyFields.push(fieldEntry);
        });

        // Process global fields - send all values
        // Clean up global fields - convert empty strings to null for API
        const cleanGlobalFields: any = {};
        Object.keys(formValues.globalFields).forEach(key => {
            const value = formValues.globalFields[key as keyof typeof formValues.globalFields];
            cleanGlobalFields[key] = (value === '' || value === null) ? null : value;
        });
        submitData.globalFields = cleanGlobalFields;

        // Always submit since we're sending all field values
        // (no need to check for changes since we send all values)

        // Execute the mutation
        try {
            await updateSectionMutation.mutateAsync({
                pageId,
                sectionId,
                sectionData: submitData
            });
        } catch (error) {
            // Error handling is done by the mutation hook

        }
    }, [sectionId, sectionDetailsData, languagesData, pageId, formValues, originalValues, contentFields, propertyFields, updateSectionMutation]);

    const handleDeleteSection = useCallback(() => {
        if (!sectionId || !sectionDetailsData || !pageId) return;

        if (deleteConfirmText === sectionDetailsData.section.name) {
            deleteSectionMutation.mutate({
                pageId,
                sectionId
            });
        }
    }, [sectionId, sectionDetailsData, pageId, deleteConfirmText, deleteSectionMutation]);

    const handleExportSection = useCallback(async () => {
        if (!sectionId || !sectionDetailsData || !pageId) return;

        try {
            const response = await exportSection(pageId, sectionId);
            const filename = generateExportFilename(`section_${sectionDetailsData.section.name}_${sectionId}`);
            downloadJsonFile(response.data.sectionsData, filename);
        } catch (error) {
            // Error notification is handled by the download function
        }
    }, [sectionId, sectionDetailsData, pageId]);

    const handleSectionNameChange = useCallback((value: string) => {
        setFormValues(prev => ({
            ...prev,
            sectionName: value
        }));
    }, []);

    // Memoize field conversion function
    const convertToFieldData = useCallback((field: ISectionField): IFieldData => ({
        id: field.id,
        name: field.name,
        title: field.title,
        type: field.type,
        default_value: field.default_value,
        help: field.help,
        disabled: field.disabled,
        hidden: field.hidden,
        display: field.display,
        config: field.config,
        translations: field.translations
    }), []);

    // Define the fixed global field types
    const globalFieldTypes: GlobalFieldType[] = ['condition', 'data_config', 'css', 'css_mobile', 'debug'];

    // Memoize content field renderer to prevent recreation on every render
    const renderContentField = useCallback((field: ISectionField, languageId: number) => {
        const currentLanguage = languagesData.find(lang => lang.id === languageId);
        const locale = currentLanguage?.locale;
        const fieldValue = formValues.fields?.[field.name]?.[languageId] ?? '';

        const fieldData: IFieldData = convertToFieldData(field);

        return (
            <FieldRenderer
                key={`${field.id}-${languageId}`}
                field={fieldData}
                value={fieldValue}
                onChange={(value) => handleContentFieldChange(field.name, languageId, value)}
                locale={locale}
                className={styles.fullWidthLabel}
                dataVariables={dataVariables}
            />
        );
    }, [languagesData, formValues.fields, convertToFieldData, handleContentFieldChange, dataVariables]);

    // Memoize property field renderer to prevent recreation on every render
    const renderPropertyField = useCallback((field: ISectionField) => {
        const langId = languagesData[0]?.id || 1;
        const fieldValue = formValues.properties?.[field.name] ?? '';

        const fieldData: IFieldData = convertToFieldData(field);

        return (
            <FieldRenderer
                key={`${field.id}-${langId}`}
                field={fieldData}
                value={fieldValue}
                onChange={(value) => handlePropertyFieldChange(field.name, null, value)}
                className={styles.fullWidthLabel}
                dataVariables={dataVariables}
            />
        );
    }, [languagesData, formValues.properties, convertToFieldData, handlePropertyFieldChange, dataVariables]);

    // Get fields data for processing
    const fields = sectionDetailsData?.fields || [];

    // Memoize header data - only create when we have section data
    const headerBadges = useMemo(() => {
        if (!sectionDetailsData) return [];
        const { section } = sectionDetailsData;
        return [
            { label: `ID: ${section.id}`, color: 'blue' },
            { label: section.style.name, color: 'green' },
            ...(section.style.canHaveChildren ? [{ label: 'Can Have Children', color: 'green' }] : []),
            { label: `Type ID: ${section.style.typeId}`, color: 'gray' }
        ];
    }, [sectionDetailsData]);

    const headerActions = useMemo(() => {
        if (!sectionDetailsData) return [];
        return [
            {
                label: 'Save',
                icon: <IconDeviceFloppy size="1rem" />,
                onClick: handleSave,
                variant: 'filled' as const,
                disabled: !sectionId || updateSectionMutation.isPending || deleteSectionMutation.isPending,
                loading: updateSectionMutation.isPending
            },
            {
                label: 'Export',
                icon: <IconFileExport size="1rem" />,
                onClick: handleExportSection,
                variant: 'light' as const,
                disabled: !sectionId || deleteSectionMutation.isPending
            },
            {
                label: 'Delete',
                icon: <IconTrash size="1rem" />,
                onClick: () => setDeleteModalOpened(true),
                variant: 'light' as const,
                color: 'red',
                disabled: !sectionId || deleteSectionMutation.isPending
            }
        ];
    }, [sectionDetailsData, sectionId, updateSectionMutation.isPending, deleteSectionMutation.isPending, handleSave, handleExportSection]);

    // Early returns after all hooks are defined
    if (!sectionId) {
        return (
            <InspectorLayout
                header={<></>}
                emptyState={{
                    title: "No Section Selected",
                    description: "Select a section from the sections list to view and edit its content."
                }}
            >
                <Box p="md">
                    <Text size="sm" c="dimmed">Debug Info:</Text>
                    <Text size="xs" c="dimmed">Page ID: {pageId || 'null'}</Text>
                    <Text size="xs" c="dimmed">Section ID: {sectionId || 'null'}</Text>
                </Box>
            </InspectorLayout>
        );
    }

    if (sectionLoading || languagesLoading) {
        return (
            <InspectorLayout
                header={<></>}
                loading={true}
                loadingText="Loading section details..."
            >
                <></>
            </InspectorLayout>
        );
    }

    if (sectionError) {
        return (
            <InspectorLayout
                header={<></>}
                error={sectionError.message}
            >
                <Box p="md">
                    <Text size="sm" c="dimmed">Debug Info:</Text>
                    <Text size="xs" c="dimmed">Page ID: {pageId || 'null'}</Text>
                    <Text size="xs" c="dimmed">Section ID: {sectionId || 'null'}</Text>
                    <Text size="xs" c="dimmed">Error: {sectionError.message}</Text>
                    <Button
                        size="xs"
                        mt="sm"
                        onClick={async () => {
                            try {
                                await AdminApi.getSectionDetails(pageId!, sectionId!);
                            } catch (error) {
                                // Error handled by API layer
                            }
                        }}
                    >
                        Test API Call
                    </Button>
                </Box>
            </InspectorLayout>
        );
    }

    if (!sectionDetailsData) {
        return (
            <InspectorLayout
                header={<></>}
                error="The selected section could not be found."
            >
                <Box p="md">
                    <Text size="sm" c="dimmed">Debug Info:</Text>
                    <Text size="xs" c="dimmed">Page ID: {pageId || 'null'}</Text>
                    <Text size="xs" c="dimmed">Section ID: {sectionId || 'null'}</Text>
                    <Text size="xs" c="dimmed">Loading: {sectionLoading.toString()}</Text>
                    <Text size="xs" c="dimmed">Fetching: {isFetching.toString()}</Text>
                    <Text size="xs" c="dimmed">Stale: {isStale.toString()}</Text>
                    <Button
                        size="xs"
                        mt="sm"
                        onClick={async () => {
                            try {
                                await AdminApi.getSectionDetails(pageId!, sectionId!);
                            } catch (error) {
                                // Error handled by API layer
                            }
                        }}
                    >
                        Test API Call
                    </Button>
                </Box>
            </InspectorLayout>
        );
    }

    const { section } = sectionDetailsData;

    return (
        <>
            <InspectorLayout
                header={
                    <InspectorHeader
                        title={section.name}
                        badges={headerBadges}
                        actions={headerActions}
                    />
                }
            >
                {/* Section Information */}
                <Paper withBorder style={{ backgroundColor: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))' }}>
                    <Box p="md">
                        <Group gap="xs" mb="sm">
                            <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                            <Text size="sm" fw={500} c="blue">Section Information</Text>
                        </Group>
                        
                        <Stack gap="xs">
                            {/* Editable Section Name */}
                            <Box>
                                <Text size="xs" fw={500} c="dimmed" mb="xs">Section Name</Text>
                                <TextInput
                                    value={formValues.sectionName}
                                    onChange={(e) => handleSectionNameChange(e.currentTarget.value)}
                                    placeholder="Enter section name"
                                    size="sm"
                                />
                            </Box>
                            
                            <Group gap="md" wrap="wrap">
                                <Box>
                                    <Text size="xs" fw={500} c="dimmed">Style</Text>
                                    <Text size="sm">{section.style.name}</Text>
                                </Box>
                                <Box>
                                    <Text size="xs" fw={500} c="dimmed">Type</Text>
                                    <Text size="sm">{section.style.type}</Text>
                                </Box>
                                <Box>
                                    <Text size="xs" fw={500} c="dimmed">Section ID</Text>
                                    <Text size="sm">{section.id}</Text>
                                </Box>
                            </Group>
                            
                            {section.style.description && (
                                <Box mt="sm">
                                    <Text size="xs" fw={500} c="dimmed">Description</Text>
                                    <Text size="sm">{section.style.description}</Text>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </Paper>

                {/* Content Fields */}
                <CollapsibleSection
                    title="Content"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="content"
                    defaultExpanded={true}
                >
                    {fields.filter(field => field.display).length > 0 ? (
                        hasMultipleLanguages ? (
                            <Tabs value={activeLanguageTab} onChange={(value) => setActiveLanguageTab(value || (languagesData[0]?.id.toString() || ''))}>
                                <Tabs.List>
                                    {languagesData.map(lang => {
                                        const langId = lang.id.toString();
                                        return (
                                            <Tabs.Tab key={langId} value={langId}>
                                                {lang.language}
                                            </Tabs.Tab>
                                        );
                                    })}
                                </Tabs.List>

                                {languagesData.map(lang => {
                                    const langId = lang.id.toString();
                                    return (
                                        <Tabs.Panel key={langId} value={langId} pt="md">
                                            <Stack gap="md">
                                                {fields.filter(field => field.display).map(field =>
                                                    renderContentField(field, lang.id)
                                                )}
                                            </Stack>
                                        </Tabs.Panel>
                                    );
                                })}
                            </Tabs>
                        ) : (
                            <Stack gap="md">
                                {fields.filter(field => field.display).map(field =>
                                    renderContentField(field, languagesData[0]?.id || 1)
                                )}
                            </Stack>
                        )
                    ) : (
                        <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                            No content fields available for this section.
                        </Alert>
                    )}
                </CollapsibleSection>

                {/* Global Fields */}
                <CollapsibleSection
                    title="Global Fields"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="global-fields"
                    defaultExpanded={false}
                >
                    <Stack gap="md">
                        {globalFieldTypes.map(fieldType => (
                            <GlobalFieldRenderer
                                key={fieldType}
                                fieldType={fieldType}
                                value={formValues.globalFields[fieldType]}
                                onChange={(value) => setFormValues(prev => ({
                                    ...prev,
                                    globalFields: {
                                        ...prev.globalFields,
                                        [fieldType]: value
                                    }
                                }))}
                                dataVariables={dataVariables}
                                className={styles.fullWidthLabel}
                            />
                        ))}
                    </Stack>
                </CollapsibleSection>

                {/* Property Fields */}
                <CollapsibleSection
                    title="Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="properties"
                    defaultExpanded={true}
                >
                    {fields.filter(field => !field.display && !field.name.startsWith('mantine_')).length > 0 ? (
                        <Stack gap="md">
                            {fields.filter(field => !field.display && !field.name.startsWith('mantine_')).map(field => renderPropertyField(field))}
                        </Stack>
                    ) : (
                        <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                            No property fields available for this section.
                        </Alert>
                    )}
                </CollapsibleSection>

                {/* Mantine Properties - Only show if use_mantine_style is enabled */}
                {formValues.properties?.use_mantine_style === true && (
                    <CollapsibleSection
                        title="Mantine Properties"
                        inspectorType={INSPECTOR_TYPES.SECTION}
                        sectionName="mantine-properties"
                        defaultExpanded={false}
                    >
                        {fields.filter(field => !field.display && field.name.startsWith('mantine_')).length > 0 ? (
                            <Stack gap="md">
                                {fields.filter(field => !field.display && field.name.startsWith('mantine_')).map(field => renderPropertyField(field))}
                            </Stack>
                        ) : (
                            <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                                No Mantine property fields available for this section.
                            </Alert>
                        )}
                    </CollapsibleSection>
                )}
            </InspectorLayout>

            {/* Delete Confirmation Modal */}
            <Modal
                opened={deleteModalOpened}
                onClose={() => {
                    setDeleteModalOpened(false);
                    setDeleteConfirmText('');
                }}
                title="Delete Section"
                centered
            >
                <Stack gap="md">
                    <Alert color="red" title="Warning">
                        This action cannot be undone. The section and all its content will be permanently deleted.
                    </Alert>
                    
                    <Text size="sm">
                        To confirm deletion, please type the section name: <strong>{section.name}</strong>
                    </Text>
                    
                    <TextInput
                        placeholder="Enter section name to confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.currentTarget.value)}
                    />
                    
                    <Group justify="flex-end" gap="sm">
                        <Button
                            variant="light"
                            onClick={() => {
                                setDeleteModalOpened(false);
                                setDeleteConfirmText('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="red"
                            onClick={handleDeleteSection}
                            disabled={deleteConfirmText !== section.name}
                            loading={deleteSectionMutation.isPending}
                        >
                            Delete Section
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
} 