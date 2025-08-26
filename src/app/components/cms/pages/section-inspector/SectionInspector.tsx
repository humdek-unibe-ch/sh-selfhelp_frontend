'use client';

import { 
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
    IconDeviceFloppy, 
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSectionDetails } from '../../../../../hooks/useSectionDetails';
import { useLanguages } from '../../../../../hooks/useLanguages';
import { useUpdateSectionMutation, useDeleteSectionMutation } from '../../../../../hooks/mutations';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';
import { 
    InspectorLayout, 
    IFieldData,
    createFieldChangeHandlers,
    InspectorContainer,
    type IInspectorButton
} from '../../shared';
import { 
    SectionInformation, 
    SectionContentFields, 
    SectionPropertyFields 
} from './components';
import styles from './SectionInspector.module.css';
import { exportSection } from '../../../../../api/admin/section.api';
import { downloadJsonFile, generateExportFilename } from '../../../../../utils/export-import.utils';
import { AdminApi } from '../../../../../api/admin';
import { validateName, getNameValidationError } from '../../../../../utils/name-validation.utils';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';


interface ISectionInspectorProps {
    pageId: number | null;
    sectionId: number | null;
    // Callback to expose inspector buttons to parent
    onButtonsChange?: (buttons: IInspectorButton[]) => void;
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

export function SectionInspector({ pageId, sectionId, onButtonsChange }: ISectionInspectorProps) {
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
    const { handleContentFieldChange, handlePropertyFieldChange: originalHandlePropertyFieldChange } = createFieldChangeHandlers(
        setFormValues,
        'SectionInspector'
    );

    // Wrapper for property field change to match expected signature
    const handlePropertyFieldChange = useCallback((fieldName: string, value: string | boolean) => {
        originalHandlePropertyFieldChange(fieldName, null, value);
    }, [originalHandlePropertyFieldChange]);

    const handleSectionNameChange = (value: string) => {
        setFormValues(prev => ({
            ...prev,
            sectionName: value
        }));
    };

    // Expose inspector buttons to parent
    useEffect(() => {
        if (onButtonsChange && sectionDetailsData?.section) {
            const section = sectionDetailsData.section;
            const buttons: IInspectorButton[] = [
                {
                    id: 'save',
                    label: 'Save',
                    icon: <IconDeviceFloppy size="1rem" />,
                    onClick: handleSave,
                    variant: 'filled',
                    loading: updateSectionMutation.isPending,
                    disabled: !sectionId || updateSectionMutation.isPending || deleteSectionMutation.isPending
                },
                {
                    id: 'export',
                    label: 'Export',
                    icon: <IconFileExport size="1rem" />,
                    onClick: handleExportSection,
                    variant: 'outline',
                    color: 'blue',
                    disabled: !sectionId || deleteSectionMutation.isPending
                },
                {
                    id: 'delete',
                    label: 'Delete',
                    icon: <IconTrash size="1rem" />,
                    onClick: () => setDeleteModalOpened(true),
                    variant: 'outline',
                    color: 'red',
                    disabled: !sectionId || deleteSectionMutation.isPending
                }
            ];

            onButtonsChange(buttons);
        }
    }, [
        sectionDetailsData?.section,
        sectionId,
        updateSectionMutation.isPending,
        deleteSectionMutation.isPending,
        onButtonsChange
    ]);

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
        fieldConfig: field.fieldConfig
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

    console.log('Section Inspector Rendered', sectionLoading, languagesLoading);

    // Don't show full loading screen - it breaks UI experience
    // Instead, show loading state within the inspector container

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



    // Prepare inspector buttons
    const inspectorButtons = [
        {
            id: 'save',
            label: 'Save',
            icon: <IconDeviceFloppy size="1rem" />,
            onClick: handleSave,
            variant: 'filled' as const,
            loading: updateSectionMutation.isPending,
            disabled: !sectionId || !sectionDetailsData
        },
        {
            id: 'export',
            label: 'Export',
            icon: <IconFileExport size="1rem" />,
            onClick: handleExportSection,
            variant: 'outline' as const,
            color: 'blue',
            disabled: !sectionId || !sectionDetailsData
        },
        {
            id: 'delete',
            label: 'Delete Section',
            icon: <IconTrash size="1rem" />,
            onClick: () => setDeleteModalOpened(true),
            variant: 'outline' as const,
            color: 'red',
            disabled: !sectionId || !sectionDetailsData
        }
    ];

    return (
        <>
            <InspectorContainer
                inspectorType="section"
                inspectorTitle={sectionDetailsData ? `Section: ${section.name}` : 'Loading...'}
                inspectorId={sectionDetailsData ? section.id : ''}
                inspectorButtons={sectionDetailsData ? inspectorButtons : []}
            >
                {(sectionLoading || languagesLoading) && (
                    <Box p="md">
                        <Text size="sm" c="dimmed">Loading section details...</Text>
                    </Box>
                )}

                {sectionDetailsData && !sectionLoading && !languagesLoading && (
                    <>
                        {/* Section Information - Using modular component */}
                        <SectionInformation 
                            section={section}
                            sectionName={formValues.sectionName}
                            onSectionNameChange={handleSectionNameChange}
                        />

                        {/* Content Fields - Using modular component */}
                        <SectionContentFields 
                            contentFields={contentFields}
                            languages={languages}
                            fieldValues={formValues.fields}
                            onFieldChange={handleContentFieldChange}
                            className={styles.fullWidthLabel}
                        />

                        {/* Property Fields - Using modular component */}
                        <SectionPropertyFields 
                            propertyFields={propertyFields}
                            languages={languages}
                            fieldValues={formValues.properties}
                            onFieldChange={handlePropertyFieldChange}
                            className={styles.fullWidthLabel}
                        />
                    </>
                )}
            </InspectorContainer>

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