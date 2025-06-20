'use client';

import { 
    Paper, 
    Title, 
    Text, 
    Group, 
    Badge, 
    Stack,
    Divider,
    Box,
    Alert,
    ScrollArea,
    Button,
    TextInput,
    Textarea,
    Checkbox,
    ActionIcon,
    Tooltip,
    Modal,
    Collapse,
    Tabs,
    Radio
} from '@mantine/core';
import { 
    IconInfoCircle, 
    IconFile, 
    IconDeviceFloppy, 
    IconPlus, 
    IconTrash,
    IconChevronDown,
    IconChevronUp
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useHotkeys } from '@mantine/hooks';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { usePageFields } from '../../../../../hooks/usePageDetails';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useDeletePageMutation } from '../../../../../hooks/mutations/useDeletePageMutation';
import { useUpdatePageMutation } from '../../../../../hooks/mutations/useUpdatePageMutation';
import { useLanguages } from '../../../../../hooks/useLanguages';
import { LockedField } from '../../../ui/locked-field/LockedField';
import { DragDropMenuPositioner } from '../../../ui/drag-drop-menu-positioner/DragDropMenuPositioner';
import { FieldLabelWithTooltip } from '../../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { IPageField } from '../../../../../types/responses/admin/page-details.types';
import { IUpdatePageField, IUpdatePageData, IUpdatePageRequest } from '../../../../../types/requests/admin/update-page.types';
import { PAGE_ACCESS_TYPES } from '../../../../../constants/lookups.constants';
import { debug } from '../../../../../utils/debug-logger';
import styles from './PageInspector.module.css';
import { useAdminPages } from '../../../../../hooks/useAdminPages';

interface PageInspectorProps {
    page: IAdminPage | null;
}

interface IPageFormValues {
    // Page properties
    keyword: string;
    url: string;
    headless: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    openAccess: boolean;
    pageAccessType: string;
    headerMenuEnabled: boolean;
    footerMenuEnabled: boolean;
    
    // Field values by language (dynamic based on API response)
    fields: Record<string, Record<string, string>>; // fields[fieldName][languageCode] = content
}

export function PageInspector({ page }: PageInspectorProps) {
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [contentExpanded, setContentExpanded] = useState(true);
    const [propertiesExpanded, setPropertiesExpanded] = useState(true);
    const [activeLanguageTab, setActiveLanguageTab] = useState<string>('');
    
    // References to get final positions from DragDropMenuPositioner components
    const headerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);
    const footerMenuGetFinalPosition = useRef<(() => number | null) | null>(null);
    
    // Fetch page fields when page is selected
    const { 
        data: pageFieldsData, 
        isLoading: fieldsLoading, 
        error: fieldsError 
    } = usePageFields(page?.keyword || null, !!page);

    // Fetch page access types
    const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);

    // Fetch available languages
    const { languages, isLoading: languagesLoading } = useLanguages();

    // Fetch admin pages for parent context
    const { pages: adminPages } = useAdminPages();
    
    // Find parent page for context-aware menu positioning
    const parentPage = useMemo(() => {
        if (!page?.parent || !adminPages.length) return null;
        return adminPages.find(p => p.id_pages === page.parent) || null;
    }, [page?.parent, adminPages]);

    // Set default active language tab when languages are loaded
    useEffect(() => {
        if (languages.length > 0 && !activeLanguageTab) {
            setActiveLanguageTab(languages[0].code);
        }
    }, [languages, activeLanguageTab]);

    // Update page mutation
    const updatePageMutation = useUpdatePageMutation({
        onSuccess: (updatedPage, keyword) => {
            debug('Page updated successfully in PageInspector', 'PageInspector', { 
                keyword, 
                updatedPage: updatedPage.keyword 
            });
            // Additional success handling can be added here if needed
        },
        onError: (error, keyword) => {
            debug('Update page error in PageInspector', 'PageInspector', { error, keyword });
            // Error is already handled by the mutation hook with notifications
        }
    });

    // Delete page mutation
    const deletePageMutation = useDeletePageMutation({
        onSuccess: () => {
            setDeleteModalOpened(false);
            setDeleteConfirmText('');
            // Additional success handling can be added here if needed
        },
        onError: (error) => {
            debug('Delete page error in PageInspector', 'PageInspector', { error });
            // Error is already handled by the mutation hook with notifications
        }
    });

    // Form for page editing
    const form = useForm<IPageFormValues>({
        initialValues: {
            keyword: '',
            url: '',
            headless: false,
            navPosition: null,
            footerPosition: null,
            openAccess: false,
            pageAccessType: '',
            headerMenuEnabled: false,
            footerMenuEnabled: false,
            fields: {}
        }
    });

    // Update form when page data changes
    useEffect(() => {
        if (page && pageFieldsData && languages.length > 0) {
            const pageDetails = pageFieldsData.page;
            const fields = pageFieldsData.fields;
            
            // Create fields object organized by field name and language
            const fieldsObject: Record<string, Record<string, string>> = {};
            fields.forEach(field => {
                fieldsObject[field.name] = {};
                // Initialize all languages with empty strings first
                languages.forEach(lang => {
                    fieldsObject[field.name][lang.code] = '';
                });
                // Then populate with actual data
                field.translations.forEach(translation => {
                    // Find matching language by locale
                    const matchingLang = languages.find(lang => lang.locale === translation.language_code);
                    if (matchingLang) {
                        fieldsObject[field.name][matchingLang.code] = translation.content || field.default_value || '';
                    } else {
                        // Fallback: try to match by language code
                        const langCode = translation.language_code.split('-')[0];
                        const fallbackLang = languages.find(lang => lang.code === langCode);
                        if (fallbackLang) {
                            fieldsObject[field.name][fallbackLang.code] = translation.content || field.default_value || '';
                        }
                    }
                });
            });

            form.setValues({
                keyword: pageDetails.keyword || '',
                url: pageDetails.url || '',
                headless: pageDetails.headless || false,
                navPosition: pageDetails.navPosition,
                footerPosition: pageDetails.footerPosition,
                openAccess: pageDetails.openAccess || false,
                pageAccessType: pageDetails.pageAccessType?.lookupCode || '',
                headerMenuEnabled: pageDetails.navPosition !== null,
                footerMenuEnabled: pageDetails.footerPosition !== null,
                fields: fieldsObject
            });
        } else {
            // Reset form when no page is selected
            form.setValues({
                keyword: '',
                url: '',
                headless: false,
                navPosition: null,
                footerPosition: null,
                openAccess: false,
                pageAccessType: '',
                headerMenuEnabled: false,
                footerMenuEnabled: false,
                fields: {}
            });
        }
    }, [page, pageFieldsData, languages]);

    // Save hotkey (Ctrl+S)
    useHotkeys([
        ['ctrl+S', (e) => {
            e.preventDefault();
            handleSave();
        }]
    ]);

    const handleSave = () => {
        // Get final calculated positions from DragDropMenuPositioner components
        const finalHeaderPosition = headerMenuGetFinalPosition.current ? headerMenuGetFinalPosition.current() : null;
        const finalFooterPosition = footerMenuGetFinalPosition.current ? footerMenuGetFinalPosition.current() : null;
        
        // Prepare data structure for backend with field IDs and language IDs
        const pageData: IUpdatePageData = {
            url: form.values.url,
            headless: form.values.headless,
            navPosition: form.values.headerMenuEnabled ? finalHeaderPosition : null,
            footerPosition: form.values.footerMenuEnabled ? finalFooterPosition : null,
            openAccess: form.values.openAccess,
            pageAccessTypeCode: form.values.pageAccessType,
        };

        // Prepare field translations with field IDs and language IDs
        const fields: IUpdatePageField[] = [];

        // Process content fields (display: true) - these are translated
        contentFields.forEach(field => {
            languages.forEach(language => {
                const content = form.values.fields?.[field.name]?.[language.code] || '';
                // Always send all fields, including empty ones (for deletion)
                fields.push({
                    fieldId: field.id,
                    languageId: language.id,
                    content: content, // Send empty string if content is empty
                });
            });
        });

        // Process property fields (display: false) - these use hardcoded language ID 1
        propertyFields.forEach(field => {
            const firstLanguageCode = languages[0]?.code || 'de';
            const content = form.values.fields?.[field.name]?.[firstLanguageCode] || '';
            // Always send all fields, including empty ones (for deletion)
            fields.push({
                fieldId: field.id,
                languageId: 1, // Hardcoded for property fields
                content: content, // Send empty string if content is empty
            });
        });

        const backendPayload: IUpdatePageRequest = {
            pageData,
            fields: fields
        };

        debug('Saving page data - Backend payload structure', 'PageInspector', {
            originalFormValues: form.values,
            backendPayload,
            finalPositions: {
                originalHeaderPosition: form.values.navPosition,
                originalFooterPosition: form.values.footerPosition,
                finalHeaderPosition,
                finalFooterPosition,
                headerMenuEnabled: form.values.headerMenuEnabled,
                footerMenuEnabled: form.values.footerMenuEnabled,
            },
            summary: {
                pageProperties: Object.keys(pageData).length,
                totalFieldTranslations: fields.length,
                contentFieldTranslations: fields.filter(ft => ft.languageId !== 1).length,
                propertyFieldTranslations: fields.filter(ft => ft.languageId === 1).length,
                emptyFieldTranslations: fields.filter(ft => !(ft.content || '').trim()).length,
                availableLanguages: languages.map(l => ({ id: l.id, code: l.code, locale: l.locale })),
                contentFields: contentFields.map(f => ({ id: f.id, name: f.name, display: f.display })),
                propertyFields: propertyFields.map(f => ({ id: f.id, name: f.name, display: f.display }))
            }
        });

        // Submit the update to the backend
        if (page?.keyword) {
            updatePageMutation.mutate({
                keyword: page.keyword,
                updateData: backendPayload
            });
        } else {
            debug('Cannot save page - no page keyword available', 'PageInspector');
        }
    };

    const handleCreateChildPage = () => {
        debug('Creating child page', 'PageInspector', { parentPage: page });
        // TODO: Open create page modal with parent set
        console.log('Create child page for:', page?.keyword);
    };

    const handleDeletePage = () => {
        if (deleteConfirmText === page?.keyword && page?.keyword) {
            debug('Deleting page', 'PageInspector', { page: page.keyword });
            deletePageMutation.mutate(page.keyword);
        }
    };

    const handleHeaderMenuChange = (enabled: boolean) => {
        form.setFieldValue('headerMenuEnabled', enabled);
        if (!enabled) {
            form.setFieldValue('navPosition', null);
        }
    };

    const handleFooterMenuChange = (enabled: boolean) => {
        form.setFieldValue('footerMenuEnabled', enabled);
        if (!enabled) {
            form.setFieldValue('footerPosition', null);
        }
    };

    // Stable callbacks for position changes to prevent infinite loops
    const handleHeaderPositionChange = useCallback((position: number | null) => {
        debug('Header position change requested', 'PageInspector', { 
            newPosition: position, 
            currentPosition: form.values.navPosition 
        });
        form.setFieldValue('navPosition', position);
    }, []); // Empty dependency array since form.setFieldValue is stable

    const handleFooterPositionChange = useCallback((position: number | null) => {
        debug('Footer position change requested', 'PageInspector', { 
            newPosition: position, 
            currentPosition: form.values.footerPosition 
        });
        form.setFieldValue('footerPosition', position);
    }, []); // Empty dependency array since form.setFieldValue is stable

    // Get fields data for processing (before early returns)
    const fields = pageFieldsData?.fields || [];
    const contentFields = fields.filter(field => field.display);
    const propertyFields = fields.filter(field => !field.display);

    // Check if we have multiple languages for content fields
    const hasMultipleLanguages = useMemo(() => {
        return languages.length > 1;
    }, [languages]);

    // Render content field based on type and language
    const renderContentField = (field: IPageField, languageCode: string) => {
        const fieldKey = `fields.${field.name}.${languageCode}`;
        
        // Find the language object to get the locale
        const currentLanguage = languages.find(lang => lang.code === languageCode);
        const locale = hasMultipleLanguages && currentLanguage ? currentLanguage.locale : undefined;
        
        // Ensure the field path exists in form state to prevent controlled/uncontrolled warnings
        const fieldValue = form.values.fields?.[field.name]?.[languageCode] ?? '';
        const inputProps = {
            ...form.getInputProps(fieldKey),
            value: fieldValue // Explicitly set value to ensure it's always defined
        };
        
        if (field.type === 'textarea') {
            return (
                <Textarea
                    key={`${field.id}-${languageCode}`}
                    className={styles.fullWidthLabel}
                    label={<FieldLabelWithTooltip label={field.name} tooltip={field.help} locale={locale} />}
                    placeholder={field.default_value || ''}
                    {...inputProps}
                    autosize
                    minRows={3}
                />
            );
        } else if (field.type === 'markdown-inline') {
            return (
                <TextInput
                    key={`${field.id}-${languageCode}`}
                    className={styles.fullWidthLabel}
                    label={<FieldLabelWithTooltip label={field.name} tooltip={field.help} locale={locale} />}
                    placeholder={field.default_value || ''}
                    {...inputProps}
                />
            );
        } else {
            return (
                <TextInput
                    key={`${field.id}-${languageCode}`}
                    className={styles.fullWidthLabel}
                    label={<FieldLabelWithTooltip label={field.name} tooltip={field.help} locale={locale} />}
                    placeholder={field.default_value || ''}
                    {...inputProps}
                />
            );
        }
    };

    if (!page) {
        return (
            <Paper p="xl" withBorder>
                <Stack align="center" gap="md">
                    <IconFile size="3rem" color="var(--mantine-color-gray-5)" />
                    <Title order={3} c="dimmed">No Page Selected</Title>
                    <Text c="dimmed" ta="center">
                        Select a page from the navigation to view and edit its content.
                    </Text>
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
        <Stack gap={0} h="100%">
            {/* Fixed Save Button */}
            <Paper p="md" withBorder style={{ borderBottom: 'none' }}>
                <Group justify="space-between" align="center">
                    <Group gap="xs">
                        <Title order={2}>{page.keyword}</Title>
                        <Badge color="blue" variant="light">
                            ID: {pageDetails?.id}
                        </Badge>
                    </Group>
                    <Button
                        leftSection={<IconDeviceFloppy size="1rem" />}
                        onClick={handleSave}
                        variant="filled"
                        loading={updatePageMutation.isPending}
                        disabled={!page?.keyword}
                    >
                        Save
                    </Button>
                </Group>
            </Paper>

            {/* Scrollable Content */}
            <ScrollArea flex={1}>
                <Stack gap="lg" p="md">
                    {/* Page Information Section */}
                    <Paper withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
                        <Box p="md">
                            <Group gap="xs" mb="sm">
                                <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                                <Text size="sm" fw={500} c="blue">Page Information</Text>
                            </Group>
                            
                            <Stack gap="xs">
                                <Group gap="md" wrap="wrap">
                                    <Box>
                                        <Text size="xs" fw={500} c="dimmed">Keyword</Text>
                                        <Text size="sm" style={{ fontFamily: 'monospace' }}>{page.keyword}</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" fw={500} c="dimmed">URL</Text>
                                        <Text size="sm" style={{ fontFamily: 'monospace' }}>{page.url}</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" fw={500} c="dimmed">Page ID</Text>
                                        <Text size="sm">{pageDetails?.id || page.id_pages}</Text>
                                    </Box>
                                </Group>
                                
                                <Group gap="xs" mt="xs">
                                    {page.is_headless === 1 && (
                                        <Badge color="orange" variant="light" size="sm">
                                            Headless
                                        </Badge>
                                    )}
                                    {page.nav_position !== null && (
                                        <Badge color="blue" variant="light" size="sm">
                                            Menu Position: {page.nav_position}
                                        </Badge>
                                    )}
                                    {page.parent !== null && (
                                        <Badge color="green" variant="light" size="sm">
                                            Child Page
                                        </Badge>
                                    )}
                                </Group>
                            </Stack>
                        </Box>
                    </Paper>

                    {/* Content Section */}
                    <Paper withBorder>
                        <Group 
                            p="md" 
                            justify="space-between" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setContentExpanded(!contentExpanded)}
                        >
                            <Title order={3}>Content</Title>
                            <ActionIcon variant="subtle">
                                {contentExpanded ? <IconChevronUp /> : <IconChevronDown />}
                            </ActionIcon>
                        </Group>
                        
                        <Collapse in={contentExpanded}>
                            <Divider />
                            <Box p="md">
                                {contentFields.length > 0 ? (
                                    hasMultipleLanguages ? (
                                        <Tabs value={activeLanguageTab} onChange={(value) => setActiveLanguageTab(value || (languages[0]?.code || ''))}>
                                            <Tabs.List>
                                                {languages.map(lang => (
                                                    <Tabs.Tab key={lang.code} value={lang.code}>
                                                        {lang.language}
                                                    </Tabs.Tab>
                                                ))}
                                            </Tabs.List>

                                            {languages.map(lang => (
                                                <Tabs.Panel key={lang.code} value={lang.code} pt="md">
                                                    <Stack gap="md">
                                                        {contentFields.map(field => 
                                                            renderContentField(field, lang.code)
                                                        )}
                                                    </Stack>
                                                </Tabs.Panel>
                                            ))}
                                        </Tabs>
                                    ) : (
                                        <Stack gap="md">
                                            {contentFields.map(field => 
                                                renderContentField(field, languages[0]?.code || 'de') // Default to first language
                                            )}
                                        </Stack>
                                    )
                                ) : (
                                    <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                                        No content fields available for this page.
                                    </Alert>
                                )}
                            </Box>
                        </Collapse>
                    </Paper>

                    {/* Properties Section */}
                    <Paper withBorder>
                        <Group 
                            p="md" 
                            justify="space-between" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                        >
                            <Title order={3}>Properties</Title>
                            <ActionIcon variant="subtle">
                                {propertiesExpanded ? <IconChevronUp /> : <IconChevronDown />}
                            </ActionIcon>
                        </Group>
                        
                        <Collapse in={propertiesExpanded}>
                            <Divider />
                            <Box p="md">
                                <Stack gap="md">
                                    {/* Page Basic Properties */}
                                    <Paper p="md" withBorder>
                                        <Stack gap="md">
                                            <Text size="sm" fw={500} c="blue">Basic Information</Text>
                                            <LockedField
                                                label={
                                                    <FieldLabelWithTooltip 
                                                        label="Keyword" 
                                                        tooltip="Unique identifier for the page. Used in URLs and internal references. Cannot contain spaces or special characters."
                                                    />
                                                }
                                                {...form.getInputProps('keyword')}
                                                lockedTooltip="Enable keyword editing"
                                                unlockedTooltip="Lock keyword editing"
                                            />
                                            
                                            <LockedField
                                                label={
                                                    <FieldLabelWithTooltip 
                                                        label="URL" 
                                                        tooltip="The web address path for this page. Should start with / and be user-friendly."
                                                    />
                                                }
                                                {...form.getInputProps('url')}
                                                lockedTooltip="Enable URL editing"
                                                unlockedTooltip="Lock URL editing"
                                            />
                                        </Stack>
                                    </Paper>

                                    {/* Page Access Type */}
                                    <Paper p="md" withBorder>
                                        <Stack gap="md">
                                            <FieldLabelWithTooltip 
                                                label="Page Access Type" 
                                                tooltip="Controls who can access this page - web only, mobile only, or both platforms"
                                            />
                                            <Radio.Group
                                                value={form.values.pageAccessType}
                                                onChange={(value) => form.setFieldValue('pageAccessType', value)}
                                            >
                                                <Stack gap="xs">
                                                    {pageAccessTypes.map((type) => (
                                                        <Radio
                                                            key={type.lookupCode}
                                                            value={type.lookupCode}
                                                            label={type.lookupValue}
                                                        />
                                                    ))}
                                                </Stack>
                                            </Radio.Group>
                                        </Stack>
                                    </Paper>

                                    {/* Menu Positions */}
                                    <Paper p="md" withBorder>
                                        <Stack gap="md">
                                            <Group gap="xs">
                                                <Text size="sm" fw={500} c="blue">Menu Positions</Text>
                                                <Tooltip 
                                                    label="Configure where this page appears in the website navigation menus. You can drag to reorder positions."
                                                    multiline
                                                    w={300}
                                                >
                                                    <ActionIcon variant="subtle" size="xs" color="gray">
                                                        <IconInfoCircle size="0.75rem" />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                            
                                                                        <DragDropMenuPositioner
                                currentPage={page}
                                menuType="header"
                                title="Header Menu Position"
                                enabled={form.values.headerMenuEnabled}
                                position={form.values.navPosition}
                                onEnabledChange={handleHeaderMenuChange}
                                onPositionChange={handleHeaderPositionChange}
                                onGetFinalPosition={(getFinalPositionFn) => {
                                    headerMenuGetFinalPosition.current = getFinalPositionFn;
                                }}
                                parentPage={parentPage}
                                checkboxLabel="Header Menu"
                                showAlert={false}
                            />

                            <DragDropMenuPositioner
                                currentPage={page}
                                menuType="footer"
                                title="Footer Menu Position"
                                enabled={form.values.footerMenuEnabled}
                                position={form.values.footerPosition}
                                onEnabledChange={handleFooterMenuChange}
                                onPositionChange={handleFooterPositionChange}
                                onGetFinalPosition={(getFinalPositionFn) => {
                                    footerMenuGetFinalPosition.current = getFinalPositionFn;
                                }}
                                parentPage={parentPage}
                                checkboxLabel="Footer Menu"
                                showAlert={false}
                            />
                                        </Stack>
                                    </Paper>

                                    {/* Page Settings */}
                                    <Paper p="md" withBorder>
                                        <Stack gap="md">
                                            <Group gap="xs">
                                                <Text size="sm" fw={500} c="blue">Page Settings</Text>
                                                <Tooltip 
                                                    label="Configure special page behaviors and access controls."
                                                    multiline
                                                    w={300}
                                                >
                                                    <ActionIcon variant="subtle" size="xs" color="gray">
                                                        <IconInfoCircle size="0.75rem" />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                            
                                            <Group>
                                                <Tooltip label="Page will not include header/footer layout - useful for popups, embeds, or standalone pages">
                                                    <Checkbox
                                                        label="Headless Page"
                                                        {...form.getInputProps('headless', { type: 'checkbox' })}
                                                    />
                                                </Tooltip>
                                                <Tooltip label="Page can be accessed without authentication - visible to all users including guests">
                                                    <Checkbox
                                                        label="Open Access"
                                                        {...form.getInputProps('openAccess', { type: 'checkbox' })}
                                                    />
                                                </Tooltip>
                                            </Group>
                                        </Stack>
                                    </Paper>

                                    {/* Property Fields */}
                                    {propertyFields.length > 0 && (
                                        <Paper p="md" withBorder>
                                            <Stack gap="md">
                                                <Group gap="xs">
                                                    <Text size="sm" fw={500} c="blue">Additional Properties</Text>
                                                    <Tooltip 
                                                        label="Additional configuration fields specific to this page type."
                                                        multiline
                                                        w={300}
                                                    >
                                                        <ActionIcon variant="subtle" size="xs" color="gray">
                                                            <IconInfoCircle size="0.75rem" />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                                
                                                {propertyFields.map(field => {
                                                    const langCode = languages[0]?.code || 'de';
                                                    const fieldKey = `fields.${field.name}.${langCode}`;
                                                    const fieldValue = form.values.fields?.[field.name]?.[langCode] ?? '';
                                                    const inputProps = {
                                                        ...form.getInputProps(fieldKey),
                                                        value: fieldValue
                                                    };
                                                    
                                                    return (
                                                        <Box key={field.id}>
                                                            {field.type === 'textarea' ? (
                                                                <Textarea
                                                                    label={<FieldLabelWithTooltip label={field.name} tooltip={field.help} />}
                                                                    placeholder={field.default_value || ''}
                                                                    {...inputProps}
                                                                    autosize
                                                                    minRows={2}
                                                                />
                                                            ) : (
                                                                <TextInput
                                                                    label={<FieldLabelWithTooltip label={field.name} tooltip={field.help} />}
                                                                    placeholder={field.default_value || ''}
                                                                    {...inputProps}
                                                                />
                                                            )}
                                                        </Box>
                                                    );
                                                })}
                                            </Stack>
                                        </Paper>
                                    )}
                                </Stack>
                            </Box>
                        </Collapse>
                    </Paper>

                    {/* Action Buttons */}
                    <Paper p="md" withBorder>
                        <Stack gap="md">
                            <Title order={4}>Actions</Title>
                            <Group>
                                <Button
                                    leftSection={<IconPlus size="1rem" />}
                                    variant="outline"
                                    onClick={handleCreateChildPage}
                                >
                                    Create Child Page
                                </Button>
                                <Button
                                    leftSection={<IconTrash size="1rem" />}
                                    color="red"
                                    variant="outline"
                                    onClick={() => setDeleteModalOpened(true)}
                                >
                                    Delete Page
                                </Button>
                            </Group>
                        </Stack>
                    </Paper>
                </Stack>
            </ScrollArea>

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
                        To confirm deletion, type the page keyword: <Text span fw={700}>{page.keyword}</Text>
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
        </Stack>
    );
} 