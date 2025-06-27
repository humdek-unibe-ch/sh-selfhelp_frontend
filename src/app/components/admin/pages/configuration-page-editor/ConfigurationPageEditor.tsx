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
    TextInput,
    Textarea,
    ActionIcon,
    Tooltip,
    Collapse,
    Tabs,
    Container,
    Card,
    Divider
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
import { useLanguages } from '../../../../../hooks/useLanguages';
import { FieldLabelWithTooltip } from '../../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { IPageField } from '../../../../../types/responses/admin/page-details.types';
import { IUpdatePageField, IUpdatePageData, IUpdatePageRequest } from '../../../../../types/requests/admin/update-page.types';
import { debug } from '../../../../../utils/debug-logger';
import { notifications } from '@mantine/notifications';
import styles from './ConfigurationPageEditor.module.css';
import { FieldRenderer, IFieldData } from '../../shared/field-renderer/FieldRenderer';
import { useQueryClient } from '@tanstack/react-query';

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
    } = usePageFields(page.keyword, true);

    // Fetch available languages
    const { languages, isLoading: languagesLoading } = useLanguages();

    // Set default active language tab when languages are loaded
    useEffect(() => {
        if (languages.length > 0 && !activeLanguageTab) {
            const firstLangId = languages[0].id.toString();
            setActiveLanguageTab(firstLangId);
        }
    }, [languages, activeLanguageTab]);

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
        if (!pageFieldsData?.fields || !languages.length) return '';

        const descriptionField = pageFieldsData.fields.find(f => f.name.toLowerCase() === 'description');
        if (!descriptionField) return '';

        // Get the first language's description
        const firstLang = languages[0];
        const translation = descriptionField.translations.find(t => t.language_id === firstLang.id);
        return translation?.content || '';
    }, [pageFieldsData, languages]);

    // Filter out system fields (title and description) from content fields
    const contentFields = useMemo(() => {
        if (!pageFieldsData?.fields) return [];
        return pageFieldsData.fields.filter(field =>
            field.display &&
            !['title', 'description'].includes(field.name.toLowerCase())
        );
    }, [pageFieldsData]);

    const propertyFields = useMemo(() => {
        if (!pageFieldsData?.fields) return [];
        return pageFieldsData.fields.filter(field => !field.display);
    }, [pageFieldsData]);

    // Check if we have multiple languages for content fields
    const hasMultipleLanguages = useMemo(() => {
        return languages.length > 1;
    }, [languages]);

    // Update form when page data changes
    useEffect(() => {
        if (pageFieldsData && languages.length > 0) {
            const fieldsObject: Record<string, Record<number, string>> = {};

            // Initialize all fields with empty strings for all languages
            pageFieldsData.fields.forEach(field => {
                fieldsObject[field.name] = {};
                languages.forEach(language => {
                    fieldsObject[field.name][language.id] = '';
                });
            });

            // Populate with actual field content from translations
            pageFieldsData.fields.forEach(field => {
                field.translations.forEach(translation => {
                    const language = languages.find(l => l.id === translation.language_id);
                    if (language) {
                        fieldsObject[field.name][language.id] = translation.content || '';
                    }
                });
            });

            form.setValues({ fields: fieldsObject });
        }
    }, [pageFieldsData, languages]);

    // Save hotkey (Ctrl+S)
    useHotkeys([
        ['ctrl+S', (e) => {
            e.preventDefault();
            handleSave();
        }]
    ]);

    const handleSave = () => {
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

        // Prepare field translations
        const fields: IUpdatePageField[] = [];

        // Process all fields (including system fields like title and description)
        pageFieldsData?.fields.forEach(field => {
            if (field.display) {
                // Content fields - translated
                languages.forEach(language => {
                    const content = form.values.fields?.[field.name]?.[language.id] || '';
                    fields.push({
                        fieldId: field.id,
                        languageId: language.id,
                        content: content,
                    });
                });
            } else {
                // Property fields - language ID 1
                const content = form.values.fields?.[field.name]?.[1] || '';
                fields.push({
                    fieldId: field.id,
                    languageId: 1,
                    content: content,
                });
            }
        });

        const backendPayload: IUpdatePageRequest = {
            pageData,
            fields
        };

        debug('Saving configuration page', 'ConfigurationPageEditor', {
            keyword: page.keyword,
            payload: backendPayload
        });

        updatePageMutation.mutate({
            keyword: page.keyword,
            updateData: backendPayload
        });
    };

    // Render content field
    const renderContentField = (field: IPageField, languageId: number) => {
        const currentLanguage = languages.find(lang => lang.id === languageId);
        const locale = hasMultipleLanguages && currentLanguage ? currentLanguage.locale : undefined;
        const fieldValue = form.values.fields?.[field.name]?.[languageId] ?? '';
        
        // Convert IPageField to IFieldData
        const fieldData: IFieldData = {
            id: field.id,
            name: field.name,
            type: field.type,
            default_value: field.default_value,
            help: field.help,
            display: field.display
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
        const langId = languages[0]?.id || 1;
        const fieldValue = form.values.fields?.[field.name]?.[langId] ?? '';
        
        // Convert IPageField to IFieldData
        const fieldData: IFieldData = {
            id: field.id,
            name: field.name,
            type: field.type,
            default_value: field.default_value,
            help: field.help,
            display: field.display
        };
        
        return (
            <FieldRenderer
                field={fieldData}
                value={fieldValue}
                onChange={(value) => {
                    const fieldKey = `fields.${field.name}.${langId}`;
                    form.setFieldValue(fieldKey, value);
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
                                    {page.title || page.keyword}
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
                                        <Tabs value={activeLanguageTab} onChange={(value) => setActiveLanguageTab(value || languages[0]?.id.toString() || '')}>
                                            <Tabs.List mb="md">
                                                {languages.map(lang => {
                                                    const langId = lang.id.toString();
                                                    return (
                                                        <Tabs.Tab key={langId} value={langId} fw={500}>
                                                            {lang.language}
                                                        </Tabs.Tab>
                                                    );
                                                })}
                                            </Tabs.List>

                                            {languages.map(lang => {
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
                                                    {renderContentField(field, languages[0]?.id || 1)}
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