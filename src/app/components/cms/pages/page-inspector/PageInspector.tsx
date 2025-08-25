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
    IconChevronUp,
    IconFileExport
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
import { LockedField } from '../../ui/locked-field/LockedField';
import { DragDropMenuPositioner } from '../../ui/drag-drop-menu-positioner/DragDropMenuPositioner';
import { FieldLabelWithTooltip } from '../../ui/field-label-with-tooltip/FieldLabelWithTooltip';
import { IPageField } from '../../../../../types/responses/admin/page-details.types';
import {IUpdatePageRequest } from '../../../../../types/requests/admin/update-page.types';
import { FieldRenderer, IFieldData, InspectorHeader } from '../../shared';
import { IInspectorButton } from '../../shared/inspector-header/InspectorHeader';
import { PAGE_ACCESS_TYPES } from '../../../../../constants/lookups.constants';
import styles from './PageInspector.module.css';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { CreatePageModal } from '../create-page/CreatePage';
import { exportPageSections } from '../../../../../api/admin/section.api';
import { downloadJsonFile, generateExportFilename } from '../../../../../utils/export-import.utils';
import { useQueryClient } from '@tanstack/react-query';
import { useInspectorStore, INSPECTOR_TYPES, INSPECTOR_SECTIONS } from '../../../../../store/inspectorStore';
import { 
    processAllFields, 
    isContentField, 
    isPropertyField, 
    validateFieldProcessing,
    initializeFieldFormValues
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
    headless: boolean;
    navPosition: number | null;
    footerPosition: number | null;
    openAccess: boolean;
    pageAccessType: string;
    headerMenuEnabled: boolean;
    footerMenuEnabled: boolean;
    
    // Field values by language (dynamic based on API response)
    fields: Record<string, Record<number, string>>; // fields[fieldName][languageId] = content
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
    
    // Find parent page for context-aware menu positioning
    const parentPage = useMemo(() => {
        if (!page?.parent || !adminPages.length) return null;
        return adminPages.find(p => p.id_pages === page.parent) || null;
    }, [page?.parent, adminPages]);

    // Set default active language tab when languages are loaded
    useEffect(() => {
        if (languages.length > 0 && !activeLanguageTab) {
            const firstLangId = languages[0].id.toString();
            setActiveLanguageTab(firstLangId);
        }
    }, [languages, activeLanguageTab]);
    
    // Update persistent state when collapse states change
    useEffect(() => {
        setCollapsed(INSPECTOR_TYPES.PAGE, INSPECTOR_SECTIONS.CONTENT, !contentExpanded);
    }, [contentExpanded, setCollapsed]);
    
    useEffect(() => {
        setCollapsed(INSPECTOR_TYPES.PAGE, INSPECTOR_SECTIONS.PROPERTIES, !propertiesExpanded);
    }, [propertiesExpanded, setCollapsed]);

    // Update page mutation
    const updatePageMutation = useUpdatePageMutation({
        onSuccess: (updatedPage, pageId) => {
            
            // Invalidate relevant queries to refresh data - using consistent query keys
            queryClient.invalidateQueries({ queryKey: ['adminPages'] }); // Admin pages list
            queryClient.invalidateQueries({ queryKey: ['pageFields', pageId] }); // Page fields
            queryClient.invalidateQueries({ queryKey: ['pageSections', pageId] }); // Page sections
            queryClient.invalidateQueries({ queryKey: ['pages'] }); // Frontend pages
            queryClient.invalidateQueries({ queryKey: ['page-content'] }); // Frontend page content
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] }); // Frontend pages with language
            
            // Also invalidate any admin-specific queries that might exist
            queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'page', pageId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'page-fields', pageId] });
        },
        onError: (error, pageId) => {
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

    // Update form when page or pageFieldsData changes
    useEffect(() => {
        if (page && pageFieldsData && languages.length > 0) {

            // Use the modular field initialization utility that handles content vs property fields correctly
            const fieldsObject = initializeFieldFormValues(pageFieldsData.fields, languages);

            const pageDetails = pageFieldsData.page;
            
            form.setValues({
                keyword: page.keyword,
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
        } else if (!page) {
            
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
        // Validate field processing rules
        const validationWarnings: string[] = [];
        fields.forEach(field => {
            const validation = validateFieldProcessing(field);
            validationWarnings.push(...validation.warnings);
        });
        
        // Use the modular field processing utility
        const processedFields = processAllFields({
            fields: fields,
            formValues: form.values.fields || {},
            languages: languages
        });

        const updateData: IUpdatePageRequest = {
            pageData: {
                url: form.values.url,
                headless: form.values.headless,
                navPosition: form.values.navPosition,
                footerPosition: form.values.footerPosition,
                openAccess: form.values.openAccess,
                pageAccessTypeCode: form.values.pageAccessType,
            },
            fields: processedFields.fieldEntries
        };

        updatePageMutation.mutate({
            pageId: page?.id_pages || 0,
            updateData
        });
    };

    const handleCreateChildPage = () => {
        setCreateChildModalOpened(true);
    };

    const handleCloseChildModal = () => {
        setCreateChildModalOpened(false);
    };

    const handleDeletePage = () => {
        if (deleteConfirmText === page?.keyword && page?.keyword) {
            deletePageMutation.mutate(page.id_pages);
        }
    };

    const handleExportPageSections = async () => {
        if (!page) return;
        
        try {
            const response = await exportPageSections(page.id_pages);
            const filename = generateExportFilename(`page_${page.keyword}`);
            downloadJsonFile(response.data.sectionsData, filename);
        } catch (error) {

            // Error notification is handled by the download function
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
        form.setFieldValue('navPosition', position);
    }, []); // Empty dependency array since form.setFieldValue is stable

    const handleFooterPositionChange = useCallback((position: number | null) => {
        form.setFieldValue('footerPosition', position);
    }, []); // Empty dependency array since form.setFieldValue is stable

    // Generate inspector buttons (consolidated logic)
    const generateInspectorButtons = useCallback((): IInspectorButton[] => {
        if (!page) return [];
        
        const buttons: IInspectorButton[] = [
            {
                id: 'save',
                label: 'Save',
                icon: <IconDeviceFloppy size="0.875rem" />,
                onClick: handleSave,
                variant: 'filled',
                loading: updatePageMutation.isPending,
                disabled: !page.keyword
            }
        ];

        // Add additional buttons only for non-configuration pages
        if (!isConfigurationPage) {
            buttons.push(
                {
                    id: 'export',
                    label: 'Export',
                    icon: <IconFileExport size="1rem" />,
                    onClick: handleExportPageSections,
                    variant: 'outline',
                    color: 'blue'
                }
            );

            // Only show Create Child Page for non-system pages
            if (page.is_system !== 1) {
                buttons.push({
                    id: 'create-child',
                    label: 'Create Child Page',
                    icon: <IconPlus size="1rem" />,
                    onClick: () => setCreateChildModalOpened(true),
                    variant: 'outline',
                    color: 'green'
                });
            }

            buttons.push({
                id: 'delete',
                label: 'Delete',
                icon: <IconTrash size="1rem" />,
                onClick: () => setDeleteModalOpened(true),
                variant: 'outline',
                color: 'red',
                disabled: page.is_system === 1
            });
        }

        return buttons;
    }, [page, isConfigurationPage, updatePageMutation.isPending, handleSave, handleExportPageSections]);

    // Expose inspector buttons to parent
    useEffect(() => {
        if (onButtonsChange) {
            onButtonsChange(generateInspectorButtons());
        }
    }, [onButtonsChange, generateInspectorButtons]);

    // Get fields data for processing (before early returns)
    const fields = pageFieldsData?.fields || [];
    const contentFields = fields.filter(field => isContentField(field));
    const propertyFields = fields.filter(field => isPropertyField(field));

    // Check if we have multiple languages for content fields
    const hasMultipleLanguages = useMemo(() => {
        return languages.length > 1;
    }, [languages]);

    // Helper function to get field label (use title when available, fallback to name)
    const getFieldLabel = (field: IPageField) => {
        return field.title && field.title.trim() ? field.title : field.name;
    };

    // Convert IPageField to IFieldData (consolidated conversion logic)
    const convertToFieldData = useCallback((field: IPageField, isReadOnly: boolean = false): IFieldData => {
        return {
            id: field.id,
            name: field.name,
            title: field.title,
            type: field.type,
            default_value: field.default_value,
            help: field.help,
            disabled: isReadOnly,
            display: field.display,
            fieldConfig: field.fieldConfig
        };
    }, []);

    // Consolidated field renderer (handles both content and property fields)
    const renderField = useCallback((field: IPageField, languageId: number, isContentField: boolean = true) => {
        const currentLanguage = languages.find(lang => lang.id === languageId);
        const locale = currentLanguage?.locale;
        const fieldValue = form.values.fields?.[field.name]?.[languageId] ?? '';
        
        // Check if this is the title field and we're in a configuration page
        const isReadOnly = isConfigurationPage && field.name.toLowerCase() === 'title';
        
        const fieldData = convertToFieldData(field, isReadOnly);
        
        return (
            <FieldRenderer
                key={`${field.id}-${languageId}`}
                field={fieldData}
                value={fieldValue}
                onChange={(value) => {
                    const fieldKey = `fields.${field.name}.${languageId}`;
                    form.setFieldValue(fieldKey, value);
                }}
                locale={isContentField ? locale : undefined}
                className={isContentField ? styles.fullWidthLabel : undefined}
                disabled={isReadOnly}
            />
        );
    }, [languages, form.values.fields, isConfigurationPage, convertToFieldData]);

    // Render content field based on type and language
    const renderContentField = useCallback((field: IPageField, languageId: number) => {
        return renderField(field, languageId, true);
    }, [renderField]);

    // Render property field (single-language, uses first language ID)
    const renderPropertyField = useCallback((field: IPageField) => {
        const langId = languages[0]?.id || 1;
        return renderField(field, langId, false);
    }, [renderField, languages]);

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
    
    // Get inspector buttons using consolidated logic
    const inspectorButtons = generateInspectorButtons();

    return (
        <div className={styles.asideContainer}>
            {/* Inspector Header */}
            <InspectorHeader 
                inspectorType="page"
                inspectorTitle={page.title || page.keyword}
                inspectorId={pageDetails?.id || page.id_pages}
                inspectorButtons={inspectorButtons}
            />
            
            {/* Scrollable Content - Now full height */}
            <ScrollArea className={styles.asideContent}>
                <Stack gap="xs">
                    {/* Page Information Section */}
                    <div className={styles.asideSection}>
                        <Paper withBorder={false} style={{ backgroundColor: 'light-dark(var(--mantine-color-blue-0), var(--mantine-color-blue-9))' }}>
                            <Box p="sm">
                            <Group gap="xs" mb="sm">
                                <IconInfoCircle size={16} style={{ color: 'var(--mantine-color-blue-6)' }} />
                                <Text size="sm" fw={500} c="blue">Page Information</Text>
                            </Group>
                            
                            <Stack gap="xs">
                                <Group gap="md" wrap="wrap">
                                    <Box>
                                        <Text size="xs" fw={500} c="dimmed">Keyword</Text>
                                        <Text size="sm" style={{ fontFamily: 'monospace', color: 'var(--mantine-color-text)' }}>{page.keyword}</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" fw={500} c="dimmed">URL</Text>
                                        <Text size="sm" style={{ fontFamily: 'monospace', color: 'var(--mantine-color-text)' }}>{page.url}</Text>
                                    </Box>
                                    <Box>
                                        <Text size="xs" fw={500} c="dimmed">Page ID</Text>
                                        <Text size="sm" style={{ color: 'var(--mantine-color-text)' }}>{pageDetails?.id || page.id_pages}</Text>
                                    </Box>
                                </Group>
                                
                                <Group gap="xs" mt="xs">
                                    {isConfigurationPage && (
                                        <Badge color="purple" variant="light" size="sm">
                                            Configuration Page
                                        </Badge>
                                    )}
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
                    </div>

                    {/* Content Section */}
                    <div className={styles.asideSection}>
                        <Group 
                            p="sm" 
                            justify="space-between" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setContentExpanded(!contentExpanded)}
                        >
                            <Title order={5}>Content</Title>
                            <ActionIcon variant="subtle" size="sm">
                                {contentExpanded ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
                            </ActionIcon>
                        </Group>
                        
                        <Collapse in={contentExpanded}>
                            <Divider />
                            <Box p="sm">
                                {contentFields.length > 0 ? (
                                    hasMultipleLanguages ? (
                                        <Tabs value={activeLanguageTab} onChange={(value) => setActiveLanguageTab(value || (languages[0]?.id.toString() || ''))}>
                                            <Tabs.List>
                                                {languages.map(lang => {
                                                    const langId = lang.id.toString();
                                                    return (
                                                        <Tabs.Tab key={langId} value={langId}>
                                                            {lang.language}
                                                        </Tabs.Tab>
                                                    );
                                                })}
                                            </Tabs.List>

                                            {languages.map(lang => {
                                                const langId = lang.id.toString();
                                                return (
                                                    <Tabs.Panel key={langId} value={langId} pt="md">
                                                        <Stack gap="md">
                                                            {contentFields.map(field => 
                                                                renderContentField(field, lang.id)
                                                            )}
                                                        </Stack>
                                                    </Tabs.Panel>
                                                );
                                            })}
                                        </Tabs>
                                    ) : (
                                        <Stack gap="md">
                                            {contentFields.map(field => 
                                                renderContentField(field, languages[0]?.id || 1) // Default to first language
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
                    </div>

                    {/* Properties Section */}
                    {!isConfigurationPage && (
                    <div className={styles.asideSection}>
                        <Group 
                            p="sm" 
                            justify="space-between" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => setPropertiesExpanded(!propertiesExpanded)}
                        >
                            <Title order={5}>Properties</Title>
                            <ActionIcon variant="subtle" size="sm">
                                {propertiesExpanded ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />}
                            </ActionIcon>
                        </Group>
                        
                        <Collapse in={propertiesExpanded}>
                            <Divider />
                            <Box p="sm">
                                <Stack gap="xs" className={styles.compactStack}>
                                    {/* Page Basic Properties */}
                                    <Paper p="sm" withBorder>
                                        <Stack gap="sm">
                                            <Text size="xs" fw={500} c="blue">Basic Information</Text>
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
                                                
                                                {propertyFields.map(field => (
                                                    <Box key={field.id}>{renderPropertyField(field)}</Box>
                                                ))}
                                            </Stack>
                                        </Paper>
                                    )}
                                </Stack>
                            </Box>
                        </Collapse>
                    </div>
                    )}

                    {/* Property Fields for Configuration Pages */}
                    {isConfigurationPage && propertyFields.length > 0 && (
                        <div className={styles.asideSection}>
                            <Box p="sm">
                                <Stack gap="sm">
                                    <Group gap="xs">
                                        <Text size="xs" fw={500} c="blue">Configuration Properties</Text>
                                        <Tooltip 
                                            label="Configuration fields specific to this page type."
                                            multiline
                                            w={300}
                                        >
                                            <ActionIcon variant="subtle" size="xs" color="gray">
                                                <IconInfoCircle size="0.75rem" />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                    
                                    {propertyFields.map(field => (
                                        <Box key={field.id}>{renderPropertyField(field)}</Box>
                                    ))}
                                </Stack>
                            </Box>
                        </div>
                    )}


                </Stack>
            </ScrollArea>

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
        </div>
    );
} 