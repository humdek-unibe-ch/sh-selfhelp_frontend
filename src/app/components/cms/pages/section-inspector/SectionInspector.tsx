/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
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
    List,
    Loader,
} from '@mantine/core';
import {
    IconDeviceFloppy,
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSectionDetails } from '../../../../../hooks/useSectionDetails';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import { useUpdateSectionMutation, useDeleteSectionMutation } from '../../../../../hooks/mutations';
import { useSectionPages } from '../../../../../hooks/useSectionUtility';
import { exportSection } from '../../../../../api/admin/section.api';
import { downloadJsonFile, generateExportFilename } from '../../../../../utils/export-import.utils';
import { validateName, getNameValidationError } from '../../../../../utils/name-validation.utils';
import { notifications } from '@mantine/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { InspectorLayout } from '../../shared/inspector-layout/InspectorLayout';
import { InspectorHeader } from '../../shared/inspector-header/InspectorHeader';
import { useRenderMonitor, useWhyDidYouUpdate, useMountMonitor, useRenderLogger } from '../../../../../utils/performance-monitor.utils';
import { useSectionFormStore } from '../../../../store/sectionFormStore';
import { SectionInfoPanel } from './section-field-groups';
import { SectionFieldPanels } from './SectionFieldPanels';

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
    const { languages: languagesData, isLoading: languagesLoading } = usePublicLanguages();

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
                queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] });
                queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
            }
        }
    });

    const isRefContainer = sectionDetailsData?.section?.style?.name === 'refContainer';

    const {
        data: sectionPages,
        isLoading: isSectionPagesLoading,
    } = useSectionPages(sectionId ? [sectionId] : [], deleteModalOpened && isRefContainer);

    // Delete mutation
    const deleteSectionMutation = useDeleteSectionMutation({
        showNotifications: true,
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
            deleteSectionMutation.mutate({ sectionId });
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

                {/* Searchable field panels */}
                <SectionFieldPanels
                    key={sectionId}
                    sectionId={sectionId}
                    fields={fields}
                    languagesData={languagesData}
                    activeLanguageTab={activeLanguageTab}
                    onLanguageTabChange={setActiveLanguageTab}
                    dataVariables={dataVariables}
                    hasMultipleLanguages={hasMultipleLanguages}
                />
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
                    {!isRefContainer && (
                        <Alert color="red" title="Warning">
                            This action cannot be undone. The section and all its content will be permanently deleted.
                        </Alert>
                    )}

                    {isRefContainer && (
                        <>
                            {isSectionPagesLoading ? (
                                <Group justify="center" p="sm">
                                    <Loader size="sm" />
                                    <Text size="sm">Checking page usage...</Text>
                                </Group>
                            ) : sectionPages && sectionPages.length > 0 ? (
                                <>
                                    {(() => {
                                        const otherPages = sectionPages.filter((p) => p.id !== pageId);
                                        const publishedOtherPages = otherPages.filter((p) => p.isPublished);
                                        return (
                                            <>
                                                <Alert color="red" title="Reference Container">
                                                    <Stack gap="xs">
                                                        {otherPages.length > 0 ? (
                                                            <>
                                                                <Text size="sm">
                                                                    Besides this page, this reference container is also used on the following page{otherPages.length > 1 ? 's' : ''}. Deleting it will remove it from all of them immediately and cannot be undone.
                                                                </Text>
                                                                <List size="sm" withPadding>
                                                                    {otherPages.map((page) => (
                                                                        <List.Item key={page.id}>
                                                                            <Text
                                                                                size="sm"
                                                                                fw={500}
                                                                                component="a"
                                                                                href={`/admin/pages/${page.keyword}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                                                            >
                                                                                {page.keyword}
                                                                            </Text>
                                                                        </List.Item>
                                                                    ))}
                                                                </List>
                                                            </>
                                                        ) : (
                                                            <Text size="sm">
                                                                This reference container is only used on this page. Deleting it will remove it permanently and cannot be undone.
                                                            </Text>
                                                        )}
                                                    </Stack>
                                                </Alert>
                                                {publishedOtherPages.length > 0 && (
                                                    <Alert color="yellow" title="Published pages affected">
                                                        <Stack gap="xs">
                                                            <Text size="sm">The following published pages will need to be republished for the change to be visible to end users:</Text>
                                                            <List size="sm" withPadding>
                                                                {publishedOtherPages.map((page) => (
                                                                    <List.Item key={page.id}>
                                                                        <Text
                                                                            size="sm"
                                                                            fw={500}
                                                                            component="a"
                                                                            href={`/admin/pages/${page.keyword}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            style={{ textDecoration: 'underline', cursor: 'pointer' }}
                                                                        >
                                                                            {page.keyword}
                                                                        </Text>
                                                                    </List.Item>
                                                                ))}
                                                            </List>
                                                        </Stack>
                                                    </Alert>
                                                )}
                                            </>
                                        );
                                    })()}
                                </>
                            ) : (
                                <Alert color="red" title="Warning">
                                    This action cannot be undone. The section and all its content will be permanently deleted.
                                </Alert>
                            )}
                        </>
                    )}

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
