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
} from '@mantine/core';
import { 
    IconInfoCircle, 
    IconDeviceFloppy, 
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSectionDetails } from '../../../../../hooks/useSectionDetails';
import { useLanguages } from '../../../../../hooks/useLanguages';
import { useUpdateSectionMutation, useDeleteSectionMutation } from '../../../../../hooks/mutations';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';
import { 
    IFieldData,
    createFieldChangeHandlers,
} from '../../shared';
import styles from './SectionInspector.module.css';
import { exportSection } from '../../../../../api/admin/section.api';
import { downloadJsonFile, generateExportFilename } from '../../../../../utils/export-import.utils';
import { AdminApi } from '../../../../../api/admin';
import { validateName, getNameValidationError } from '../../../../../utils/name-validation.utils';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { FieldsSection } from '../../shared/fields-section/FieldsSection';
import { InspectorLayout } from '../../shared/inspector-layout/InspectorLayout';
import { InspectorHeader } from '../../shared/inspector-header/InspectorHeader';

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

export function SectionInspector({ pageId, sectionId }: ISectionInspectorProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [formValues, setFormValues] = useState<ISectionFormValues>({
        sectionName: '',
        properties: {},
        fields: {}
    });
    
    // Track original values to detect changes
    const [originalValues, setOriginalValues] = useState<ISectionFormValues>({
        sectionName: '',
        properties: {},
        fields: {}
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
    const { languages, isLoading: languagesLoading } = useLanguages();
    
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

    // Update form when section data changes
    useEffect(() => {
        if (sectionDetailsData && languages.length > 0) {
            const { section, fields } = sectionDetailsData;
            
            // Process fields for SectionInspector (which has different structure than PageInspector)
            const contentFields = fields.filter(field => field.display);
            const propertyFields = fields.filter(field => !field.display);
            
            // Process content fields (translatable) - use similar logic to the utility but adapted for ISectionField
            const contentFieldsObject: Record<string, Record<number, string>> = {};
            contentFields.forEach(field => {
                contentFieldsObject[field.name] = {};

                // Initialize all languages with empty strings first
                languages.forEach(lang => {
                    contentFieldsObject[field.name][lang.id] = '';
                });

                if (field.display) {
                    // Content fields: populate based on actual language_id from translations
                    field.translations.forEach(translation => {
                        const language = languages.find(l => l.id === translation.language_id);
                        if (language) {
                            contentFieldsObject[field.name][language.id] = translation.content || field.default_value || '';
                        }
                    });
                } else {
                    // Property fields: find content from language_id = 1 and replicate across all languages
                    const propertyTranslation = field.translations.find(t => t.language_id === 1);
                    const propertyContent = propertyTranslation?.content || field.default_value || '';
                    
                    // Replicate property field content to all language tabs for editing convenience
                    languages.forEach(language => {
                        contentFieldsObject[field.name][language.id] = propertyContent;
                    });
                }
            });

            // Process property fields for the properties object (SectionInspector uses a different structure)
            const propertyFieldsObject: Record<string, string | boolean> = {};
            
            propertyFields.forEach(field => {
                // Get the property field content from language ID 1 (where it's stored)
                const propertyTranslation = field.translations.find(t => t.language_id === 1);
                const value = propertyTranslation?.content || field.default_value || '';

                // Convert to appropriate type based on field type
                if (field.type === 'checkbox') {
                    propertyFieldsObject[field.name] = value === '1' || value === 'true' || value === 'on';
                } else {
                    propertyFieldsObject[field.name] = value;
                }


                

            });
            
            const newFormValues = {
                sectionName: section.name,
                properties: propertyFieldsObject,
                fields: contentFieldsObject
            };
            
            setFormValues(newFormValues);
            setOriginalValues(newFormValues); // Store original values for change detection
        } else {
            
            // Reset form when no section is selected
            const resetValues = {
                sectionName: '',
                properties: {},
                fields: {}
            };
            
            setFormValues(resetValues);
            setOriginalValues(resetValues);
        }
    }, [sectionDetailsData, languages]);

    const handleSave = async () => {
        if (!sectionId || !sectionDetailsData || !languages.length || !pageId) return;
        
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
        
        const { fields } = sectionDetailsData;
        const contentFields = fields.filter(field => field.display);
        const propertyFields = fields.filter(field => !field.display);
        
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
            }>
        } as any;
        
        // Check if section name changed
        if (formValues.sectionName !== originalValues.sectionName) {
            submitData.sectionName = formValues.sectionName;
        }
        
        // Process content fields (translatable) - only changed values
        contentFields.forEach(field => {
            const currentFieldValues = formValues.fields[field.name] || {};
            const originalFieldValues = originalValues.fields[field.name] || {};
            
            languages.forEach(language => {
                const currentValue = currentFieldValues[language.id] || '';
                const originalValue = originalFieldValues[language.id] || '';
                
                // Only include if value has changed
                if (currentValue !== originalValue) {
                    submitData.contentFields.push({
                        fieldId: field.id,
                        languageId: language.id,
                        value: currentValue
                    });
                }
            });
        });
        
        // Process property fields (non-translatable) - only changed values
        propertyFields.forEach(field => {
            const currentValue = formValues.properties[field.name];
            const originalValue = originalValues.properties[field.name];
            
            // Only include if value has changed
            if (currentValue !== originalValue) {
                const fieldEntry = {
                    fieldId: field.id,
                    value: currentValue !== undefined ? currentValue : ''
                };
                
                submitData.propertyFields.push(fieldEntry);
                

            }
        });
        
        // Check if there are any changes to submit
        const hasChanges = submitData.sectionName !== undefined || 
                          submitData.contentFields.length > 0 || 
                          submitData.propertyFields.length > 0;
        
        if (!hasChanges) {

            return;
        }
        
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
    };

    const handleDeleteSection = () => {
        if (!sectionId || !sectionDetailsData || !pageId) return;
        
        if (deleteConfirmText === sectionDetailsData.section.name) {

            deleteSectionMutation.mutate({
                pageId,
                sectionId
            });
        }
    };

    const handleExportSection = async () => {
        if (!sectionId || !sectionDetailsData || !pageId) return;
        
        try {
            const response = await exportSection(pageId, sectionId);
            const filename = generateExportFilename(`section_${sectionDetailsData.section.name}_${sectionId}`);
            downloadJsonFile(response.data.sectionsData, filename);
        } catch (error) {

            // Error notification is handled by the download function
        }
    };

    // Use shared field change handlers
    const { handleContentFieldChange, handlePropertyFieldChange } = createFieldChangeHandlers(
        setFormValues,
        'SectionInspector'
    );

    const handleSectionNameChange = (value: string) => {
        setFormValues(prev => ({
            ...prev,
            sectionName: value
        }));
    };

    // Convert ISectionField to IFieldData
    const convertToFieldData = (field: ISectionField): IFieldData => ({
        id: field.id,
        name: field.name,
        title: field.title,
        type: field.type,
        default_value: field.default_value,
        help: field.help,
        disabled: field.disabled,
        hidden: field.hidden,
        display: field.display,
        fieldConfig: field.fieldConfig,
        translations: field.translations
    });

    // Get fields data for processing
    const fields = sectionDetailsData?.fields || [];
    const contentFields = fields.filter(field => field.display).map(convertToFieldData);
    const propertyFields = fields.filter(field => !field.display).map(convertToFieldData);

    // Check if we have multiple languages for content fields
    const hasMultipleLanguages = useMemo(() => {
        return languages.length > 1;
    }, [languages]);

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

    const headerBadges = [
        { label: `ID: ${section.id}`, color: 'blue' },
        { label: section.style.name, color: 'green' },
        ...(section.style.canHaveChildren ? [{ label: 'Can Have Children', color: 'green' }] : []),
        { label: `Type ID: ${section.style.typeId}`, color: 'gray' }
    ];

    const headerActions = [
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
                <FieldsSection
                    title="Content Fields"
                    fields={contentFields}
                    languages={languages}
                    fieldValues={formValues.fields}
                    onFieldChange={handleContentFieldChange}
                    isMultiLanguage={true}
                    className={styles.fullWidthLabel}
                />

                {/* Property Fields */}
                <FieldsSection
                    title="Properties"
                    fields={propertyFields}
                    languages={languages}
                    fieldValues={formValues.properties}
                    onFieldChange={handlePropertyFieldChange}
                    isMultiLanguage={false}
                    className={styles.fullWidthLabel}
                />
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