/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * LivePreviewWebPane — the web (desktop) half of the CMS Live Preview,
 * rendered **inline** (no iframe).
 *
 * It reuses the real public renderer (`DynamicPageClient`) plus a client
 * composition of the real website chrome (header menu + the in-app
 * theme/language/profile controls + footer links), so the editor sees the page
 * exactly as a visitor would — including header/footer — and can browse every
 * page. All navigation inside the pane is intercepted via
 * `PreviewNavigationProvider`: links/buttons call `onNavigate(path)` instead of
 * routing the admin app, so the shell can keep the keyword, the mobile frame,
 * and the master URL in sync.
 *
 * Draft vs published and the active language come from the global
 * `PreviewModeContext` / `LanguageContext` (the same ones the public site uses),
 * so the toolbar Draft switch and the in-pane language selector drive it
 * directly.
 *
 * @module components/cms/live-preview/LivePreviewWebPane
 */

import { useMemo } from 'react';
import { Box, Container } from '@mantine/core';
import { isDoubleWebHeaderPreset, resolveWebHeaderPreset } from '@selfhelp/shared';
import DynamicPageClient from '../../../[[...slug]]/DynamicPageClient';
import slugLayoutStyles from '../../../[[...slug]]/SlugLayout/SlugLayout.module.css';
import { WebsiteHeaderLayout } from '../../frontend/layout/header/WebsiteHeaderLayout';
import { FooterLinks } from '../../frontend/layout/footer/FooterLinks';
import footerStyles from '../../frontend/layout/footer/WebsiteFooter.module.css';
import { PreviewModeIndicator } from '../../shared/common/PreviewModeIndicator';
import { usePreviewMode } from '../../contexts/PreviewModeContext';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { PreviewNavigationProvider } from './PreviewNavigationContext';
import { resolveWebHeaderHeight } from '../../frontend/layout/header/headerLayout.utils';

/** Backend keyword used for the landing page (matches the public slug route). */
const HOME_KEYWORD = 'home';

interface ILivePreviewWebPaneProps {
    /** The synced preview keyword (`null` → home). */
    keyword: string | null;
    /** Called when an in-pane link/button navigates (origin-stripped path). */
    onNavigate: (path: string) => void;
}

export function LivePreviewWebPane({ keyword, onNavigate }: ILivePreviewWebPaneProps) {
    const { isPreviewMode } = usePreviewMode();
    const { routes, footerMenu, headerMenu, navigation, profilePages } = useAppNavigation();

    const effectiveKeyword = keyword && keyword.trim() ? keyword.trim().replace(/^\/+/, '') : HOME_KEYWORD;

    // Resolve the page from the already-cached nav list so child styles that
    // read content via `PageContext` have it immediately (no extra fetch).
    const previewPage = useMemo(
        () => routes.find((p) => p.keyword === effectiveKeyword) ?? null,
        [routes, effectiveKeyword],
    );
    const pageId = previewPage?.id_pages ?? 0;
    // Headless pages hide the site chrome on the real site — mirror that here.
    const isHeadless = Boolean(previewPage?.is_headless);

    // Double presets render two header rows, exactly like `SlugShell`.
    const isDouble = isDoubleWebHeaderPreset(resolveWebHeaderPreset(headerMenu?.preset));
    const headerHeight = resolveWebHeaderHeight(isDouble, navigation?.branding);

    const navValue = useMemo(() => ({ navigate: onNavigate }), [onNavigate]);

    return (
        <PreviewNavigationProvider value={navValue}>
            <Box
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--mantine-color-body)',
                    border: '1px solid var(--mantine-color-default-border)',
                    borderRadius: 'var(--mantine-radius-md)',
                    overflow: 'hidden',
                }}
            >
                {/* Website header — the REAL site header component, so the
                    preview chrome matches production exactly (branding, single
                    and double presets, utility cluster). Hidden on headless
                    pages, mirroring `SlugShell`. */}
                {!isHeadless && (
                    <Box
                        style={{
                            flex: '0 0 auto',
                            height: headerHeight,
                            borderBottom: '1px solid var(--mantine-color-default-border)',
                            background: 'var(--mantine-color-body)',
                        }}
                    >
                        <WebsiteHeaderLayout
                            initialHeaderMenu={headerMenu}
                            initialNavigation={navigation}
                            initialBranding={navigation?.branding ?? null}
                            initialProfilePages={profilePages}
                        />
                    </Box>
                )}

                {/* Page body + sticky footer — mirrors `SlugShell` so short pages
                    keep the footer at the bottom of the preview pane. */}
                <Box
                    style={{
                        flex: 1,
                        minHeight: 0,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div className={slugLayoutStyles.contentArea}>
                        {isPreviewMode && <PreviewModeIndicator />}

                        <DynamicPageClient keyword={effectiveKeyword} initialPageId={pageId} />
                    </div>

                    {!isHeadless && (footerMenu?.items?.length ?? 0) > 0 && (
                        <div className={slugLayoutStyles.footerWrapper}>
                            <Box
                                component="footer"
                                w="100%"
                                py={{ base: 'lg', sm: 'xl' }}
                                mt="xl"
                                className={footerStyles.footer}
                            >
                                <Container size="xl">
                                    <FooterLinks footerMenu={footerMenu} />
                                </Container>
                            </Box>
                        </div>
                    )}
                </Box>
            </Box>
        </PreviewNavigationProvider>
    );
}
