/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCallback, useMemo, useState } from 'react';
import { Alert, Center, Loader, Stack } from '@mantine/core';
import { useCmsAppBySlugQuery } from '../../../../hooks/useCmsApps';
import { CmsAppContentHost } from './CmsAppContentHost';
import { AdminApi } from '../../../../api/admin';
import { parseApiError } from '../../../../utils/mutation-error-handler';
import { useAuth } from '../../../../hooks/useAuth';

interface ICmsAppContentPageProps {
    slug: string;
}

export function CmsAppContentPage({
    slug,
}: ICmsAppContentPageProps) {
    const { permissionChecker } = useAuth();
    const canExport = permissionChecker?.canReadPages() ?? false;
    const { data: app, isLoading, error } = useCmsAppBySlugQuery(slug);
    const [exportError, setExportError] = useState<string | null>(null);
    const [exporting, setExporting] = useState(false);

    const listPage = useMemo(
        () => app?.pages?.find((page) => page.cms_app_role === 'cms_list'),
        [app?.pages],
    );
    const formPage = useMemo(
        () => app?.pages?.find((page) => page.cms_app_role === 'form'),
        [app?.pages],
    );

    /** Prefer explicit form create URL; fall back to cms_list sibling `/form`. */
    const formCreatePublicUrl = formPage?.url
        ? (formPage.url.includes('{record_id}')
            ? formPage.url.replace(/\{record_id\}/g, 'form').replace(/\/form\/form$/, '/form')
            : formPage.url)
        : null;

    const formEditPublicUrlTemplate = (() => {
        if (!formPage?.url) return null;
        if (formPage.url.includes('{record_id}')) {
            return formPage.url;
        }
        if (formPage.url.endsWith('/form')) {
            return `${formPage.url.slice(0, -'/form'.length)}/{record_id}`;
        }
        return `${formPage.url}/{record_id}`;
    })();

    const handleExport = useCallback(async () => {
        if (!app?.pages?.length) return;
        setExporting(true);
        setExportError(null);
        try {
            const pageIds = app.pages.map((page) => page.page_id);
            const bundle = await AdminApi.exportPages(pageIds);
            const blob = new Blob([JSON.stringify(bundle, null, 2)], {
                type: 'application/json',
            });
            const href = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = href;
            anchor.download = `${app.slug || 'cms-app'}.bundle.json`;
            anchor.click();
            URL.revokeObjectURL(href);
        } catch (err) {
            setExportError(parseApiError(err).errorMessage || 'Export failed');
        } finally {
            setExporting(false);
        }
    }, [app]);

    if (isLoading) {
        return (
            <Center h={280}>
                <Loader />
            </Center>
        );
    }

    if (error || !app) {
        return (
            <Alert color="red" title="CMS app not found">
                {error instanceof Error ? error.message : 'Could not load this CMS app.'}
            </Alert>
        );
    }

    if (!listPage?.keyword) {
        return (
            <Alert color="yellow" title="No CMS list page">
                Assign a page with role <code>cms_list</code> (or run Scaffold) before managing
                content.
            </Alert>
        );
    }

    return (
        <Stack gap="sm">
            {exportError && (
                <Alert color="red" title="Export failed" onClose={() => setExportError(null)} withCloseButton>
                    {exportError}
                </Alert>
            )}
            <CmsAppContentHost
                slug={app.slug}
                appName={app.name}
                listKeyword={listPage.keyword}
                formCreatePublicUrl={formCreatePublicUrl}
                formEditPublicUrlTemplate={formEditPublicUrlTemplate}
                canExport={canExport && !exporting}
                onExport={() => {
                    void handleExport();
                }}
            />
        </Stack>
    );
}
