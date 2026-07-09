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
 * The import flow accepts BOTH bundle formats: plain `selfhelp/page-bundle`
 * files go through the pages import endpoint, while `selfhelp/navigation-bundle`
 * files (e.g. the shipped menu demo) are routed to the navigation import
 * endpoint so their embedded pages AND menu structure are created together —
 * a navigation bundle imported here never silently drops its menus.
 *
 * @module app/components/cms/pages/admin-pages-list/PageExportImportModal
 */

import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Code,
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
import { NAVIGATION_BUNDLE_FORMAT } from '@selfhelp/shared';
import { AdminApi } from '../../../../../api/admin';
import { AdminNavigationApi } from '../../../../../api/admin/navigation.api';
import { useImportNavigationMutation, useImportPagesMutation } from '../../../../../hooks/mutations';
import { useGroups } from '../../../../../hooks/useGroups';
import { type IAdminPage } from '../../../../../types/responses/admin/admin.types';
import {
    type IPageBundle,
    type IPageExampleBundle,
    type IPageImportOptions,
    type IPageImportValidationReport,
} from '../../../../../types/requests/admin/page-export-import.types';
import {
    type INavigationBundle,
    type INavigationImportOptions,
} from '../../../../../types/requests/admin/navigation-export-import.types';
import { parseApiError } from '../../../../../utils/mutation-error-handler';

interface IPageExportImportModalProps {
    opened: boolean;
    onClose: () => void;
    pages: IAdminPage[];
    /** Tab shown when the modal opens (default 'export'); 'examples' is the template gallery. */
    initialTab?: 'export' | 'import' | 'examples';
}

type TPageImportOptions = IPageImportOptions;

type TImportableBundle = IPageBundle | INavigationBundle;

/** Navigation bundles carry menus and must go through the navigation importer. */
function isNavigationBundle(candidate: TImportableBundle | null): candidate is INavigationBundle {
    return candidate?.format === NAVIGATION_BUNDLE_FORMAT;
}

export function PageExportImportModal({ opened, onClose, pages, initialTab = 'export' }: IPageExportImportModalProps) {
    const [userSelectedTab, setUserSelectedTab] = useState<string | null>(null);
    const activeTab = userSelectedTab ?? initialTab;

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
    const [bundle, setBundle] = useState<TImportableBundle | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [keywordPrefix, setKeywordPrefix] = useState('');
    const [routePrefix, setRoutePrefix] = useState('');
    const [skipConflictingRoutes, setSkipConflictingRoutes] = useState(false);
    const [activateRoutes, setActivateRoutes] = useState(true);
    const [importData, setImportData] = useState(false);
    const [accessGroups, setAccessGroups] = useState<string[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [report, setReport] = useState<IPageImportValidationReport | null>(null);
    const [validateError, setValidateError] = useState<string | null>(null);

    const importMutation = useImportPagesMutation({
        onSuccess: () => {
            handleClose();
        },
    });

    // Navigation bundles (menus + embedded pages) go through the navigation
    // importer so the imported pages end up wrapped in the menu structure.
    const importNavigationMutation = useImportNavigationMutation({
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
            importData,
            // Never send admin here — createPage always grants full admin ACL.
            accessGroups: accessGroups.length > 0
                ? accessGroups.map(Number).filter((id) => Number.isFinite(id) && id > 0)
                : undefined,
        }),
        [keywordPrefix, routePrefix, skipConflictingRoutes, activateRoutes, importData, accessGroups]
    );

    // Prefixes are sent verbatim (empty string = "no prefix") so the visible
    // inputs stay authoritative even when the bundle ships import_hints —
    // the hints are used to PRE-FILL the inputs, never applied silently.
    const navigationImportOptions: INavigationImportOptions = useMemo(
        () => ({
            keywordPrefix: keywordPrefix.trim(),
            routePrefix: routePrefix.trim(),
            skipConflictingRoutes,
            activateRoutes,
            missingPagesMode: 'strict',
            accessGroups: accessGroups.length > 0 ? accessGroups.map(Number) : undefined,
        }),
        [keywordPrefix, routePrefix, skipConflictingRoutes, activateRoutes, accessGroups]
    );

    // Groups available as importer-selected "viewer" groups. Admin is always
    // granted full access by the backend; hide it from this picker so operators
    // cannot (and need not) select it. Remaining groups get read (public) /
    // full CRUD (cms-app) so imported pages are visible to real users.
    const { data: groupsData } = useGroups({ pageSize: 1000 });
    const groupOptions = useMemo(
        () => (groupsData?.groups ?? [])
            .filter((group) => group.name.trim().toLowerCase() !== 'admin')
            .map((group) => ({
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
        setImportData(false);
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

    // Load shipped templates when the modal opens directly on the examples tab
    // (`initialTab='examples'`) — `handleTabChange` alone misses that case.
    useEffect(() => {
        if (opened && activeTab === 'examples') {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot examples fetch when the tab is shown on open
            void loadExamples();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- loadExamples is stable enough for this open/tab gate
    }, [opened, activeTab]);

    function handleTabChange(value: string | null) {
        const next = value ?? 'export';
        setUserSelectedTab(next);
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
        if (isNavigationBundle(example.bundle)) {
            // Navigation bundles ship their own tested prefixes (the menu item
            // keywords and embedded page routes must stay in sync, and the
            // backend applies the SAME prefix to both) — seed the inputs from
            // the bundle's import hints so what runs is what the user sees.
            setKeywordPrefix(example.bundle.import_hints?.default_keyword_prefix ?? '');
            setRoutePrefix(example.bundle.import_hints?.default_route_prefix ?? '');
        } else {
            // Both prefixes: keywords stay unique AND the routes move under a
            // demo base. The backend importer rewrites in-bundle content links
            // (card links, add/edit URLs, cancel/redirect URLs) to match the
            // route prefix, so the imported app is fully clickable and never
            // collides with an already-imported copy of the same template.
            setKeywordPrefix(`demo_${example.id.replace(/-/g, '_')}_`);
            setRoutePrefix(`/demo-${example.id}`);
        }
        // Example templates often ship sample people/posts; restore them by default.
        const tags = Array.isArray((example.bundle as { tags?: unknown }).tags)
            ? ((example.bundle as { tags?: string[] }).tags ?? [])
            : [];
        setImportData(tags.includes('cms-in-cms'));
        setUserSelectedTab('import');
    }

    function handleClose() {
        setSelectedExportIds([]);
        setExportError(null);
        resetImportState();
        setUserSelectedTab(null);
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
            const parsed = JSON.parse(text) as TImportableBundle;
            if (isNavigationBundle(parsed)) {
                // Navigation bundle: menus (+ optionally embedded pages). Seed
                // the prefix inputs from its import hints so validate/import
                // run with the bundle's tested defaults.
                setBundle(parsed);
                setKeywordPrefix(parsed.import_hints?.default_keyword_prefix ?? '');
                setRoutePrefix(parsed.import_hints?.default_route_prefix ?? '');
                return;
            }
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
            if (isNavigationBundle(bundle)) {
                const result = await AdminNavigationApi.validateNavigationImport(bundle, navigationImportOptions);
                setReport({
                    valid: result.valid,
                    issues: result.issues.map((issue) => ({
                        level: issue.level,
                        code: issue.code,
                        message: issue.menu_key ? `[${issue.menu_key}] ${issue.message}` : issue.message,
                        page_keyword: issue.page_keyword ?? null,
                    })),
                });
            } else {
                const result = await AdminApi.validateImportPages(bundle, importOptions);
                setReport(result);
            }
        } catch (error) {
            setValidateError(parseApiError(error).errorMessage);
        } finally {
            setIsValidating(false);
        }
    }

    function handleImport() {
        if (!bundle) return;
        if (isNavigationBundle(bundle)) {
            importNavigationMutation.mutate({ bundle, options: navigationImportOptions });
            return;
        }
        importMutation.mutate({ bundle, options: importOptions });
    }

    const bundleIsNavigation = isNavigationBundle(bundle);
    const bundlePageCount = bundle?.pages?.length ?? 0;
    const bundleMenuCount = bundleIsNavigation ? Object.keys(bundle.menus ?? {}).length : 0;
    const errorCount = report?.issues.filter((issue) => issue.level === 'error').length ?? 0;
    const warningCount = report?.issues.filter((issue) => issue.level === 'warning').length ?? 0;
    const canImport = report?.valid === true && bundle !== null;
    const isImporting = importMutation.isPending || importNavigationMutation.isPending;

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
                    disabled={!canImport || isImporting}
                    leftSection={
                        isImporting ? <Loader size="0.9rem" /> : <IconUpload size="0.9rem" />
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
                        Start from template
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
                            description="Upload a page bundle or navigation bundle JSON exported from this or another SelfHelp instance."
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
                                    {bundleIsNavigation ? (
                                        <>
                                            Navigation bundle loaded: <strong>{bundleMenuCount}</strong> menu(s)
                                            {' · '}<strong>{bundlePageCount}</strong> embedded page(s)
                                        </>
                                    ) : (
                                        <>
                                            Bundle loaded: <strong>{bundlePageCount}</strong> page(s)
                                        </>
                                    )}
                                    {bundle.core_version ? ` · exported from core ${bundle.core_version}` : ''}
                                </Text>
                                {bundleIsNavigation && (
                                    <Text size="xs" c="dimmed" mt={4}>
                                        Importing creates the pages first, then wraps them into the
                                        web header/footer and mobile drawer/tab menus carried by the
                                        bundle. Admins always get full access to the imported pages.
                                    </Text>
                                )}
                            </Alert>
                        )}

                        <Divider label="Safe-import options" labelPosition="left" />

                        {/* `inputWrapperOrder` puts the description BELOW the input, so
                            the two inputs stay on the same row regardless of how long
                            each explanation runs — no manual min-height alignment. */}
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <TextInput
                                label="Keyword prefix"
                                description="Prepended to every page keyword to avoid collisions."
                                inputWrapperOrder={['label', 'input', 'description']}
                                placeholder="e.g. imported_"
                                value={keywordPrefix}
                                onChange={(event) => setKeywordPrefix(event.currentTarget.value)}
                            />
                            <TextInput
                                label="Route prefix"
                                description="Prepended to every imported route path. In-bundle content links (cards, add/edit buttons, cancel URLs) are rewritten to match, so the imported app stays clickable."
                                inputWrapperOrder={['label', 'input', 'description']}
                                placeholder="e.g. /imported"
                                value={routePrefix}
                                onChange={(event) => setRoutePrefix(event.currentTarget.value)}
                            />
                        </SimpleGrid>

                        <MultiSelect
                            label="Viewer groups"
                            placeholder={accessGroups.length > 0 ? undefined : 'Optional — admins already have access'}
                            description="Extra groups that should see the imported pages (read-only on public pages, full access on CMS-app pages). The admin group is always granted full access automatically and is not listed here."
                            inputWrapperOrder={['label', 'input', 'description']}
                            data={groupOptions}
                            value={accessGroups}
                            onChange={setAccessGroups}
                            searchable
                            clearable
                            hidePickedOptions
                            maxDropdownHeight={220}
                        />

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Switch
                                label="Skip conflicting routes"
                                description="Skip pages whose route already exists instead of failing."
                                checked={skipConflictingRoutes}
                                onChange={(event) => setSkipConflictingRoutes(event.currentTarget.checked)}
                            />
                            <Switch
                                label="Activate routes"
                                description="Imported pages are immediately reachable at their routes."
                                checked={activateRoutes}
                                onChange={(event) => setActivateRoutes(event.currentTarget.checked)}
                            />
                        </SimpleGrid>

                        <Switch
                            label="Import sample records"
                            description="Restore the template’s demo people/posts into the new data table (recommended for Team Members and other gallery demos)."
                            checked={importData}
                            onChange={(event) => setImportData(event.currentTarget.checked)}
                        />

                        <Alert color="gray" variant="light">
                            <Text size="sm">
                                CMS Apps: the import creates (or reuses an empty) app shell. Keyword prefixes
                                such as <Code>demo_team_members_</Code> are normalised to a kebab-case app
                                slug (e.g. <Code>demo-team-members-team-members</Code>). If that slug already
                                has pages assigned, delete the shell under <strong>CMS Apps</strong> first —
                                pages and records are kept.
                            </Text>
                        </Alert>

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

                {/* ---------------- Start from template ---------------- */}
                <Tabs.Panel value="examples" pt="md">
                    <Stack gap="md">
                        <Text size="sm" c="dimmed">
                            Ready-made templates shipped with the CMS — complete apps with sample
                            data (team pages, news, FAQ, events and more). Pick one to populate the
                            Import tab with safe keyword/route prefixes already filled in, then
                            validate and import; the app is clickable immediately.
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
                                            {isNavigationBundle(example.bundle) && (
                                                <Badge variant="light" color="grape">
                                                    navigation + pages
                                                </Badge>
                                            )}
                                        </Group>
                                        {example.description && (
                                            <Text size="sm" c="dimmed">
                                                {example.description}
                                            </Text>
                                        )}
                                        {(example.tags?.length ?? 0) > 0 && (
                                            <Group gap={6} mt={6}>
                                                {example.tags.map((tag) => (
                                                    <Badge key={tag} variant="outline" color="gray" size="xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        )}
                                    </Box>
                                    <Button
                                        variant="light"
                                        leftSection={<IconFileImport size="0.9rem" />}
                                        onClick={() => handleUseExample(example)}
                                    >
                                        Use this template
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
