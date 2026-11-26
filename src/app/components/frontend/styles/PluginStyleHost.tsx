/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import React from 'react';
import type { IPluginStylePage, IPluginStyleProps } from '@selfhelp/shared/plugin-sdk';
import { usePageContentValue } from '../../../../hooks/usePageContentValue';
import { useLanguageContext } from '../../contexts/LanguageContext';
import { usePageModal } from '../../contexts/PageModalContext';
import { usePreviewMode } from '../../contexts/PreviewModeContext';

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
