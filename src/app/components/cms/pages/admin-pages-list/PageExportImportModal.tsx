/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Page export/import modal (issue #30, Phase 5).
 *
 * Two flows in one dialog:
 *  - Export: pick pages, optionally auto-suggest the related bundle pages
 *    (list/detail + /cms pair), then download a portable JSON bundle.
 *  - Import: upload a bundle, set safe-import options (keyword/route prefix,
 *    skip-conflicts, activate-routes), dry-run validate (errors/warnings +
 *    preview), then confirm the import.
 *
 * @module app/components/cms/pages/admin-pages-list/PageExportImportModal
 */

import { useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    FileInput,
    Group,
    List,
    Loader,
    MultiSelect,
    ScrollArea,
    SimpleGrid,
    Stack,
    Switch,
    Tabs,
    Text,
    TextInput,
    ThemeIcon,
} from '@mantine/core';
import { ModalWrapper } from '../../../shared/common/CustomModal/CustomModal';
import {
    IconAlertTriangle,
    IconCircleCheck,
    IconDownload,
    IconFileImport,
    IconLayoutGrid,
    IconUpload,
    IconWand,
    IconX,
} from '@tabler/icons-react';
import { AdminApi } from '../../../../../api/admin';
import { useImportPagesMutation } from '../../../../../hooks/mutations';
import { useGroups } from '../../../../../hooks/useGroups';
import { type IAdminPage } from '../../../../../types/responses/admin/admin.types';
import {
    type IPageBundle,
    type IPageExampleBundle,
    type IPageImportOptions,
    type IPageImportValidationReport,
} from '../../../../../types/requests/admin/page-export-import.types';
import { parseApiError } from '../../../../../utils/mutation-error-handler';

interface IPageExportImportModalProps {
    opened: boolean;
    onClose: () => void;
    pages: IAdminPage[];
}

type TPageImportOptions = IPageImportOptions;

export function PageExportImportModal({ opened, onClose, pages }: IPageExportImportModalProps) {
    const [activeTab, setActiveTab] = useState<string>('export');

    // ---- Export state ----
    const [selectedExportIds, setSelectedExportIds] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);

    // ---- Examples state ----
    const [examples, setExamples] = useState<IPageExampleBundle[]>([]);
    const [isLoadingExamples, setIsLoadingExamples] = useState(false);
    const [examplesError, setExamplesError] = useState<string | null>(null);
    const [examplesLoaded, setExamplesLoaded] = useState(false);

    // ---- Import state ----
    const [importFile, setImportFile] = useState<File | null>(null);
    const [bundle, setBundle] = useState<IPageBundle | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [keywordPrefix, setKeywordPrefix] = useState('');
    const [routePrefix, setRoutePrefix] = useState('');
    const [skipConflictingRoutes, setSkipConflictingRoutes] = useState(false);
    const [activateRoutes, setActivateRoutes] = useState(true);
    const [accessGroups, setAccessGroups] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [report, setReport] = useState<IPageImportValidationReport | null>(null);
    const [validateError, setValidateError] = useState<string | null>(null);

    const importMutation = useImportPagesMutation({
        onSuccess: () => {
            handleClose();
        },
    });

    const pageOptions = useMemo(
        () =>
            pages.map((page) => ({
                value: String(page.id_pages),
                label: page.url ? `${page.keyword} (${page.url})` : page.keyword,
            })),
        [pages]
    );

    const importOptions: TPageImportOptions = useMemo(
        () => ({
            keywordPrefix: keywordPrefix.trim() || undefined,
            routePrefix: routePrefix.trim() || undefined,
            skipConflictingRoutes,
            activateRoutes,
            accessGroups: accessGroups.length > 0 ? accessGroups.map(Number) : undefined,
        }),
        [keywordPrefix, routePrefix, skipConflictingRoutes, activateRoutes, accessGroups]
    );

    // Groups available as importer-selected "viewer" groups. Admin is always
    // granted full access by the backend; these grant read (public) / full CRUD
    // (cms-app) so imported pages are visible to real users.
    const { data: groupsData } = useGroups({ pageSize: 1000 });
    const groupOptions = useMemo(
        () => (groupsData?.groups ?? []).map((group) => ({
            value: String(group.id),
            label: group.name,
        })),
        [groupsData]
    );

    function resetImportState() {
        setImportFile(null);
        setBundle(null);
        setParseError(null);
        setKeywordPrefix('');
        setRoutePrefix('');
        setSkipConflictingRoutes(false);
        setActivateRoutes(true);
        setAccessGroups([]);
        setReport(null);
        setValidateError(null);
    }

    async function loadExamples() {
        if (examplesLoaded || isLoadingExamples) {
            return;
        }
        setIsLoadingExamples(true);
        setExamplesError(null);
        try {
            const result = await AdminApi.getExampleBundles();
            setExamples(result);
            setExamplesLoaded(true);
        } catch (error) {
            setExamplesError(parseApiError(error).errorMessage);
        } finally {
            setIsLoadingExamples(false);
        }
    }

    function handleTabChange(value: string | null) {
        const next = value ?? 'export';
        setActiveTab(next);
        if (next === 'examples') {
            void loadExamples();
        }
    }

    /**
     * Load a shipped example straight into the import flow: seed the bundle, a
     * safe keyword/route prefix (so the demo never collides with real pages) and
     * jump to the Import tab ready to validate.
     */
    function handleUseExample(example: IPageExampleBundle) {
        resetImportState();
        setBundle(example.bundle);
        // Keyword prefix only — keep keywords unique without a route prefix. A
        // route prefix would rewrite the page routes but NOT the in-bundle
        // navigation links (e.g. a list item linking to "/cms/team-members/{id}"),
        // so the demo's internal links would 404. With no route prefix the
        // bundle's own routes/links stay self-consistent and resolve immediately.
        setKeywordPrefix(`demo_${example.id.replace(/-/g, '_')}_`);
        setRoutePrefix('');
        setActiveTab('import');
    }

    function handleClose() {
        setSelectedExportIds([]);
        setExportError(null);
        resetImportState();
        setActiveTab('export');
        onClose();
    }

    async function handleSuggest() {
        if (selectedExportIds.length === 0) return;
        setIsSuggesting(true);
        setExportError(null);
        try {
            const merged = new Set<string>(selectedExportIds);
            for (const id of selectedExportIds) {
                const related = await AdminApi.suggestExportBundle(Number(id));
                related.forEach((relatedId) => merged.add(String(relatedId)));
            }
            setSelectedExportIds(Array.from(merged));
        } catch (error) {
            setExportError(parseApiError(error).errorMessage);
        } finally {
            setIsSuggesting(false);
        }
    }

    async function handleExport() {
        if (selectedExportIds.length === 0) return;
        setIsExporting(true);
        setExportError(null);
        try {
            const exported = await AdminApi.exportPages(selectedExportIds.map(Number));
            const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            const stamp = new Date().toISOString().slice(0, 10);
            anchor.download = `page-bundle-${exported.pages.length}-pages-${stamp}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);
        } catch (error) {
            setExportError(parseApiError(error).errorMessage);
        } finally {
            setIsExporting(false);
        }
    }

    async function handleFileChange(file: File | null) {
        setImportFile(file);
        setBundle(null);
        setParseError(null);
        setReport(null);
        setValidateError(null);
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as IPageBundle;
            if (!parsed || !Array.isArray(parsed.pages)) {
                setParseError('The selected file is not a valid page bundle (missing "pages" array).');
                return;
            }
            setBundle(parsed);
        } catch {
            setParseError('The selected file is not valid JSON.');
        }
    }

    async function handleValidate() {
        if (!bundle) return;
        setIsValidating(true);
        setValidateError(null);
        setReport(null);
        try {
            const result = await AdminApi.validateImportPages(bundle, importOptions);
            setReport(result);
        } catch (error) {
            setValidateError(parseApiError(error).errorMessage);
        } finally {
            setIsValidating(false);
        }
    }

    function handleImport() {
        if (!bundle) return;
        importMutation.mutate({ bundle, options: importOptions });
    }

    const bundlePageCount = bundle?.pages.length ?? 0;
    const errorCount = report?.issues.filter((issue) => issue.level === 'error').length ?? 0;
    const warningCount = report?.issues.filter((issue) => issue.level === 'warning').length ?? 0;
    const canImport = report?.valid === true && bundle !== null;

    // Footer actions are tab-specific (the Examples tab acts per-card in the body),
    // rendered in the shared ModalWrapper footer so the header/body/footer chrome
    // matches every other CMS modal.
    const footerActions =
        activeTab === 'export' ? (
            <>
                <Button
                    variant="default"
                    leftSection={isSuggesting ? <Loader size="0.9rem" /> : <IconWand size="0.9rem" />}
                    disabled={selectedExportIds.length === 0 || isSuggesting}
                    onClick={handleSuggest}
                >
                    Suggest related
                </Button>
                <Button
                    leftSection={isExporting ? <Loader size="0.9rem" /> : <IconDownload size="0.9rem" />}
                    disabled={selectedExportIds.length === 0 || isExporting}
                    onClick={handleExport}
                >
                    Export &amp; download ({selectedExportIds.length})
                </Button>
            </>
        ) : activeTab === 'import' ? (
            <>
                <Button
                    variant="default"
                    disabled={!bundle || isValidating}
                    leftSection={isValidating ? <Loader size="0.9rem" /> : undefined}
                    onClick={handleValidate}
                >
                    Validate
                </Button>
                <Button
                    color="green"
                    disabled={!canImport || importMutation.isPending}
                    leftSection={
                        importMutation.isPending ? <Loader size="0.9rem" /> : <IconUpload size="0.9rem" />
                    }
                    onClick={handleImport}
                >
                    Import
                </Button>
            </>
        ) : undefined;

    return (
        <ModalWrapper
            opened={opened}
            onClose={handleClose}
            title="Page export / import"
            size="xl"
            onCancel={handleClose}
            cancelLabel="Close"
            customActions={footerActions}
        >
            <Tabs value={activeTab} onChange={handleTabChange}>
                <Tabs.List>
                    <Tabs.Tab value="export" leftSection={<IconDownload size="0.9rem" />}>
                        Export
                    </Tabs.Tab>
                    <Tabs.Tab value="import" leftSection={<IconUpload size="0.9rem" />}>
                        Import
                    </Tabs.Tab>
                    <Tabs.Tab value="examples" leftSection={<IconLayoutGrid size="0.9rem" />}>
                        Example bundles
                    </Tabs.Tab>
                </Tabs.List>

                {/* ---------------- Export ---------------- */}
                <Tabs.Panel value="export" pt="md">
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            Select the pages to export. Use “Suggest related” to automatically add a
                            page’s list/detail counterpart and its <code>/cms</code> admin pair so the
                            whole CMS-in-CMS pattern travels together.
                        </Text>

                        <MultiSelect
                            label="Pages to export"
                            placeholder="Pick one or more pages"
                            data={pageOptions}
                            value={selectedExportIds}
                            onChange={setSelectedExportIds}
                            searchable
                            clearable
                            hidePickedOptions
                            maxDropdownHeight={260}
                        />

                        {exportError && (
                            <Alert color="red" icon={<IconX size="1rem" />} variant="light">
                                {exportError}
                            </Alert>
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* ---------------- Import ---------------- */}
                <Tabs.Panel value="import" pt="md">
                    <Stack gap="md">
                        <FileInput
                            label="Bundle file"
                            description="Upload a page bundle JSON exported from this or another SelfHelp instance."
                            placeholder="Choose a .json bundle"
                            accept="application/json,.json"
                            leftSection={<IconFileImport size="0.9rem" />}
                            value={importFile}
                            onChange={handleFileChange}
                            clearable
                        />

                        {parseError && (
                            <Alert color="red" icon={<IconX size="1rem" />} variant="light">
                                {parseError}
                            </Alert>
                        )}

                        {bundle && (
                            <Alert color="blue" variant="light">
                                <Text size="sm">
                                    Bundle loaded: <strong>{bundlePageCount}</strong> page(s)
                                    {bundle.core_version ? ` · exported from core ${bundle.core_version}` : ''}
                                </Text>
                            </Alert>
                        )}

                        <Divider label="Safe-import options" labelPosition="left" />

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Stack gap={6}>
                                <Text size="sm" fw={500}>Keyword prefix</Text>
                                <Text size="xs" c="dimmed" mih={44} lh={1.45}>
                                    Prepended to every page keyword to avoid collisions.
                                </Text>
                                <TextInput
                                    aria-label="Keyword prefix"
                                    placeholder="e.g. imported_"
                                    value={keywordPrefix}
                                    onChange={(event) => setKeywordPrefix(event.currentTarget.value)}
                                />
                            </Stack>
                            <Stack gap={6}>
                                <Text size="sm" fw={500}>Route prefix</Text>
                                <Text size="xs" c="dimmed" mih={44} lh={1.45}>
                                    Prepended to every imported route path. Note: in-bundle links are not rewritten, so leave empty unless you know the bundle has no internal links.
                                </Text>
                                <TextInput
                                    aria-label="Route prefix"
                                    placeholder="e.g. /imported"
                                    value={routePrefix}
                                    onChange={(event) => setRoutePrefix(event.currentTarget.value)}
                                />
                            </Stack>
                        </SimpleGrid>

                        <MultiSelect
                            label="Viewer groups"
                            placeholder={accessGroups.length > 0 ? undefined : 'Admins always have access — pick groups that should see these pages'}
                            description="Groups granted access to the imported pages (read-only on public pages, full access on CMS-app pages). Admins always get full access."
                            data={groupOptions}
                            value={accessGroups}
                            onChange={setAccessGroups}
                            searchable
                            clearable
                            hidePickedOptions
                            maxDropdownHeight={220}
                        />

                        <Group gap="xl">
                            <Switch
                                label="Skip conflicting routes"
                                checked={skipConflictingRoutes}
                                onChange={(event) => setSkipConflictingRoutes(event.currentTarget.checked)}
                            />
                            <Switch
                                label="Activate routes"
                                checked={activateRoutes}
                                onChange={(event) => setActivateRoutes(event.currentTarget.checked)}
                            />
                        </Group>

                        {validateError && (
                            <Alert color="red" icon={<IconX size="1rem" />} variant="light">
                                {validateError}
                            </Alert>
                        )}

                        {report && (
                            <Box>
                                <Group gap="xs" mb="xs">
                                    {report.valid ? (
                                        <ThemeIcon color="green" variant="light" size="sm">
                                            <IconCircleCheck size="0.9rem" />
                                        </ThemeIcon>
                                    ) : (
                                        <ThemeIcon color="red" variant="light" size="sm">
                                            <IconAlertTriangle size="0.9rem" />
                                        </ThemeIcon>
                                    )}
                                    <Text size="sm" fw={600}>
                                        {report.valid ? 'Bundle is valid' : 'Bundle has blocking issues'}
                                    </Text>
                                    {errorCount > 0 && <Badge color="red" variant="light">{errorCount} error(s)</Badge>}
                                    {warningCount > 0 && <Badge color="yellow" variant="light">{warningCount} warning(s)</Badge>}
                                </Group>

                                {report.issues.length > 0 && (
                                    <ScrollArea.Autosize mah={220}>
                                        <List spacing={4} size="sm" center>
                                            {report.issues.map((issue, index) => (
                                                <List.Item
                                                    key={`${issue.code}-${index}`}
                                                    icon={
                                                        <ThemeIcon
                                                            color={issue.level === 'error' ? 'red' : 'yellow'}
                                                            variant="light"
                                                            size="sm"
                                                        >
                                                            {issue.level === 'error' ? (
                                                                <IconX size="0.8rem" />
                                                            ) : (
                                                                <IconAlertTriangle size="0.8rem" />
                                                            )}
                                                        </ThemeIcon>
                                                    }
                                                >
                                                    {issue.page_keyword ? (
                                                        <Text span fw={600}>{issue.page_keyword}: </Text>
                                                    ) : null}
                                                    {issue.message}
                                                </List.Item>
                                            ))}
                                        </List>
                                    </ScrollArea.Autosize>
                                )}
                            </Box>
                        )}
                    </Stack>
                </Tabs.Panel>

                {/* ---------------- Example bundles ---------------- */}
                <Tabs.Panel value="examples" pt="md">
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            Ready-made example bundles shipped with the CMS. Load one to populate the
                            Import tab (with a safe keyword/route prefix already filled in), then
                            validate and import to try the pattern end-to-end.
                        </Text>

                        {isLoadingExamples && (
                            <Group gap="xs">
                                <Loader size="0.9rem" />
                                <Text size="sm" c="dimmed">Loading examples…</Text>
                            </Group>
                        )}

                        {examplesError && (
                            <Alert color="red" icon={<IconX size="1rem" />} variant="light">
                                {examplesError}
                            </Alert>
                        )}

                        {!isLoadingExamples && !examplesError && examples.length === 0 && examplesLoaded && (
                            <Alert color="gray" variant="light">
                                No example bundles are shipped with this instance.
                            </Alert>
                        )}

                        {examples.map((example) => (
                            <Card key={example.id} withBorder padding="md" radius="md">
                                <Group justify="space-between" align="flex-start" wrap="nowrap">
                                    <Box style={{ flex: 1 }}>
                                        <Group gap="xs" mb={4}>
                                            <Text fw={600}>{example.title}</Text>
                                            <Badge variant="light" color="blue">
                                                {example.page_count} page(s)
                                            </Badge>
                                        </Group>
                                        {example.description && (
                                            <Text size="sm" c="dimmed">
                                                {example.description}
                                            </Text>
                                        )}
                                    </Box>
                                    <Button
                                        variant="light"
                                        leftSection={<IconFileImport size="0.9rem" />}
                                        onClick={() => handleUseExample(example)}
                                    >
                                        Use this bundle
                                    </Button>
                                </Group>
                            </Card>
                        ))}
                    </Stack>
                </Tabs.Panel>
            </Tabs>
        </ModalWrapper>
    );
}
