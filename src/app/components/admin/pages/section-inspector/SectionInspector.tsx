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
    Badge
} from '@mantine/core';
import { 
    IconInfoCircle, 
    IconDeviceFloppy, 
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import { useSectionDetails } from '../../../../../hooks/useSectionDetails';
import { useLanguages } from '../../../../../hooks/useLanguages';
import { ISectionField } from '../../../../../types/responses/admin/admin.types';
import { debug } from '../../../../../utils/debug-logger';
import { 
    InspectorLayout, 
    InspectorHeader, 
    FieldsSection, 
    IFieldData 
} from '../../shared';
import styles from './SectionInspector.module.css';

interface ISectionInspectorProps {
    keyword: string | null;
    sectionId: number | null;
}

interface ISectionFormValues {
    // Section name (editable)
    sectionName: string;
    
    // Section properties (non-translatable fields)
    properties: Record<string, string | boolean>;
    
    // Field values by language (translatable fields)
    fields: Record<string, Record<string, string>>; // fields[fieldName][languageCode] = content
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
        languageCode: string; // For debugging
    }>;
    
    // Property fields (only changed fields)
    propertyFields: Array<{
        fieldId: number;
        value: string | boolean;
        fieldName: string; // For debugging
    }>;
}

export function SectionInspector({ keyword, sectionId }: ISectionInspectorProps) {
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
        error: sectionError 
    } = useSectionDetails(keyword, sectionId, !!keyword && !!sectionId);

    // Fetch available languages
    const { languages, isLoading: languagesLoading } = useLanguages();

    // Update form when section data changes
    useEffect(() => {
        if (sectionDetailsData && languages.length > 0) {
            const { section, fields } = sectionDetailsData;
            
            // Separate content fields (display: true) from property fields (display: false)
            const contentFields = fields.filter(field => field.display);
            const propertyFields = fields.filter(field => !field.display);
            
            // Create fields object organized by field name and language
            const fieldsObject: Record<string, Record<string, string>> = {};
            contentFields.forEach(field => {
                fieldsObject[field.name] = {};
                // Initialize all languages with empty strings first
                languages.forEach(lang => {
                    fieldsObject[field.name][lang.code] = '';
                });
                // Then populate with actual data
                field.translations.forEach(translation => {
                    // For content fields, match by locale
                    const matchingLang = languages.find(lang => lang.locale === translation.language_code);
                    if (matchingLang) {
                        fieldsObject[field.name][matchingLang.code] = translation.content || field.default_value || '';
                    } else {
                        // Fallback: try to match by language code
                        const langCode = translation.language_code?.split('-')[0];
                        const fallbackLang = languages.find(lang => lang.code === langCode);
                        if (fallbackLang) {
                            fieldsObject[field.name][fallbackLang.code] = translation.content || field.default_value || '';
                        }
                    }
                });
            });

            // Create properties object for non-translatable fields
            const propertiesObject: Record<string, string | boolean> = {};
            propertyFields.forEach(field => {
                // For property fields, use the first translation with language_code 'property'
                const propertyTranslation = field.translations.find(t => t.language_code === 'property');
                const value = propertyTranslation?.content || field.default_value || '';
                
                // Convert to appropriate type based on field type
                if (field.type === 'checkbox') {
                    propertiesObject[field.name] = value === '1' || value === 'true';
                } else {
                    propertiesObject[field.name] = value;
                }
            });

            const newFormValues = {
                sectionName: section.name,
                properties: propertiesObject,
                fields: fieldsObject
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

    const handleSave = () => {
        if (!sectionId || !sectionDetailsData || !languages.length) return;
        
        const { fields } = sectionDetailsData;
        const contentFields = fields.filter(field => field.display);
        const propertyFields = fields.filter(field => !field.display);
        
        // Prepare submit data structure (only changed fields)
        const submitData: ISectionSubmitData = {
            contentFields: [],
            propertyFields: []
        };
        
        // Check if section name changed
        if (formValues.sectionName !== originalValues.sectionName) {
            submitData.sectionName = formValues.sectionName;
        }
        
        // Process content fields (translatable) - only changed values
        contentFields.forEach(field => {
            const currentFieldValues = formValues.fields[field.name] || {};
            const originalFieldValues = originalValues.fields[field.name] || {};
            
            languages.forEach(language => {
                const currentValue = currentFieldValues[language.code] || '';
                const originalValue = originalFieldValues[language.code] || '';
                
                // Only include if value has changed
                if (currentValue !== originalValue) {
                    submitData.contentFields.push({
                        fieldId: field.id,
                        languageId: language.id,
                        value: currentValue,
                        fieldName: field.name, // For debugging
                        languageCode: language.code // For debugging
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
                submitData.propertyFields.push({
                    fieldId: field.id,
                    value: currentValue !== undefined ? currentValue : '',
                    fieldName: field.name // For debugging
                });
            }
        });
        
        // Check if there are any changes to submit
        const hasChanges = submitData.sectionName !== undefined || 
                          submitData.contentFields.length > 0 || 
                          submitData.propertyFields.length > 0;
        
        if (!hasChanges) {
            console.log('ℹ️ No changes detected - nothing to save');
            return;
        }
        
        debug('Save section - only changed fields', 'SectionInspector', { 
            sectionId,
            submitData,
            sectionNameChanged: submitData.sectionName !== undefined,
            contentFieldsChanged: submitData.contentFields.length,
            propertyFieldsChanged: submitData.propertyFields.length,
            totalChanges: (submitData.sectionName !== undefined ? 1 : 0) + 
                         submitData.contentFields.length + 
                         submitData.propertyFields.length
        });
        
        // Log the prepared data for backend implementation
        console.log('🚀 Section Submit Data (Only Changes) Ready for Backend:', {
            sectionId,
            ...submitData
        });
        
        // Update original values after successful save (when backend is implemented)
        // setOriginalValues({ ...formValues });
        
        // TODO: Implement section update mutation with submitData
    };

    const handleDeleteSection = () => {
        if (!sectionId || !sectionDetailsData) return;
        
        if (deleteConfirmText === sectionDetailsData.section.name) {
            debug('Deleting section', 'SectionInspector', { sectionId });
            // TODO: Implement section delete mutation
            console.log('Section delete functionality to be implemented');
        }
    };

    const handleExportSection = () => {
        if (!sectionId || !sectionDetailsData) return;
        
        debug('Exporting section', 'SectionInspector', { sectionId });
        // TODO: Implement section export functionality
        console.log('Section export functionality to be implemented');
    };

    const handleContentFieldChange = (fieldName: string, languageCode: string | null, value: string | boolean) => {
        if (!languageCode) return;
        
        setFormValues(prev => ({
            ...prev,
            fields: {
                ...prev.fields,
                [fieldName]: {
                    ...prev.fields[fieldName],
                    [languageCode]: String(value)
                }
            }
        }));
    };

    const handlePropertyFieldChange = (fieldName: string, languageCode: string | null, value: string | boolean) => {
        setFormValues(prev => ({
            ...prev,
            properties: {
                ...prev.properties,
                [fieldName]: value
            }
        }));
    };

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
        type: field.type,
        default_value: field.default_value,
        help: field.help,
        disabled: field.disabled,
        hidden: field.hidden,
        display: field.display
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
                <></>
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
                <></>
            </InspectorLayout>
        );
    }

    if (!sectionDetailsData) {
        return (
            <InspectorLayout
                header={<></>}
                error="The selected section could not be found."
            >
                <></>
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
            disabled: !sectionId
        },
        {
            label: 'Export',
            icon: <IconFileExport size="1rem" />,
            onClick: handleExportSection,
            variant: 'light' as const,
            disabled: !sectionId
        },
        {
            label: 'Delete',
            icon: <IconTrash size="1rem" />,
            onClick: () => setDeleteModalOpened(true),
            variant: 'light' as const,
            color: 'red',
            disabled: !sectionId
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
                <Paper withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
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
                        >
                            Delete Section
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
} 