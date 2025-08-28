'use client';

import { 
    Box,
    Modal,
    Stack,
    Group,
    Text,
    TextInput,
    Button,
    Alert
} from '@mantine/core';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';

// API and Hooks
import { useSectionDetails } from '../../../../hooks/useSectionDetails';
import { useLanguages } from '../../../../hooks/useLanguages';
import { useUpdateSectionMutation, useDeleteSectionMutation } from '../../../../hooks/mutations';
import { exportSection } from '../../../../api/admin/section.api';

// Types
import { IUpdateSectionRequest } from '../../../../types/requests/admin/update-section.types';

// Utils
import { downloadJsonFile, generateExportFilename } from '../../../../utils/export-import.utils';
import { validateName, getNameValidationError } from '../../../../utils/name-validation.utils';
import { 
    initializeContentFieldValues, 
    initializePropertyFieldValues,
    getContentFields,
    getPropertyFields
} from '../../../../utils/field-value-extraction.utils';
// Components
import { 
    InspectorContainer,
    SectionInfo,
    generateSectionActions,
    SectionContentFields,
    SectionProperties,
    InspectorLayout,
    type IInspectorButton
} from './index';

// Styles
import styles from './SectionInspector.module.css';

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
            
            // Invalidate relevant queries to refresh data
            if (pageId) {
                queryClient.invalidateQueries({ queryKey: ['adminPages'] });
                queryClient.invalidateQueries({ queryKey: ['pageFields', pageId] });
                queryClient.invalidateQueries({ queryKey: ['pageSections', pageId] });
                queryClient.invalidateQueries({ queryKey: ['admin', 'sections', 'details', pageId, sectionId] });
                queryClient.invalidateQueries({ queryKey: ['pages'] });
                queryClient.invalidateQueries({ queryKey: ['page-content'] });
                queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
            }
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
        }
    });

    // Update form when section data changes
    useEffect(() => {
        if (sectionDetailsData && languages.length > 0) {
            const { section, fields } = sectionDetailsData;
            
            // Use utility functions for clean field processing
            const contentFieldsObject = initializeContentFieldValues(fields as any, languages);
            const propertyFieldsObject = initializePropertyFieldValues(fields as any);
            
            const newFormValues = {
                sectionName: section.name,
                properties: propertyFieldsObject,
                fields: contentFieldsObject
            };
            
            setFormValues(newFormValues);
            setOriginalValues(newFormValues);
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
        const contentFields = getContentFields(fields as any);
        const propertyFields = getPropertyFields(fields as any);
        
        // Prepare submit data structure (only changed fields) matching backend schema
        const submitData: IUpdateSectionRequest = {
            contentFields: [],
            propertyFields: []
        };
        
        // Check if section name changed
        if (formValues.sectionName !== originalValues.sectionName) {
            submitData.sectionName = formValues.sectionName;
        }
        
        // Process content fields (translatable) - only changed values
        contentFields.forEach((field) => {
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
                        value: currentValue || null
                    });
                }
            });
        });
        
        // Process property fields (non-translatable) - only changed values
        propertyFields.forEach((field) => {
            const currentValue = formValues.properties[field.name];
            const originalValue = originalValues.properties[field.name];
            
            // Only include if value has changed
            if (currentValue !== originalValue) {
                submitData.propertyFields.push({
                    fieldId: field.id,
                    value: currentValue !== undefined ? currentValue : null
                });
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

    const handleContentFieldChange = useCallback((fieldName: string, languageId: number | null, value: string | boolean) => {
        if (!languageId) return;
        setFormValues(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [fieldName]: {
                    ...prev.fields[fieldName],
                    [languageId]: String(value)
                }
            }
        }));
    }, []);

    const handlePropertyFieldChange = useCallback((fieldName: string, value: string | boolean) => {
        setFormValues(prev => ({
            ...prev,
            properties: {
                ...prev.properties,
                [fieldName]: value
            }
        }));
    }, []);

    const handleSectionNameChange = useCallback((value: string) => {
        setFormValues(prev => ({
            ...prev,
            sectionName: value
        }));
    }, []);

    // Generate action props for SectionActions component
    const sectionActions = useMemo(() => ({
        sectionId,
        sectionDetailsData,
        updateMutationPending: updateSectionMutation.isPending,
        deleteMutationPending: deleteSectionMutation.isPending,
        onSave: handleSave,
        onExport: handleExportSection,
        onDelete: () => setDeleteModalOpened(true)
    }), [
        sectionId,
        sectionDetailsData,
        updateSectionMutation.isPending,
        deleteSectionMutation.isPending,
        handleSave,
        handleExportSection
    ]);

    // Generate inspector buttons for parent callback
    useEffect(() => {
        if (onButtonsChange && sectionDetailsData?.section) {
            const actions = generateSectionActions(sectionActions);
            onButtonsChange(actions);
        }
    }, [onButtonsChange, sectionDetailsData?.section, sectionActions]);

    // Get fields data for processing using utility functions
    const fields = sectionDetailsData?.fields || [];
    const contentFields = getContentFields(fields as any);
    const propertyFields = getPropertyFields(fields as any);

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
                </Box>
            </InspectorLayout>
        );
    }

    const { section } = sectionDetailsData;

    return (
        <>
            <InspectorContainer
                inspectorType="section"
                inspectorTitle={`Section: ${section.name}`}
                inspectorId={section.id}
                inspectorButtons={generateSectionActions(sectionActions)}
            >
                {(sectionLoading || languagesLoading) && (
                    <Box p="md">
                        <Text size="sm" c="dimmed">Loading section details...</Text>
                    </Box>
                )}

                {sectionDetailsData && !sectionLoading && !languagesLoading && (
                    <>
                        {/* Section Information */}
                        <SectionInfo 
                            section={section}
                            sectionName={formValues.sectionName}
                            onSectionNameChange={handleSectionNameChange}
                        />

                        {/* Content Fields */}
                        <SectionContentFields 
                            contentFields={contentFields as any}
                            languages={languages}
                            fieldValues={formValues.fields}
                            onFieldChange={handleContentFieldChange}
                            className={styles.fullWidthLabel}
                        />

                        {/* Property Fields */}
                        <SectionProperties 
                            propertyFields={propertyFields as any}
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
