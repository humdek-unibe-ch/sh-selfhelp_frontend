/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React, { useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Checkbox,
    Code,
    FileInput,
    Group,
    Loader,
    Modal,
    MultiSelect,
    Paper,
    Radio,
    SegmentedControl,
    Select,
    Stack,
    Tabs,
    Text,
    Textarea,
    TextInput,
} from '@mantine/core';
import { IconClipboard, IconDownload, IconEye, IconUpload } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { AdminNavigationApi } from '../../../../api/admin/navigation.api';
import { useAdminPages } from '../../../../hooks/useAdminPages';
import {
    useCanExportNavigation,
    useCanImportNavigation,
} from '../../../../hooks/usePermissionChecks';
import { useImportNavigationMutation } from '../../../../hooks/mutations/useImportNavigationMutation';
import { useGroups } from '../../../../hooks/useGroups';
import { downloadJsonFile } from '../../../../utils/export-import.utils';
import { parseApiError } from '../../../../utils/mutation-error-handler';
import type {
    INavigationBundle,
    INavigationImportOptions,
    INavigationImportValidationResult,
    TNavigationExportMode,
    TNavigationMenuPolicy,
} from '../../../../types/requests/admin/navigation-export-import.types';
import { MENU_TABS, type TMenuKey } from './navigation-builder.constants';
import {
    DEFAULT_IMPORT_OPTIONS,
    DEMO_IMPORT_OPTIONS,
    MENU_POLICY_LABELS,
    hasReplaceMenuPolicy,
    isNavigationBundle,
    navigationExportFilename,
    summarizeNavigationImportPreview,
} from './navigation-export-import.utils';

interface INavigationExportImportPanelProps {
    onImported?: () => void;
}

const MISSING_PAGES_OPTIONS = [
    { value: 'strict', label: 'Strict — fail if pages are missing' },
    { value: 'skip_missing', label: 'Skip missing — import what can be matched' },
    { value: 'create_stubs', label: 'Create stubs — create empty pages for missing keywords' },
] as const;

const MENU_POLICY_OPTIONS: Array<{ value: TNavigationMenuPolicy; label: string }> = [
    { value: 'merge', label: 'Merge into menu' },
    { value: 'append', label: 'Append only' },
    { value: 'replace', label: 'Replace menu' },
];

export function NavigationExportImportPanel({
    onImported,
}: INavigationExportImportPanelProps): React.ReactElement {
    const canExport = useCanExportNavigation();
    const canImport = useCanImportNavigation();
    const { pages } = useAdminPages();
    const { data: groupsData } = useGroups({ pageSize: 1000 });
    const groupOptions = useMemo(
        () => (groupsData?.groups ?? []).map((group) => ({
            value: String(group.id),
            label: group.name,
        })),
        [groupsData],
    );

    const [activeTab, setActiveTab] = useState<string | null>(canExport ? 'export' : 'import');
    const [exportMode, setExportMode] = useState<TNavigationExportMode>('full_snapshot');
    const [includePages, setIncludePages] = useState(false);
    const [includeSettings, setIncludeSettings] = useState(false);
    const [keywordPrefix, setKeywordPrefix] = useState('');
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);
    const [exportPreview, setExportPreview] = useState<INavigationBundle | null>(null);
    const [exportError, setExportError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPaste, setImportPaste] = useState('');
    const [bundle, setBundle] = useState<INavigationBundle | null>(null);
    const [parseError, setParseError] = useState<string | null>(null);
    const [importOptions, setImportOptions] = useState<INavigationImportOptions>(DEFAULT_IMPORT_OPTIONS);
    const [validation, setValidation] = useState<INavigationImportValidationResult | null>(null);
    const [validateError, setValidateError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [demoLoadError, setDemoLoadError] = useState<string | null>(null);
    const [isLoadingDemo, setIsLoadingDemo] = useState(false);

    const importMutation = useImportNavigationMutation({
        showNotifications: true,
        onSuccess: () => {
            setConfirmOpen(false);
            setValidation(null);
            onImported?.();
        },
    });

    const pageOptions = useMemo(
        () => (pages ?? []).map((page) => ({
            value: String(page.id_pages),
            label: `${page.keyword ?? 'untitled'} (#${page.id_pages})`,
        })),
        [pages],
    );

    const previewSummary = useMemo(() => {
        if (!bundle || !validation) {
            return null;
        }
        return summarizeNavigationImportPreview(bundle, validation.issues);
    }, [bundle, validation]);

    const replacePolicySelected = hasReplaceMenuPolicy(importOptions.menuPolicies);
    const canImportNow = validation?.valid === true && bundle !== null && canImport;

    function updateMenuPolicy(menuKey: TMenuKey, policy: TNavigationMenuPolicy) {
        setImportOptions((current) => ({
            ...current,
            menuPolicies: {
                ...current.menuPolicies,
                [menuKey]: policy,
            },
        }));
        setValidation(null);
    }

    function applyDemoPreset() {
        setImportOptions(DEMO_IMPORT_OPTIONS);
        setValidation(null);
    }

    function applyImportHintsFromBundle(bundle: INavigationBundle): void {
        const hints = bundle.import_hints;
        if (!hints) {
            return;
        }
        setImportOptions((current) => ({
            ...current,
            keywordPrefix: hints.default_keyword_prefix ?? current.keywordPrefix ?? '',
            routePrefix: hints.default_route_prefix ?? current.routePrefix ?? '',
        }));
    }

    async function parseBundleText(text: string): Promise<void> {
        setParseError(null);
        setBundle(null);
        setValidation(null);
        try {
            const parsed = JSON.parse(text) as unknown;
            if (!isNavigationBundle(parsed)) {
                setParseError('The JSON is not a valid selfhelp/navigation-bundle v2.0 (check "format", "version", and "menus").');
                return;
            }
            setBundle(parsed);
            applyImportHintsFromBundle(parsed);
        } catch {
            setParseError('The content is not valid JSON.');
        }
    }

    async function handleImportFileChange(file: File | null) {
        setImportFile(file);
        setImportPaste('');
        if (!file) {
            setBundle(null);
            setParseError(null);
            setValidation(null);
            return;
        }
        const text = await file.text();
        await parseBundleText(text);
    }

    async function handleImportPasteChange(value: string) {
        setImportPaste(value);
        setImportFile(null);
        if (!value.trim()) {
            setBundle(null);
            setParseError(null);
            setValidation(null);
            return;
        }
        await parseBundleText(value);
    }

    async function handleLoadDemoBundle() {
        setIsLoadingDemo(true);
        setDemoLoadError(null);
        try {
            const demoModule = await import('../../../../../examples/navigation/menu-demo.bundle.json');
            const demoBundle = demoModule.default as INavigationBundle;
            setBundle(demoBundle);
            setImportPaste(JSON.stringify(demoBundle, null, 2));
            setImportFile(null);
            applyDemoPreset();
            setValidation(null);
            notifications.show({
                title: 'Demo bundle loaded',
                message: 'Review the demo import options (replace all menus, prefix qa-demo-, routes under /demo) before validating.',
                color: 'blue',
            });
        } catch {
            setDemoLoadError(
                'Could not load the bundled demo file. Upload examples/navigation/menu-demo.bundle.json manually.',
            );
        } finally {
            setIsLoadingDemo(false);
        }
    }

    async function handleExportPreview() {
        if (exportMode === 'branch' && selectedPageIds.length === 0) {
            setExportError('Select at least one page for a branch export.');
            return;
        }
        setIsExporting(true);
        setExportError(null);
        try {
            const result = await AdminNavigationApi.exportNavigation({
                exportMode,
                includePages,
                includeSettings,
                keywordPrefix,
                selectedPageIds: exportMode === 'branch' ? selectedPageIds.map(Number) : undefined,
            });
            setExportPreview(result);
        } catch (error) {
            setExportError(parseApiError(error).errorMessage);
            setExportPreview(null);
        } finally {
            setIsExporting(false);
        }
    }

    async function handleExportDownload() {
        const payload = exportPreview ?? await fetchExportBundle();
        if (!payload) {
            return;
        }
        downloadJsonFile(payload, navigationExportFilename());
    }

    async function handleExportCopy() {
        const payload = exportPreview ?? await fetchExportBundle();
        if (!payload) {
            return;
        }
        try {
            await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
            notifications.show({
                title: 'Copied',
                message: 'Navigation bundle JSON copied to clipboard.',
                color: 'green',
            });
        } catch {
            notifications.show({
                title: 'Copy failed',
                message: 'Could not copy to clipboard.',
                color: 'red',
            });
        }
    }

    async function fetchExportBundle(): Promise<INavigationBundle | null> {
        if (exportMode === 'branch' && selectedPageIds.length === 0) {
            setExportError('Select at least one page for a branch export.');
            return null;
        }
        setIsExporting(true);
        setExportError(null);
        try {
            const result = await AdminNavigationApi.exportNavigation({
                exportMode,
                includePages,
                includeSettings,
                keywordPrefix,
                selectedPageIds: exportMode === 'branch' ? selectedPageIds.map(Number) : undefined,
            });
            setExportPreview(result);
            return result;
        } catch (error) {
            setExportError(parseApiError(error).errorMessage);
            return null;
        } finally {
            setIsExporting(false);
        }
    }

    async function handleValidateImport() {
        if (!bundle) {
            return;
        }
        setIsValidating(true);
        setValidateError(null);
        try {
            const result = await AdminNavigationApi.validateNavigationImport(bundle, importOptions);
            setValidation(result);
        } catch (error) {
            setValidateError(parseApiError(error).errorMessage);
            setValidation(null);
        } finally {
            setIsValidating(false);
        }
    }

    function handleImportClick() {
        if (!canImportNow) {
            return;
        }
        setConfirmOpen(true);
    }

    function handleConfirmImport() {
        if (!bundle) {
            return;
        }
        importMutation.mutate({ bundle, options: importOptions });
    }

    if (!canExport && !canImport) {
        return (
            <Alert color="yellow" title="Export / import unavailable">
                You do not have permission to export or import navigation bundles.
            </Alert>
        );
    }

    return (
        <Stack gap="md">
            <Alert variant="light" color="blue" title="Navigation bundles vs page bundles">
                <Stack gap={4}>
                    <Text size="sm">Page bundles contain content only. Navigation bundles contain menu structure.</Text>
                    <Text size="sm">After importing pages, assign them to menus here.</Text>
                    <Text size="sm">
                        Menus use stored menu rows only. They do not auto-sync from the page tree.
                    </Text>
                </Stack>
            </Alert>

            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    {canExport ? (
                        <Tabs.Tab value="export" leftSection={<IconDownload size="0.9rem" />}>
                            Export
                        </Tabs.Tab>
                    ) : null}
                    {canImport ? (
                        <Tabs.Tab value="import" leftSection={<IconUpload size="0.9rem" />}>
                            Import
                        </Tabs.Tab>
                    ) : null}
                </Tabs.List>

                {canExport ? (
                    <Tabs.Panel value="export" pt="md">
                        <Stack gap="md">
                            <SegmentedControl
                                value={exportMode}
                                onChange={(value) => {
                                    setExportMode(value as TNavigationExportMode);
                                    setExportPreview(null);
                                    setExportError(null);
                                }}
                                data={[
                                    { label: 'Full menu snapshot', value: 'full_snapshot' },
                                    { label: 'Branch export', value: 'branch' },
                                ]}
                            />

                            <Group>
                                <Checkbox
                                    label="Include referenced pages"
                                    checked={includePages}
                                    onChange={(event) => {
                                        setIncludePages(event.currentTarget.checked);
                                        setExportPreview(null);
                                    }}
                                />
                                <Checkbox
                                    label="Include navigation settings"
                                    checked={includeSettings}
                                    onChange={(event) => {
                                        setIncludeSettings(event.currentTarget.checked);
                                        setExportPreview(null);
                                    }}
                                />
                            </Group>

                            <TextInput
                                label="Default keyword prefix (export hint)"
                                description="Optional prefix written into import_hints for downstream imports."
                                value={keywordPrefix}
                                onChange={(event) => {
                                    setKeywordPrefix(event.currentTarget.value);
                                    setExportPreview(null);
                                }}
                            />

                            {exportMode === 'branch' ? (
                                <Stack gap="xs">
                                    <MultiSelect
                                        label="Seed pages"
                                        description="Branch export includes ancestors and sibling branches needed to preserve menu structure."
                                        placeholder="Select one or more pages"
                                        data={pageOptions}
                                        value={selectedPageIds}
                                        onChange={(value) => {
                                            setSelectedPageIds(value);
                                            setExportPreview(null);
                                        }}
                                        searchable
                                        clearable
                                    />
                                    <Text size="sm" c="dimmed">
                                        Selected pages seed the branch. Related ancestors and sibling menu branches
                                        are included automatically so the exported subtree stays coherent.
                                    </Text>
                                </Stack>
                            ) : null}

                            {exportError ? <Alert color="red">{exportError}</Alert> : null}

                            <Group>
                                <Button
                                    variant="default"
                                    leftSection={isExporting ? <Loader size="0.9rem" /> : <IconEye size="0.9rem" />}
                                    onClick={handleExportPreview}
                                    loading={isExporting}
                                    disabled={exportMode === 'branch' && selectedPageIds.length === 0}
                                >
                                    Preview export
                                </Button>
                                <Button
                                    leftSection={<IconDownload size="0.9rem" />}
                                    onClick={handleExportDownload}
                                    disabled={exportMode === 'branch' && selectedPageIds.length === 0}
                                >
                                    Download bundle JSON
                                </Button>
                                <Button
                                    variant="light"
                                    leftSection={<IconClipboard size="0.9rem" />}
                                    onClick={handleExportCopy}
                                    disabled={exportMode === 'branch' && selectedPageIds.length === 0}
                                >
                                    Copy JSON
                                </Button>
                            </Group>

                            {exportPreview ? (
                                <Paper withBorder p="md">
                                    <Stack gap="xs">
                                        <Text fw={600}>Export preview</Text>
                                        <Group gap="xs">
                                            <Badge variant="light">{exportPreview.format ?? 'navigation bundle'}</Badge>
                                            <Badge variant="light">mode: {exportPreview.export_mode ?? exportMode}</Badge>
                                            <Badge variant="light">
                                                menus: {Object.keys(exportPreview.menus ?? {}).length}
                                            </Badge>
                                            {exportPreview.pages ? (
                                                <Badge variant="light">pages: {exportPreview.pages.length}</Badge>
                                            ) : null}
                                        </Group>
                                        <Code block style={{ maxHeight: 240, overflow: 'auto' }}>
                                            {JSON.stringify(exportPreview, null, 2).slice(0, 4000)}
                                            {JSON.stringify(exportPreview).length > 4000 ? '\n…' : ''}
                                        </Code>
                                    </Stack>
                                </Paper>
                            ) : null}
                        </Stack>
                    </Tabs.Panel>
                ) : null}

                {canImport ? (
                    <Tabs.Panel value="import" pt="md">
                        <Stack gap="md">
                            <Text size="sm" c="dimmed">
                                Upload a navigation bundle JSON file or paste JSON below. Validate before importing.
                            </Text>

                            <Group align="flex-end">
                                <Button
                                    variant="light"
                                    loading={isLoadingDemo}
                                    onClick={handleLoadDemoBundle}
                                >
                                    Import 20-page demo bundle
                                </Button>
                                <Text size="xs" c="dimmed">
                                    Example bundles also live under <Code>frontend/examples/navigation/</Code>.
                                </Text>
                            </Group>
                            {demoLoadError ? <Alert color="yellow">{demoLoadError}</Alert> : null}

                            <FileInput
                                label="Upload JSON file"
                                placeholder="Pick a navigation bundle"
                                accept="application/json,.json"
                                value={importFile}
                                onChange={handleImportFileChange}
                                clearable
                            />

                            <Textarea
                                label="Or paste JSON"
                                placeholder='{ "format": "selfhelp/navigation-bundle", "menus": { ... } }'
                                minRows={6}
                                value={importPaste}
                                onChange={(event) => void handleImportPasteChange(event.currentTarget.value)}
                            />

                            {parseError ? <Alert color="red">{parseError}</Alert> : null}

                            <TextInput
                                label="Keyword prefix"
                                description="Applied to page keywords during import (e.g. qa-demo-)."
                                value={importOptions.keywordPrefix ?? ''}
                                onChange={(event) => {
                                    setImportOptions((current) => ({
                                        ...current,
                                        keywordPrefix: event.currentTarget.value,
                                    }));
                                    setValidation(null);
                                }}
                            />

                            <TextInput
                                label="Route prefix"
                                description="Prepended to every embedded page route (e.g. /demo avoids clashing with /)."
                                value={importOptions.routePrefix ?? ''}
                                onChange={(event) => {
                                    setImportOptions((current) => ({
                                        ...current,
                                        routePrefix: event.currentTarget.value,
                                    }));
                                    setValidation(null);
                                }}
                            />

                            <Select
                                label="Missing pages mode"
                                data={[...MISSING_PAGES_OPTIONS]}
                                value={importOptions.missingPagesMode ?? 'strict'}
                                onChange={(value) => {
                                    if (!value) {
                                        return;
                                    }
                                    setImportOptions((current) => ({
                                        ...current,
                                        missingPagesMode: value as INavigationImportOptions['missingPagesMode'],
                                    }));
                                    setValidation(null);
                                }}
                            />

                            <MultiSelect
                                label="Viewer groups"
                                placeholder={
                                    (importOptions.accessGroups?.length ?? 0) > 0
                                        ? undefined
                                        : 'Admins always have access — pick groups for embedded pages'
                                }
                                description="Groups granted access to pages imported with this bundle. Public pages also keep default subject and therapist read access."
                                data={groupOptions}
                                value={(importOptions.accessGroups ?? []).map(String)}
                                onChange={(values) => {
                                    setImportOptions((current) => ({
                                        ...current,
                                        accessGroups: values.map((value) => Number.parseInt(value, 10)).filter((id) => id > 0),
                                    }));
                                    setValidation(null);
                                }}
                                searchable
                                clearable
                                hidePickedOptions
                                maxDropdownHeight={220}
                            />

                            <Stack gap="sm">
                                <Group justify="space-between">
                                    <Text fw={500}>Per-menu conflict policy</Text>
                                    <Button variant="subtle" size="xs" onClick={applyDemoPreset}>
                                        Demo reset mode
                                    </Button>
                                </Group>
                                <Text size="xs" c="dimmed">
                                    Demo reset sets all menus to replace, prefix <Code>qa-demo-</Code>, and route prefix <Code>/demo</Code>.
                                </Text>
                                {MENU_TABS.map((tab) => (
                                    <Radio.Group
                                        key={tab.key}
                                        label={MENU_POLICY_LABELS[tab.key]}
                                        value={importOptions.menuPolicies?.[tab.key] ?? 'merge'}
                                        onChange={(value) => updateMenuPolicy(tab.key, value as TNavigationMenuPolicy)}
                                    >
                                        <Group mt="xs">
                                            {MENU_POLICY_OPTIONS.map((option) => (
                                                <Radio key={option.value} value={option.value} label={option.label} />
                                            ))}
                                        </Group>
                                    </Radio.Group>
                                ))}
                            </Stack>

                            {replacePolicySelected ? (
                                <Alert color="red" title="Replace policy selected">
                                    This will replace existing items in selected menus. This cannot be undone
                                    automatically.
                                </Alert>
                            ) : null}

                            <Group>
                                <Button
                                    variant="default"
                                    disabled={!bundle || isValidating}
                                    leftSection={isValidating ? <Loader size="0.9rem" /> : undefined}
                                    onClick={handleValidateImport}
                                >
                                    Validate import
                                </Button>
                                <Button
                                    color="green"
                                    disabled={!canImportNow || importMutation.isPending}
                                    leftSection={
                                        importMutation.isPending ? <Loader size="0.9rem" /> : <IconUpload size="0.9rem" />
                                    }
                                    onClick={handleImportClick}
                                >
                                    Import navigation
                                </Button>
                            </Group>

                            {validateError ? <Alert color="red">{validateError}</Alert> : null}

                            {validation && previewSummary ? (
                                <Paper withBorder p="md">
                                    <Stack gap="sm">
                                        <Group gap="xs">
                                            <Text fw={600}>Validation preview</Text>
                                            <Badge color={validation.valid ? 'green' : 'red'}>
                                                {validation.valid ? 'Valid' : 'Has errors'}
                                            </Badge>
                                            {previewSummary.warnings.length > 0 ? (
                                                <Badge color="yellow">{previewSummary.warnings.length} warning(s)</Badge>
                                            ) : null}
                                        </Group>

                                        <Group gap="xs">
                                            <Badge variant="light">
                                                Menus: {previewSummary.menusAffected.join(', ') || '—'}
                                            </Badge>
                                            <Badge variant="light">Items in bundle: {previewSummary.itemsInBundle}</Badge>
                                            <Badge variant="light">Pages included: {previewSummary.pagesIncluded}</Badge>
                                        </Group>

                                        {previewSummary.errors.length > 0 ? (
                                            <Alert color="red" title="Errors">
                                                <Stack gap={4}>
                                                    {previewSummary.errors.map((issue) => (
                                                        <Text key={`${issue.code}-${issue.message}`} size="sm">
                                                            {issue.message}
                                                        </Text>
                                                    ))}
                                                </Stack>
                                            </Alert>
                                        ) : null}

                                        {previewSummary.warnings.length > 0 ? (
                                            <Alert color="yellow" title="Warnings">
                                                <Stack gap={4}>
                                                    {previewSummary.warnings.map((issue) => (
                                                        <Text key={`${issue.code}-${issue.message}`} size="sm">
                                                            {issue.message}
                                                        </Text>
                                                    ))}
                                                </Stack>
                                            </Alert>
                                        ) : null}

                                        {previewSummary.missingPages.length > 0 ? (
                                            <Alert color="orange" title="Missing pages">
                                                <Stack gap={4}>
                                                    {previewSummary.missingPages.map((issue) => (
                                                        <Text key={`${issue.code}-${issue.message}`} size="sm">
                                                            {issue.message}
                                                        </Text>
                                                    ))}
                                                </Stack>
                                            </Alert>
                                        ) : null}

                                        {previewSummary.conflicts.length > 0 ? (
                                            <Alert color="orange" title="Conflicts">
                                                <Stack gap={4}>
                                                    {previewSummary.conflicts.map((issue) => (
                                                        <Text key={`${issue.code}-${issue.message}`} size="sm">
                                                            {issue.message}
                                                        </Text>
                                                    ))}
                                                </Stack>
                                            </Alert>
                                        ) : null}

                                        {previewSummary.conflicts.some((issue) => issue.code === 'duplicate_keyword') ? (
                                            <Alert color="blue" title="Partial import detected?">
                                                Pages with these keywords already exist — often from a previous import
                                                that failed partway through. Delete the matching pages under Admin →
                                                Pages, or choose a new keyword prefix and import again.
                                            </Alert>
                                        ) : null}

                                        {!validation.valid ? (
                                            <Text size="sm" c="dimmed">
                                                Fix validation errors before importing.
                                            </Text>
                                        ) : null}
                                    </Stack>
                                </Paper>
                            ) : null}

                            <Text size="xs" c="dimmed">
                                Example bundles are available under frontend/examples/navigation/. Upload
                                menu-demo.bundle.json here to test a full demo site.
                            </Text>
                        </Stack>
                    </Tabs.Panel>
                ) : null}
            </Tabs>

            <Modal
                opened={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                title="Confirm navigation import"
            >
                <Stack gap="md">
                    {replacePolicySelected ? (
                        <Alert color="red">
                            This will replace existing items in selected menus. This cannot be undone automatically.
                        </Alert>
                    ) : (
                        <Text size="sm">
                            Import will apply the validated bundle with your selected menu policies.
                        </Text>
                    )}
                    {importOptions.keywordPrefix ? (
                        <Text size="sm">
                            Page keywords will use prefix <Code>{importOptions.keywordPrefix}</Code>.
                        </Text>
                    ) : null}
                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => setConfirmOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="green"
                            loading={importMutation.isPending}
                            onClick={handleConfirmImport}
                        >
                            Import navigation
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
}
