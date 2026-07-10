/*

SPDX-FileCopyrightText: 2026 Humdek, University of Bern

SPDX-License-Identifier: MPL-2.0

*/

'use client';



import { useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Center, Loader, Stack, Text, Title, Group, Button, Badge, Code, Modal, Paper } from '@mantine/core';

import { IconArrowLeft, IconSettings, IconDownload } from '@tabler/icons-react';

import Link from 'next/link';

import { usePathname } from 'next/navigation';

import { CmsAppPageEditorButton } from './CmsAppPageEditorButton';

import { usePageContentByKeyword } from '../../../../hooks/usePageContentByKeyword';

import { usePageContentByPath } from '../../../../hooks/usePageContentByPath';

import { useLanguageContext } from '../../contexts/LanguageContext';

import { PageContextProvider } from '../../contexts/PageContext';

import { PageModalProvider } from '../../contexts/PageModalContext';

import { PageContentRenderer } from '../../frontend/content/PageContentRenderer';

import { AdminPageContainer } from '../../shared/common/AdminPageContainer';

import { stripHtmlTags } from '../../../../utils/html-sanitizer.utils';

import { type TStyle } from '../../../../types/common/styles.types';

import {

    cmsAppConfigPath,

    cmsAppContentFormPath,

    cmsAppContentPath,

    cmsAppContentRecordPath,

} from './cmsAppPages.utils';

import { CmsAppAdminNavContext, type TCmsAppFormMode } from './CmsAppAdminNavContext';



interface ICmsAppContentHostProps {

    slug: string;

    appName: string;

    listKeyword: string;

    /** CMS list page keyword for the page-sections editor shortcut. */
    listPageKeyword: string;

    /** CMS form page keyword for the modal page-sections editor shortcut. */
    formPageKeyword: string | null;

    canOpenPageEditor?: boolean;

    /** Public create URL of the form page (for API resolve), e.g. `/demo-…/cms/team-members/form`. */

    formCreatePublicUrl: string | null;

    /**

     * Public edit URL template with `{record_id}`, e.g.

     * `/demo-…/cms/team-members/{record_id}`.

     */

    formEditPublicUrlTemplate: string | null;

    canExport?: boolean;

    onExport?: () => void;

}



function substituteRecordId(template: string, recordId: string): string {

    return template.replace(/\{record_id\}/g, recordId);

}



function deriveFormStateFromPathname(pathname: string): { formMode: TCmsAppFormMode; recordId: string | null } {

    if (pathname.endsWith('/form')) {

        return { formMode: 'create', recordId: null };

    }

    const match = pathname.match(/\/content\/(\d+)(?:\/)?$/);

    if (match) {

        return { formMode: 'edit', recordId: match[1] };

    }

    return { formMode: 'list', recordId: null };

}



export function CmsAppContentHost({

    slug,

    appName,

    listKeyword,

    listPageKeyword,

    formPageKeyword,

    canOpenPageEditor = false,

    formCreatePublicUrl,

    formEditPublicUrlTemplate,

    onExport,

    canExport = false,

}: ICmsAppContentHostProps) {

    const pathname = usePathname();

    const { currentLanguageId } = useLanguageContext();

    const [previewLanguageId, setPreviewLanguageId] = useState<number | null>(null);



    const urlFormState = useMemo(() => deriveFormStateFromPathname(pathname), [pathname]);

    const [clientModalState, setClientModalState] = useState<{
        formMode: TCmsAppFormMode;
        recordId: string | null;
    } | null>(null);

    const formMode = clientModalState?.formMode ?? urlFormState.formMode;
    const recordId = clientModalState?.recordId ?? urlFormState.recordId;

    useEffect(() => {
        // Real Next.js navigations (back/forward, direct load) reset client overrides.
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reconcile modal with route segment
        setClientModalState(null);
    }, [pathname]);



    const listLanguageId = previewLanguageId ?? currentLanguageId;



    const listQuery = usePageContentByKeyword(listKeyword, {

        enabled: Boolean(listKeyword),

        languageId: listLanguageId,

    });



    const formPublicPath = useMemo(() => {

        if (formMode === 'create' && formCreatePublicUrl) {

            return formCreatePublicUrl;

        }

        if (formMode === 'edit' && formEditPublicUrlTemplate && recordId) {

            return substituteRecordId(formEditPublicUrlTemplate, recordId);

        }

        return '';

    }, [formMode, formCreatePublicUrl, formEditPublicUrlTemplate, recordId]);



    const formQuery = usePageContentByPath(formPublicPath, {

        enabled: formMode !== 'list' && Boolean(formPublicPath),

        languageId: currentLanguageId,

        keepPreviousData: false,

    });



    const listContent = listQuery.content;

    const formContent = formQuery.content;



    const syncUrl = useCallback((nextPath: string) => {

        if (typeof window !== 'undefined' && window.location.pathname !== nextPath) {

            window.history.replaceState(window.history.state, '', nextPath);

        }

    }, []);



    const closeForm = useCallback(() => {
        setClientModalState({ formMode: 'list', recordId: null });
        syncUrl(cmsAppContentPath(slug));
    }, [slug, syncUrl]);

    const openCreateForm = useCallback(() => {
        setClientModalState({ formMode: 'create', recordId: null });
        syncUrl(cmsAppContentFormPath(slug));
    }, [slug, syncUrl]);

    const openEditForm = useCallback((id: string | number) => {
        const nextId = String(id);
        setClientModalState({ formMode: 'edit', recordId: nextId });
        syncUrl(cmsAppContentRecordPath(slug, nextId));
    }, [slug, syncUrl]);



    const modalOpen = formMode !== 'list';



    const navValue = useMemo(

        () => ({

            appSlug: slug,

            contentBasePath: cmsAppContentPath(slug),

            formCreatePath: cmsAppContentFormPath(slug),

            formEditPath: (id: string | number) => cmsAppContentRecordPath(slug, id),

            isAdminHost: true as const,

            formMode,

            openCreateForm,

            openEditForm,

            closeForm,

            previewLanguageId,

            setPreviewLanguageId,

        }),

        [

            slug,

            formMode,

            openCreateForm,

            openEditForm,

            closeForm,

            previewLanguageId,

        ],

    );



    if (listQuery.isLoading && !listContent) {

        return (

            <AdminPageContainer>

                <Center h={280}>

                    <Loader />

                </Center>

            </AdminPageContainer>

        );

    }



    if (!listContent) {

        return (

            <AdminPageContainer>

                <Alert color="red" title="CMS list unavailable">

                    Could not load the CMS list page for this app. Check that a page with role{' '}

                    <Code>cms_list</Code> is assigned.

                </Alert>

            </AdminPageContainer>

        );

    }



    const listSections = (listContent.sections ?? []) as unknown as TStyle[];

    const formTitle = stripHtmlTags(

        formContent?.title ?? (formMode === 'edit' ? 'Edit record' : 'Add record'),

    );

    const formSections = (formContent?.sections ?? []) as unknown as TStyle[];

    const formRouteParams = formContent?.route_params;



    return (

        <CmsAppAdminNavContext.Provider value={navValue}>

            <AdminPageContainer>

                <Stack gap="md">

                    <Group justify="space-between" align="flex-start" wrap="wrap">

                        <Group gap="sm">

                            <Button

                                component={Link}

                                href="/admin/cms-apps"

                                variant="subtle"

                                leftSection={<IconArrowLeft size="1rem" />}

                            >

                                All apps

                            </Button>

                            <div>

                                <Group gap="xs">

                                    <Title order={2}>{appName}</Title>

                                    <Badge variant="light">CMS content</Badge>

                                </Group>

                                <Text size="sm" c="dimmed">

                                    Edit records here. Structure and metadata live under App configs.

                                </Text>

                            </div>

                        </Group>

                        <Group gap="xs" wrap="wrap">

                            <CmsAppPageEditorButton
                                pageKeyword={listPageKeyword}
                                canOpen={canOpenPageEditor}
                            />

                            {canExport && onExport && (

                                <Button

                                    variant="light"

                                    leftSection={<IconDownload size="1rem" />}

                                    onClick={onExport}

                                >

                                    Export app

                                </Button>

                            )}

                            <Button

                                component={Link}

                                href={cmsAppConfigPath(slug)}

                                variant="default"

                                leftSection={<IconSettings size="1rem" />}

                            >

                                App config

                            </Button>

                        </Group>

                    </Group>



                    <Paper withBorder p="md" radius="md">

                        <PageModalProvider

                            value={{

                                inModal: false,

                                closeModal: () => {},

                            }}

                        >

                            <PageContextProvider

                                keyword={listKeyword}

                                pageId={listContent.id}

                                languageId={listLanguageId}

                                path={null}

                            >

                                <PageContentRenderer sections={listSections} />

                            </PageContextProvider>

                        </PageModalProvider>

                    </Paper>



                    <PageModalProvider

                        value={{

                            inModal: modalOpen,

                            closeModal: closeForm,

                        }}

                    >

                        <Modal

                            opened={modalOpen}

                            onClose={closeForm}

                            title={(
                                <Group justify="space-between" wrap="nowrap" gap="sm" pr="md">
                                    <Text fw={600} size="lg" lineClamp={1}>
                                        {formTitle}
                                    </Text>
                                    <CmsAppPageEditorButton
                                        pageKeyword={formPageKeyword}
                                        canOpen={canOpenPageEditor}
                                        size="xs"
                                        compact
                                    />
                                </Group>
                            )}

                            size="90%"

                            centered

                            closeOnEscape

                            closeOnClickOutside

                            keepMounted={false}

                            transitionProps={{ duration: 120, transition: 'fade' }}

                            withCloseButton

                            padding="md"

                            classNames={{

                                content: 'cms-app-form-modal',

                            }}

                        >

                            {formMode === 'list' ? null : formQuery.isLoading && !formContent ? (

                                <Center h={160}>

                                    <Loader />

                                </Center>

                            ) : !formContent ? (

                                <Alert color="red" title="Form unavailable">

                                    Could not load the CMS form page for this app.

                                </Alert>

                            ) : (

                                <PageContextProvider

                                    key={formPublicPath}

                                    keyword={formContent.keyword}

                                    pageId={formContent.id}

                                    languageId={currentLanguageId}

                                    path={formPublicPath || null}

                                    routeParams={formRouteParams}

                                >

                                    <div className="cms-app-form-host min-w-0 [&_.mantine-Stack-root]:max-w-none">

                                        <PageContentRenderer sections={formSections} />

                                    </div>

                                </PageContextProvider>

                            )}

                        </Modal>

                    </PageModalProvider>

                </Stack>

            </AdminPageContainer>

        </CmsAppAdminNavContext.Provider>

    );

}

