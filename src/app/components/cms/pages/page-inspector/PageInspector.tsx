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
    ScrollArea,
    Button,
    TextInput,
    Tooltip,
    Modal,
    Tabs,
} from '@mantine/core';
import {
    IconInfoCircle,
    IconFile,
    IconDeviceFloppy,
    IconPlus,
    IconTrash,
    IconFileExport
} from '@tabler/icons-react';
import { useHotkeys } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { IAdminPage } from '../../../../../types/responses/admin/admin.types';
import { usePageFields } from '../../../../../hooks/usePageDetails';
import { useLookupsByType } from '../../../../../hooks/useLookups';
import { useDeletePageMutation } from '../../../../../hooks/mutations/useDeletePageMutation';
import { useUpdatePageMutation } from '../../../../../hooks/mutations/useUpdatePageMutation';
import { usePublicLanguages } from '../../../../../hooks/useLanguages';
import { IUpdatePageRequest } from '../../../../../types/requests/admin/update-page.types';
import { CollapsibleSection } from '../../shared/collapsible-section/CollapsibleSection';
import { PAGE_ACCESS_TYPES } from '../../../../../constants/lookups.constants';
import { INSPECTOR_TYPES } from '../../../../../store/inspectorStore';
import styles from './PageInspector.module.css';
import { useAdminPages } from '../../../../../hooks/useAdminPages';
import { CreatePageModal } from '../create-page/CreatePage';
import { exportPageSections } from '../../../../../api/admin/section.api';
import { downloadJsonFile, generateExportFilename } from '../../../../../utils/export-import.utils';
import { useQueryClient } from '@tanstack/react-query';
import {
    processAllFields,
    validateFieldProcessing,
    initializeFieldFormValues
} from '../../../../../utils/field-processing.utils';
import { useRenderMonitor, useWhyDidYouUpdate, useMountMonitor, useRenderLogger } from '../../../../../utils/performance-monitor.utils';
import { usePageVersions } from '../../../../../hooks/usePageVersions';
import {
    usePublishVersionMutation,
    usePublishSpecificVersionMutation,
    useUnpublishPageMutation,
    useDeleteVersionMutation,
    useRestoreFromVersionMutation
} from '../../../../../hooks/mutations/usePageVersionMutations';
import {
    PublishingPanel,
    VersionComparisonViewer
} from '../../page-versions';
import { usePageFormStore } from '../../../../store/pageFormStore';
import { PageContentField, PagePropertyField } from './page-field-connectors';
import {
    PageInfoPanel,
    PageBasicInfoFields,
    PageAccessTypeGroup,
    PageMenuPositions,
    PageSettings,
    PageAdditionalProperties
} from './page-field-groups';

export enum MenuType {
    HEADER = 'header',
    FOOTER = 'footer'
}

interface PageInspectorProps {
    page: IAdminPage | null;
    isConfigurationPage?: boolean;
}

export const PageInspector = React.memo(function PageInspector({ page, isConfigurationPage = false }: PageInspectorProps) {
    const router = useRouter();

    const monitoringProps = useMemo(() => ({
        pageId: page?.id_pages,
        isConfigurationPage
    }), [page?.id_pages, isConfigurationPage]);

    useRenderMonitor('PageInspector', monitoringProps, {
        trackState: false,
        trackContext: true,
        trackHooks: false,
        enableStackTrace: true
    });

    useWhyDidYouUpdate('PageInspector', monitoringProps);
    useMountMonitor('PageInspector');
    useRenderLogger('PageInspector', monitoringProps);

    const [deleteModalOpened, setDeleteModalOpened] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [createChildModalOpened, setCreateChildModalOpened] = useState(false);
    const [activeLanguageTab, setActiveLanguageTab] = useState<string>('');
    const [comparisonModalOpened, setComparisonModalOpened] = useState(false);
    const [selectedComparisonVersionId, setSelectedComparisonVersionId] = useState<number | null>(null);

    const setFormValues = usePageFormStore((state) => state.setFormValues);
    const resetStore = usePageFormStore((state) => state.reset);
    const isStoreInitialized = usePageFormStore((state) => state.isInitialized);
    const queryClient = useQueryClient();

    const {
        data: versionsData,
        isLoading: versionsLoading,
        error: versionsError
    } = usePageVersions(page?.id_pages || null);

    const publishVersionMutation = usePublishVersionMutation();
    const publishSpecificVersionMutation = usePublishSpecificVersionMutation();
    const unpublishPageMutation = useUnpublishPageMutation();
    const deleteVersionMutation = useDeleteVersionMutation();
    const restoreVersionMutation = useRestoreFromVersionMutation();

    const {
        data: pageFieldsData,
        isLoading: fieldsLoading,
        error: fieldsError
    } = usePageFields(page?.id_pages || null, !!page);

    const pageAccessTypes = useLookupsByType(PAGE_ACCESS_TYPES);
    const { languages: languagesData, isLoading: languagesLoading } = usePublicLanguages();
    const { pages: adminPages } = useAdminPages();

    const parentPage = useMemo(() => {
        if (!page?.parent || !adminPages.length) return null;
        return adminPages.find(p => p.id_pages === page.parent) || null;
    }, [page?.parent, adminPages]);

    useEffect(() => {
        if (languagesData.length > 0 && !activeLanguageTab) {
            setActiveLanguageTab(languagesData[0].id.toString());
        }
    }, [languagesData.length, activeLanguageTab]);

    const updatePageMutation = useUpdatePageMutation({
        onSuccess: (_updatedPage, pageId) => {
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
            queryClient.invalidateQueries({ queryKey: ['pageFields', pageId] });
            queryClient.invalidateQueries({ queryKey: ['pageSections', pageId] });
            queryClient.invalidateQueries({ queryKey: ['pages'] });
            queryClient.invalidateQueries({ queryKey: ['page-by-keyword'] });
            queryClient.invalidateQueries({ queryKey: ['frontend-pages'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'page', pageId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'page-fields', pageId] });
        },
        onError: () => {}
    });

    const deletePageMutation = useDeletePageMutation({
        onSuccess: () => {
            setDeleteModalOpened(false);
            setDeleteConfirmText('');
            router.push('/admin/pages');
        },
        onError: () => {}
    });

    // Reset store when page changes so fields don't render with stale data
    useEffect(() => {
        resetStore();
    }, [page?.id_pages, resetStore]);

    // Load page data into Zustand store
    useEffect(() => {
        if (page && pageFieldsData && languagesData.length > 0) {
            const fieldsObject = initializeFieldFormValues(pageFieldsData.fields, languagesData);
            const pageDetails = pageFieldsData.page;

            setFormValues({
                keyword: page.keyword,
                url: pageDetails.url || '',
                headless: pageDetails.headless || false,
                navPosition: pageDetails.navPosition,
                footerPosition: pageDetails.footerPosition,
                openAccess: pageDetails.openAccess || false,
                pageAccessType: pageDetails.pageAccessType?.lookupCode || '',
                headerMenuEnabled: pageDetails.navPosition != null,
                footerMenuEnabled: pageDetails.footerPosition !== null,
                fields: fieldsObject
            });
        } else if (!page) {
            resetStore();
        }
    }, [page, pageFieldsData, languagesData, setFormValues, resetStore]);

    const fields = useMemo(() => pageFieldsData?.fields || [], [pageFieldsData?.fields]);
    const contentFields = useMemo(() => fields.filter(field => field.display), [fields]);
    const propertyFields = useMemo(() => fields.filter(field => !field.display), [fields]);
    const hasMultipleLanguages = useMemo(() => languagesData.length > 1, [languagesData.length]);
    const defaultLanguageId = useMemo(() => languagesData[0]?.id || 1, [languagesData]);

    const handleSave = useCallback(() => {
        const storeState = usePageFormStore.getState();

        const validationWarnings: string[] = [];
        fields.forEach(field => {
            const validation = validateFieldProcessing(field);
            validationWarnings.push(...validation.warnings);
        });

        const processedFields = processAllFields({
            fields: fields,
            formValues: storeState.fields || {},
            languages: languagesData
        });

        const updateData: IUpdatePageRequest = {
            pageData: {
                url: storeState.url,
                headless: storeState.headless,
                navPosition: storeState.navPosition,
                footerPosition: storeState.footerPosition,
                openAccess: storeState.openAccess,
                pageAccessTypeCode: storeState.pageAccessType,
            },
            fields: processedFields.fieldEntries
        };

        updatePageMutation.mutate({
            pageId: page?.id_pages || 0,
            updateData
        });
    }, [fields, languagesData, updatePageMutation, page?.id_pages]);

    useHotkeys([
        ['ctrl+S', (e) => {
            e.preventDefault();
            handleSave();
        }]
    ]);

    const handleDeletePage = useCallback(() => {
        if (deleteConfirmText === page?.keyword && page?.keyword) {
            deletePageMutation.mutate(page.id_pages);
        }
    }, [deleteConfirmText, page?.keyword, page?.id_pages, deletePageMutation]);

    const handleExportPageSections = useCallback(async () => {
        if (!page) return;
        try {
            const response = await exportPageSections(page.id_pages);
            const filename = generateExportFilename(`page_${page.keyword}`);
            downloadJsonFile(response.data.sectionsData, filename);
        } catch (_error) {
            // Error notification is handled by the download function
        }
    }, [page]);

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

    if (fieldsLoading || languagesLoading || !isStoreInitialized) {
        return (
            <Paper p="xl">
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
        <Box
          p="md"
          style={(theme) => ({
            backgroundColor: theme.white,
            boxShadow: theme.shadows.lg,
          })}
        >
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
        </Box>

        {/* Scrollable Content */}
        <ScrollArea flex={1}>
          <Stack gap="lg" p="md">
            {/* Page Information Section */}
            <PageInfoPanel
              page={page}
              pageId={pageDetails?.id}
              isConfigurationPage={isConfigurationPage}
            />

            {/* Content Section */}
            <CollapsibleSection
              title="Content"
              inspectorType={INSPECTOR_TYPES.PAGE}
              sectionName="content"
              defaultExpanded={true}
            >
              {contentFields.length > 0 ? (
                hasMultipleLanguages ? (
                  <Tabs
                    value={activeLanguageTab}
                    onChange={(value) =>
                      setActiveLanguageTab(
                        value || languagesData[0]?.id.toString() || "",
                      )
                    }
                  >
                    <Tabs.List>
                      {languagesData.map((lang) => (
                        <Tabs.Tab key={lang.id} value={lang.id.toString()}>
                          {lang.language}
                        </Tabs.Tab>
                      ))}
                    </Tabs.List>

                    {languagesData.map((lang) => (
                      <Tabs.Panel
                        key={lang.id}
                        value={lang.id.toString()}
                        pt="md"
                      >
                        <Stack gap="md">
                          {contentFields.map((field) => (
                            <PageContentField
                              key={`${field.id}-${lang.id}`}
                              field={field}
                              languageId={lang.id}
                              locale={lang.locale}
                              className={styles.fullWidthLabel}
                              disabled={
                                isConfigurationPage &&
                                field.name.toLowerCase() === "title"
                              }
                            />
                          ))}
                        </Stack>
                      </Tabs.Panel>
                    ))}
                  </Tabs>
                ) : (
                  <Stack gap="md">
                    {contentFields.map((field) => (
                      <PageContentField
                        key={`${field.id}-${defaultLanguageId}`}
                        field={field}
                        languageId={defaultLanguageId}
                        locale={languagesData[0]?.locale}
                        className={styles.fullWidthLabel}
                        disabled={
                          isConfigurationPage &&
                          field.name.toLowerCase() === "title"
                        }
                      />
                    ))}
                  </Stack>
                )
              ) : (
                <Alert icon={<IconInfoCircle size="1rem" />} color="blue">
                  No content fields available for this page.
                </Alert>
              )}
            </CollapsibleSection>

            {/* Properties Section */}
            {!isConfigurationPage && (
              <CollapsibleSection
                title="Properties"
                inspectorType={INSPECTOR_TYPES.PAGE}
                sectionName="properties"
                defaultExpanded={true}
              >
                <PageBasicInfoFields />
                <PageAccessTypeGroup options={pageAccessTypes} />
                <PageMenuPositions page={page} parentPage={parentPage} />
                <PageSettings />
                <PageAdditionalProperties
                  fields={propertyFields}
                  defaultLanguageId={defaultLanguageId}
                />
              </CollapsibleSection>
            )}

            {/* Property Fields for Configuration Pages */}
            {isConfigurationPage && propertyFields.length > 0 && (
              <CollapsibleSection
                title="Configuration Properties"
                inspectorType={INSPECTOR_TYPES.PAGE}
                sectionName="configuration-properties"
                defaultExpanded={true}
              >
                {propertyFields.map((field) => (
                  <Box key={field.id}>
                    <PagePropertyField
                      field={field}
                      languageId={defaultLanguageId}
                    />
                  </Box>
                ))}
              </CollapsibleSection>
            )}

            {/* Version Management Section */}
            {page?.id_pages && (
              <CollapsibleSection
                title="Publishing"
                inspectorType={INSPECTOR_TYPES.PAGE}
                sectionName="version-management"
                defaultExpanded={false}
              >
                <PublishingPanel
                  pageId={page.id_pages}
                  versions={versionsData?.versions || []}
                  currentPublishedVersionId={
                    versionsData?.current_published_version_id || null
                  }
                  isLoading={versionsLoading}
                  error={versionsError as Error}
                  onPublishNew={(data) => {
                    publishVersionMutation.mutate({
                      pageId: page.id_pages!,
                      data,
                    });
                  }}
                  onPublishSpecific={(versionId) => {
                    publishSpecificVersionMutation.mutate({
                      pageId: page.id_pages!,
                      versionId,
                    });
                  }}
                  onDelete={(versionId) => {
                    deleteVersionMutation.mutate({
                      pageId: page.id_pages!,
                      versionId,
                    });
                  }}
                  onRestore={(versionId) => {
                    if (page?.id_pages) {
                      restoreVersionMutation.mutate({
                        pageId: page.id_pages,
                        versionId,
                      });
                    }
                  }}
                  isPublishing={publishVersionMutation.isPending}
                  isDeleting={unpublishPageMutation.isPending}
                  isRestoring={restoreVersionMutation.isPending}
                />
              </CollapsibleSection>
            )}

            {/* Action Buttons */}
            {!isConfigurationPage && (
              <Paper p="md" withBorder>
                <Stack gap="md">
                  <Title order={4}>Actions</Title>

                  {Boolean(page?.is_system) && (
                    <Alert
                      icon={<IconInfoCircle size="1rem" />}
                      title="System Page"
                      color="blue"
                      variant="light"
                    >
                      This is a system page that provides core functionality. It
                      can be styled and edited but cannot be deleted.
                    </Alert>
                  )}

                  <Group>
                    <Button
                      leftSection={<IconFileExport size="1rem" />}
                      variant="outline"
                      color="blue"
                      onClick={handleExportPageSections}
                    >
                      Export Sections
                    </Button>

                    {!page?.is_system && (
                      <Button
                        leftSection={<IconPlus size="1rem" />}
                        variant="outline"
                        onClick={() => setCreateChildModalOpened(true)}
                      >
                        Create Child Page
                      </Button>
                    )}

                    <Tooltip
                      label={
                        page?.is_system
                          ? "System pages cannot be deleted"
                          : "Delete this page"
                      }
                      position="top"
                    >
                      <Button
                        leftSection={<IconTrash size="1rem" />}
                        color="red"
                        variant="outline"
                        onClick={() => setDeleteModalOpened(true)}
                        disabled={Boolean(page?.is_system)}
                      >
                        Delete Page
                      </Button>
                    </Tooltip>
                  </Group>
                </Stack>
              </Paper>
            )}
          </Stack>
        </ScrollArea>

        {/* Create Child Page Modal */}
        <CreatePageModal
          opened={createChildModalOpened}
          onClose={() => setCreateChildModalOpened(false)}
          parentPage={page}
        />

        {/* Version Comparison Modal */}
        {page?.id_pages && (
          <VersionComparisonViewer
            opened={comparisonModalOpened}
            onClose={() => {
              setComparisonModalOpened(false);
              setSelectedComparisonVersionId(null);
            }}
            pageId={page.id_pages}
            versions={versionsData?.versions || []}
            initialVersion1Id={selectedComparisonVersionId || undefined}
            initialVersion2Id={
              versionsData?.current_published_version_id || undefined
            }
          />
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          opened={deleteModalOpened}
          onClose={() => {
            setDeleteModalOpened(false);
            setDeleteConfirmText("");
          }}
          title="Delete Page"
          centered
        >
          <Stack gap="md">
            <Alert color="red" title="Warning">
              This action cannot be undone. The page and all its content will be
              permanently deleted.
            </Alert>

            <Text>
              To confirm deletion, type the page keyword:{" "}
              <Text span fw={700}>
                {page.keyword}
              </Text>
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
                  setDeleteConfirmText("");
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
});
