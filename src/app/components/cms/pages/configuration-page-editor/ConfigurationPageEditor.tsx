'use client';

import {
    Paper,
    Title,
    Text,
    Group,
    Badge,
    Stack,
    Box,
    Alert,
    Button,
    ActionIcon,
    Collapse,
    Tabs,
    Container,
    Card,
} from '@mantine/core';
import {
    IconInfoCircle,
    IconDeviceFloppy,
    IconChevronDown,
    IconChevronUp,
    IconLanguage,
    IconSettings
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
import { useState, useEffect, useMemo } from 'react';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { usePageFields } from '../../../../../hooks/usePageDetails';
import { useUpdatePageMutation } from '../../../../../hooks/mutations/useUpdatePageMutation';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import { IUpdatePageData, IUpdatePageRequest } from '../../../../../types/requests/admin/update-page.types';
import { notifications } from '@mantine/notifications';
import styles from './ConfigurationPageEditor.module.css';
import { FieldRenderer, IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { useQueryClient } from '@tanstack/react-query';
import { 
    processAllFields, 
    isContentField, 
    isPropertyField, 
    validateFieldProcessing,
    initializeFieldFormValues
} from '../../../../../utils/field-processing.utils';
import { IPageField } from '../../../../../types/common/pages.type';

interface ConfigurationPageEditorProps {
    page: IAdminPage;
}

interface IConfigFormValues {
    fields: Record<string, Record<number, string>>; // fields[fieldName][languageId] = content
}

export function ConfigurationPageEditor({ page }: ConfigurationPageEditorProps) {
    const [contentExpanded, setContentExpanded] = useState(true);
    const [propertiesExpanded, setPropertiesExpanded] = useState(true);
    const [activeLanguageTab, setActiveLanguageTab] = useState<string>('');
    const queryClient = useQueryClient();

    // Fetch page fields
    const {
        data: pageFieldsData,
        isLoading: fieldsLoading,
        error: fieldsError,
        refetch: refetchPageFields
    } = usePageFields(page.id_pages, true);

    // Fetch available languages
    const { languages: languagesData, isLoading: languagesLoading } = usePublicLanguages();

    // Set default active language tab when languages are loaded
    useEffect(() => {
        if (languagesData.length > 0 && !activeLanguageTab) {
            const firstLangId = languagesData[0].id.toString();
            setActiveLanguageTab(firstLangId);
        }
    }, [languagesData, activeLanguageTab]);

    // Update page mutation
    const updatePageMutation = useUpdatePageMutation({
        onSuccess: () => {
            notifications.show({
                title: 'Success',
                message: 'Configuration saved successfully',
                color: 'green',
            });
            // Refetch page fields to reload the data
            refetchPageFields();
            
            // Invalidate relevant queries to refresh data - using consistent query keys
            queryClient.invalidateQueries({ queryKey: ['adminPages'] }); // Admin pages list
            queryClient.invalidateQueries({ queryKey: ['pageFields', page.keyword] }); // Page fields
            queryClient.invalidateQueries({ queryKey: ['pageSections', page.keyword] }); // Page sections
            queryClient.invalidateQueries({ queryKey: ['pages'] }); // Frontend pages
            queryClient.invalidateQueries({ queryKey: ['page-content'] }); // Frontend page content
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] }); // Frontend pages with language
            
            // Also invalidate any admin-specific queries that might exist
            queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'page', page.keyword] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'page-fields', page.keyword] });
        }
    });

    // Form for configuration editing
    const form = useForm<IConfigFormValues>({
        initialValues: {
            fields: {}
        }
    });

    // Get description field value
    const descriptionValue = useMemo(() => {
        if (!pageFieldsData?.fields || !languagesData.length) return '';

        const descriptionField = pageFieldsData.fields.find(f => f.name.toLowerCase() === 'description');
        if (!descriptionField) return '';

        // Get the first language's description
        const firstLang = languagesData[0];
        const translation = descriptionField.translations.find(t => t.language_id === firstLang.id);
        return translation?.content || '';
    }, [pageFieldsData, languagesData]);

    // Filter out system fields (title and description) from content fields
    const contentFields = useMemo(() => {
        if (!pageFieldsData?.fields) return [];
        return pageFieldsData.fields.filter(field =>
            isContentField(field) &&
            !['title', 'description'].includes(field.name.toLowerCase())
        );
    }, [pageFieldsData]);

    const propertyFields = useMemo(() => {
        if (!pageFieldsData?.fields) return [];
        return pageFieldsData.fields.filter(field => isPropertyField(field));
    }, [pageFieldsData]);

    // Check if we have multiple languages for content fields
    const hasMultipleLanguages = useMemo(() => {
        return languagesData.length > 1;
    }, [languagesData]);

    // Update form when page data changes
    useEffect(() => {
        if (pageFieldsData && languagesData.length > 0) {
            // Use the modular field initialization utility that handles content vs property fields correctly
            const fieldsObject = initializeFieldFormValues(pageFieldsData.fields, languagesData);

            form.setValues({ fields: fieldsObject });
        }
    }, [pageFieldsData, languagesData]);

    // Debug: Monitor form value changes for CSS fields
    useEffect(() => {
        if (pageFieldsData?.fields && form.values.fields) {
            const cssFields = pageFieldsData.fields.filter(f => f.type === 'css');
        }
    }, [form.values.fields, pageFieldsData?.fields, languagesData]);

    // Save hotkey (Ctrl+S)
    useHotkeys([
        ['ctrl+S', (e) => {
            e.preventDefault();
            handleSave();
        }]
    ]);

    const handleSave = () => {

        // Validate field processing rules
        const validationWarnings: string[] = [];
        pageFieldsData?.fields.forEach(field => {
            const validation = validateFieldProcessing(field);
            validationWarnings.push(...validation.warnings);
        });
        

        // Prepare data - configuration pages don't need page properties
        const pageData: IUpdatePageData = {
            // Keep existing values
            url: page.url,
            headless: pageFieldsData?.page.headless || false,
            navPosition: page.nav_position,
            footerPosition: page.footer_position,
            openAccess: pageFieldsData?.page.openAccess || false,
            pageAccessTypeCode: pageFieldsData?.page.pageAccessType?.lookupCode || '',
        };

        // Use the modular field processing utility
        const processedFields = processAllFields({
            fields: pageFieldsData?.fields || [],
            formValues: form.values.fields || {},
            languages: languagesData
        });

        const backendPayload: IUpdatePageRequest = {
            pageData,
            fields: processedFields.fieldEntries
        };

        // Debug: Log the final payload with field analysis
        const cssFields = processedFields.fieldEntries.filter(f => {
            const field = pageFieldsData?.fields.find(pf => pf.id === f.fieldId);
            return field?.type === 'css';
        });

        updatePageMutation.mutate({
            pageId: page.id_pages,
            updateData: backendPayload
        });
    };

    // Render content field
    const renderContentField = (field: IPageField, languageId: number) => {
        const currentLanguage = languagesData.find(lang => lang.id === languageId);
        const locale = hasMultipleLanguages && currentLanguage ? currentLanguage.locale : undefined;
        const fieldValue = form.values.fields?.[field.name]?.[languageId] ?? '';
        
        // Convert IPageField to IFieldData
        const fieldData: IFieldData = {
            id: field.id,
            name: field.name,
            title: field.title,
            type: field.type,
            default_value: field.default_value,
            help: field.help,
            display: field.display,
            config: field.config,
            translations: field.translations || []
        };
        
        return (
            <FieldRenderer
                key={`${field.id}-${languageId}`}
                field={fieldData}
                value={fieldValue}
                onChange={(value) => {
                    const fieldKey = `fields.${field.name}.${languageId}`;
                    form.setFieldValue(fieldKey, value);
                }}
                locale={locale}
            />
        );
    };

    // Render property field
    const renderPropertyField = (field: IPageField) => {
        // Property fields use language_id = 1 (property language)
        const langId = 1;
        const fieldValue = form.values.fields?.[field.name]?.[langId] ?? '';
        
        // Convert IPageField to IFieldData
        const fieldData: IFieldData = {
            id: field.id,
            name: field.name,
            title: field.title,
            type: field.type,
            default_value: field.default_value,
            help: field.help,
            display: field.display,
            config: field.config,
            translations: field.translations || []
        };
        
        return (
            <FieldRenderer
                field={fieldData}
                value={fieldValue}
                onChange={(value) => {
                    // Update the value for all languages since property fields are not translatable
                    languagesData.forEach(language => {
                        const fieldKey = `fields.${field.name}.${language.id}`;
                        form.setFieldValue(fieldKey, value);
                    });
                }}
            />
        );
    };

    if (fieldsLoading || languagesLoading) {
        return (
            <Container size="xl" p="md">
                <Alert color="blue">Loading configuration page...</Alert>
            </Container>
        );
    }

    if (fieldsError) {
        return (
            <Container size="xl" p="md">
                <Alert color="red" title="Error loading page details">
                    {fieldsError.message}
                </Alert>
            </Container>
        );
    }

    return (
        <Box className={styles.backgroundGray} style={{ minHeight: '100vh' }}>
            <Container size="xl" p="md" className={styles.fullHeight}>
                <Stack gap="lg" className={styles.fullHeight}>
                    {/* Info Alert - moved to top */}
                    <Alert
                        icon={<IconInfoCircle size="1.2rem" />}
                        color="blue"
                        variant="light"
                        radius="md"
                    >
                        <Text size="sm">
                            Configuration pages control system-wide settings and behaviors.
                            The <strong>title</strong> and <strong>description</strong> fields are system-managed and cannot be edited directly.
                        </Text>
                    </Alert>

                    {/* Header Section - made smaller */}
                    <Paper shadow="md" p="md" withBorder radius="md" className={styles.headerSection}>
                        <Group justify="space-between" align="center">
                            <Group gap="xs">
                                <Badge color="purple" variant="filled" size="md" radius="md">
                                    Configuration Page
                                </Badge>
                                <Title order={2} fw={600}>
                                    {page.keyword}
                                </Title>
                            </Group>
                            <Button
                                leftSection={<IconDeviceFloppy size="1rem" />}
                                onClick={handleSave}
                                size="sm"
                                loading={updatePageMutation.isPending}
                                radius="sm"
                            >
                                Save
                            </Button>
                        </Group>
                        <Group>
                            {descriptionValue && (
                                <Text c="dimmed" size="sm" ml="xs" mt="xs">
                                    {descriptionValue}
                                </Text>
                            )}
                        </Group>
                    </Paper>

                    {/* Content Section */}
                    {contentFields.length > 0 && (
                        <Card shadow="sm" withBorder radius="md">
                            <Card.Section
                                p="md"
                                className={styles.contentSectionHeader}
                                onClick={() => setContentExpanded(!contentExpanded)}
                            >
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <IconLanguage size={20} color="var(--mantine-color-blue-6)" />
                                        <Title order={4}>Content</Title>
                                        <Badge color="blue" variant="light" size="sm">{contentFields.length} fields</Badge>
                                    </Group>
                                    <ActionIcon variant="subtle" size="md">
                                        {contentExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                    </ActionIcon>
                                </Group>
                            </Card.Section>

                            <Collapse in={contentExpanded}>
                                <Card.Section p="lg">
                                    {hasMultipleLanguages ? (
                                        <Tabs value={activeLanguageTab} onChange={(value) => setActiveLanguageTab(value || languagesData[0]?.id.toString() || '')}>
                                            <Tabs.List mb="md">
                                                {languagesData.map(lang => {
                                                    const langId = lang.id.toString();
                                                    return (
                                                        <Tabs.Tab key={langId} value={langId} fw={500}>
                                                            {lang.language}
                                                        </Tabs.Tab>
                                                    );
                                                })}
                                            </Tabs.List>

                                            {languagesData.map(lang => {
                                                const langId = lang.id.toString();
                                                return (
                                                    <Tabs.Panel key={langId} value={langId}>
                                                        <div className={styles.fieldGrid}>
                                                            {contentFields.map(field => (
                                                                <div key={field.id}>
                                                                    {renderContentField(field, lang.id)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Tabs.Panel>
                                                );
                                            })}
                                        </Tabs>
                                    ) : (
                                        <div className={styles.fieldGrid}>
                                            {contentFields.map(field => (
                                                <div key={field.id}>
                                                    {renderContentField(field, languagesData[0]?.id || 1)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card.Section>
                            </Collapse>
                        </Card>
                    )}

                    {/* Properties Section */}
                    {propertyFields.length > 0 && (
                        <Card shadow="sm" withBorder radius="md">
                            <Card.Section
                                p="md"
                                className={styles.propertiesSectionHeader}
                                onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                            >
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <IconSettings size={20} color="var(--mantine-color-purple-6)" />
                                        <Title order={4}>Properties</Title>
                                        <Badge color="purple" variant="light" size="sm">{propertyFields.length} properties</Badge>
                                    </Group>
                                    <ActionIcon variant="subtle" size="md">
                                        {propertiesExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                    </ActionIcon>
                                </Group>
                            </Card.Section>

                            <Collapse in={propertiesExpanded}>
                                <Card.Section p="lg">
                                    <div className={styles.fieldGrid}>
                                        {propertyFields.map(field => (
                                            <div key={field.id}>
                                                {renderPropertyField(field)}
                                            </div>
                                        ))}
                                    </div>
                                </Card.Section>
                            </Collapse>
                        </Card>
                    )}
                </Stack>
            </Container>
        </Box>
    );
} 