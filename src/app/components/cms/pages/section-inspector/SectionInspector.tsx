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
    Tabs,
} from '@mantine/core';
import {
    IconInfoCircle,
    IconDeviceFloppy,
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSectionDetails } from '../../../../../hooks/useSectionDetails';
import { useAdminLanguages } from '../../../../../hooks/useLanguages';
import { useUpdateSectionMutation, useDeleteSectionMutation } from '../../../../../hooks/mutations';
import { GlobalFieldType } from '../../shared';
import styles from './SectionInspector.module.css';
import { exportSection } from '../../../../../api/admin/section.api';
import { downloadJsonFile, generateExportFilename } from '../../../../../utils/export-import.utils';
import { validateName, getNameValidationError } from '../../../../../utils/name-validation.utils';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { CollapsibleSection } from '../../shared/collapsible-section/CollapsibleSection';
import { InspectorLayout } from '../../shared/inspector-layout/InspectorLayout';
import { InspectorHeader } from '../../shared/inspector-header/InspectorHeader';
import { INSPECTOR_TYPES } from '../../../../../store/inspectorStore';
import { useRenderMonitor, useWhyDidYouUpdate, useMountMonitor, useRenderLogger } from '../../../../../utils/performance-monitor.utils';
import { useSectionFormStore } from '../../../../store/sectionFormStore';
import { SectionContentField } from './section-field-connectors';
import { SectionGlobalFields, SectionProperties, SectionMantineProperties, SectionInfoPanel } from './section-field-groups';

interface ISectionInspectorProps {
    pageId: number | null;
    sectionId: number | null;
}

interface ISectionFormState {
    sectionName: string;
    properties: Record<string, string | boolean>;
    fields: Record<string, Record<number, string>>;
    globalFields: {
        condition: string;
        data_config: string;
        css: string;
        css_mobile: string;
        debug: boolean;
    };
}

export const SectionInspector = React.memo(function SectionInspector({ pageId, sectionId }: ISectionInspectorProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [activeLanguageTab, setActiveLanguageTab] = useState<string>('');

    // Actions don't trigger re-renders, only used for updating
    const setFormValues = useSectionFormStore((state: any) => state.setFormValues);

    // For comparison, keep original values in a ref to avoid re-renders
    const originalValuesRef = React.useRef<ISectionFormState>({
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

    // Performance monitoring
    useRenderMonitor('SectionInspector', { pageId, sectionId }, {
        trackState: false,
        trackContext: true,
        trackHooks: false,
        enableStackTrace: true
    });

    useWhyDidYouUpdate('SectionInspector', { pageId, sectionId });
    useMountMonitor('SectionInspector');
    useRenderLogger('SectionInspector', { pageId, sectionId });

    // Fetch section details
    const {
        data: sectionDetailsData,
        isLoading: sectionLoading,
        error: sectionError,
    } = useSectionDetails(pageId, sectionId, !!pageId && !!sectionId);

    // Fetch languages
    const { languages: languagesData, isLoading: languagesLoading } = useAdminLanguages();

    // Update mutation
    const updateSectionMutation = useUpdateSectionMutation({
        showNotifications: true,
        pageId: pageId || undefined,
        onSuccess: () => {
            setFormValues({ ...useSectionFormStore.getState() }); // Update store to reflect changes
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

    // Delete mutation
    const deleteSectionMutation = useDeleteSectionMutation({
        showNotifications: true,
        pageId: pageId || undefined,
        onSuccess: () => {
            setDeleteModalOpened(false);
            setDeleteConfirmText('');
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

    // Set active language tab
    useEffect(() => {
        if (languagesData.length > 0 && !activeLanguageTab) {
            setActiveLanguageTab(languagesData[0].id.toString());
        }
    }, [languagesData.length, activeLanguageTab]);

    // Load section data into store
    useEffect(() => {
        if (!sectionDetailsData || languagesData.length === 0) return;

        const { section, fields } = sectionDetailsData;
        const globalFields = section.global_fields || {
            condition: null,
            data_config: null,
            css: null,
            css_mobile: null,
            debug: false
        };

        const contentFields = fields.filter(field => field.display);
        const propertyFields = fields.filter(field => !field.display);

        // Build content fields
        const contentFieldsObject: Record<string, Record<number, string>> = {};
        contentFields.forEach(field => {
            contentFieldsObject[field.name] = {};
            languagesData.forEach(lang => {
                contentFieldsObject[field.name][lang.id] = field.default_value || '';
            });

            if (field.translations && field.translations.length > 0) {
                field.translations.forEach(translation => {
                    const language = languagesData.find(l => l.id === translation.language_id);
                    if (language) {
                        contentFieldsObject[field.name][language.id] = translation.content || field.default_value || '';
                    }
                });
            }
        });

        // Build property fields
        const propertyFieldsObject: Record<string, string | boolean> = {};
        propertyFields.forEach(field => {
            let value = field.default_value || '';
            if (field.translations && field.translations.length > 0) {
                const propertyTranslation = field.translations.find(t => t.language_id === 1);
                if (propertyTranslation?.content !== undefined && propertyTranslation?.content !== null) {
                    value = propertyTranslation.content;
                }
            }

            if (field.type === 'checkbox') {
                propertyFieldsObject[field.name] = value === '1' || value === 'true' || value === 'on';
            } else {
                propertyFieldsObject[field.name] = value;
            }
        });

        const newFormValues: ISectionFormState = {
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

        setFormValues(newFormValues);
        originalValuesRef.current = newFormValues; // Update ref
    }, [sectionDetailsData, languagesData, setFormValues]);

    const hasMultipleLanguages = useMemo(() => languagesData.length > 1, [languagesData.length]);

    const dataVariables = useMemo(() =>
        sectionDetailsData?.data_variables || {},
        [sectionDetailsData?.data_variables]
    );

    const contentFields = useMemo(() =>
        sectionDetailsData?.fields?.filter(field => field.display) || [],
        [sectionDetailsData?.fields?.length]
    );

    const propertyFields = useMemo(() =>
        sectionDetailsData?.fields?.filter(field => !field.display) || [],
        [sectionDetailsData?.fields?.length]
    );

    const fields = sectionDetailsData?.fields || [];
    const globalFieldTypes: GlobalFieldType[] = ['condition', 'data_config', 'css', 'css_mobile', 'debug'];

    // Save handler
    const handleSave = useCallback(async () => {
        if (!sectionId || !sectionDetailsData || !languagesData.length || !pageId) return;

        const currentSectionName = useSectionFormStore.getState().sectionName;

        if (currentSectionName !== originalValuesRef.current.sectionName) {
            const validation = validateName(currentSectionName);
            if (!validation.isValid) {
                notifications.show({
                    title: 'Invalid Section Name',
                    message: validation.error || getNameValidationError(),
                    color: 'red'
                });
                return;
            }
        }

        const submitData: any = {
            contentFields: [],
            propertyFields: [],
            globalFields: {}
        };

        if (currentSectionName !== originalValuesRef.current.sectionName) {
            submitData.sectionName = currentSectionName;
        }

        contentFields.forEach(field => {
            const currentFieldValues = useSectionFormStore.getState().fields[field.name] || {};
            languagesData.forEach(language => {
                const currentValue = currentFieldValues[language.id] || '';
                submitData.contentFields.push({
                    fieldId: field.id,
                    languageId: language.id,
                    value: currentValue
                });
            });
        });

        propertyFields.forEach(field => {
            const currentValue = useSectionFormStore.getState().properties[field.name];
            submitData.propertyFields.push({
                fieldId: field.id,
                value: currentValue !== undefined ? currentValue : ''
            });
        });

        const cleanGlobalFields: any = {};
        const storeState = useSectionFormStore.getState();
        Object.keys(storeState.globalFields).forEach(key => {
            const value = storeState.globalFields[key as keyof typeof storeState.globalFields];
            cleanGlobalFields[key] = (value === '' || value === null) ? null : value;
        });
        submitData.globalFields = cleanGlobalFields;

        try {
            await updateSectionMutation.mutateAsync({
                pageId,
                sectionId,
                sectionData: submitData
            });
        } catch (error) {
            // Error handled by mutation
        }
    }, [sectionId, sectionDetailsData, languagesData, pageId, updateSectionMutation]);

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
            // Error handled
        }
    }, [sectionId, sectionDetailsData, pageId]);

    const headerBadges = useMemo(() => {
        if (!sectionDetailsData) return [];
        const { section } = sectionDetailsData;
        return [
            { label: `ID: ${section.id}`, color: 'blue' as const },
            { label: section.style.name, color: 'green' as const },
            ...(section.style.canHaveChildren ? [{ label: 'Can Have Children', color: 'green' as const }] : []),
            { label: `Type ID: ${section.style.typeId}`, color: 'gray' as const }
        ];
    }, [sectionDetailsData?.section?.id, sectionDetailsData?.section?.style]);

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
    }, [sectionDetailsData?.section?.id, sectionId, updateSectionMutation.isPending, deleteSectionMutation.isPending, handleSave, handleExportSection]);

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
                    <Text size="sm" c="dimmed">No section selected</Text>
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
                    <Text size="sm" c="dimmed">Error loading section</Text>
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
                    <Text size="sm" c="dimmed">Section not found</Text>
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
                <SectionInfoPanel section={section} />

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
                                    {languagesData.map(lang => (
                                        <Tabs.Tab key={lang.id} value={lang.id.toString()}>
                                            {lang.language}
                                        </Tabs.Tab>
                                    ))}
                                </Tabs.List>

                                {languagesData.map(lang => (
                                    <Tabs.Panel key={lang.id} value={lang.id.toString()} pt="md">
                                        <Stack gap="md">
                                            {fields.filter(field => field.display).map(field => (
                                                <SectionContentField
                                                    key={`${field.id}-${lang.id}`}
                                                    field={field}
                                                    languageId={lang.id}
                                                    locale={lang.locale}
                                                    className={styles.fullWidthLabel}
                                                    dataVariables={dataVariables}
                                                />
                                            ))}
                                        </Stack>
                                    </Tabs.Panel>
                                ))}
                            </Tabs>
                        ) : (
                            <Stack gap="md">
                                {fields.filter(field => field.display).map(field => (
                                    <SectionContentField
                                        key={`${field.id}-${languagesData[0]?.id}`}
                                        field={field}
                                        languageId={languagesData[0]?.id || 1}
                                        locale={languagesData[0]?.locale}
                                        className={styles.fullWidthLabel}
                                        dataVariables={dataVariables}
                                    />
                                ))}
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
                    <SectionGlobalFields
                        globalFieldTypes={globalFieldTypes}
                        dataVariables={dataVariables}
                    />
                </CollapsibleSection>

                {/* Property Fields */}
                <CollapsibleSection
                    title="Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="properties"
                    defaultExpanded={true}
                >
                    {fields.filter(field => !field.display && !field.name.startsWith('mantine_')).length > 0 ? (
                        <SectionProperties
                            fields={fields}
                            dataVariables={dataVariables}
                        />
                    ) : (
                        <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                            No property fields available for this section.
                        </Alert>
                    )}
                </CollapsibleSection>

                {/* Mantine Properties */}
                <CollapsibleSection
                    title="Mantine Properties"
                    inspectorType={INSPECTOR_TYPES.SECTION}
                    sectionName="mantine-properties"
                    defaultExpanded={false}
                >
                    {fields.filter(field => !field.display && field.name.startsWith('mantine_')).length > 0 ? (
                        <SectionMantineProperties
                            fields={fields}
                            dataVariables={dataVariables}
                        />
                    ) : (
                        <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                            No Mantine property fields available for this section.
                        </Alert>
                    )}
                </CollapsibleSection>
            </InspectorLayout>

            {/* Delete Modal */}
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
});
