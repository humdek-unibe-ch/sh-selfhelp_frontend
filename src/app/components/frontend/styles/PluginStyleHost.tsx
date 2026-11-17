/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React from 'react';
import { usePageContentValue } from '../../../../hooks/usePageContentValue';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { usePageModal } from '../../contexts/PageModalContext';
import { usePreviewMode } from '../../contexts/PreviewModeContext';

/** Mirrors `IPluginStylePage` of the plugin SDK (`@selfhelp/shared` > 1.24.0). */
interface IPluginStylePage {
    id: number | null;
    languageId: number | null;
    preview: boolean;
    routeParams: Record<string, string>;
}

/** Mirrors `IPluginStyleProps` of the plugin SDK. */
export interface IPluginStyleProps {
    style: Record<string, unknown>;
    styleProps: Record<string, string>;
    cssClass: string;
    parentActive?: number;
    childIndex?: number;
    parentColor?: string;
    pageModal: { inModal: boolean; closeModal: () => void };
    page: IPluginStylePage;
}

type TPluginStyleHostProps = Omit<IPluginStyleProps, 'pageModal' | 'page'> & {
    component: React.ComponentType<IPluginStyleProps>;
};

const NO_ROUTE_PARAMS: Record<string, string> = {};

/**
 * Draws a plugin style with what the host knows about its place: the popup the
 * page is shown in (`pageModal`, like the core form's `close_modal_on_save`)
 * and the page itself (`page`), which the plugin names in its calls so the
 * server checks access and reads the section's settings (rule 7.7). Only plugin
 * sections render this, so core sections pay for none of these hooks.
 */
export default function PluginStyleHost({ component: Component, ...props }: TPluginStyleHostProps): React.ReactElement {
    const pageModal = usePageModal();
    const pageContent = usePageContentValue();
    const { currentLanguageId } = useLanguageContext();
    const { isPreviewMode } = usePreviewMode();

    const pageId = pageContent?.id ?? null;
    const routeParams = pageContent?.route_params ?? NO_ROUTE_PARAMS;
    const page = React.useMemo<IPluginStylePage>(
        () => ({ id: pageId, languageId: currentLanguageId, preview: isPreviewMode, routeParams }),
        [pageId, currentLanguageId, isPreviewMode, routeParams],
    );

    return <Component {...props} pageModal={pageModal} page={page} />;
}
