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
import { Box, Container, Divider, Group, Stack, Text } from '@mantine/core';
import { isDoubleWebHeaderPreset, resolveWebHeaderPreset } from '@selfhelp/shared';
import DynamicPageClient from '../../../[[...slug]]/DynamicPageClient';
import { WebsiteHeaderLayout } from '../../frontend/layout/header/WebsiteHeaderLayout';
import { FooterLinks } from '../../frontend/layout/footer/FooterLinks';
import { PreviewModeIndicator } from '../../shared/common/PreviewModeIndicator';
import { usePreviewMode } from '../../contexts/PreviewModeContext';
import { useAppNavigation } from '../../../../hooks/useAppNavigation';
import { PreviewNavigationProvider } from './PreviewNavigationContext';

/** Single-row header height — mirrors `SlugShell`. */
const HEADER_HEIGHT = 60;
/** Two-row height for the double presets — mirrors `SlugShell`. */
const DOUBLE_HEADER_HEIGHT = 104;

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
    const { routes, footerMenu, headerMenu } = useAppNavigation();

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
    const headerHeight = isDouble ? DOUBLE_HEADER_HEIGHT : HEADER_HEIGHT;

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
                        <WebsiteHeaderLayout initialHeaderMenu={headerMenu} />
                    </Box>
                )}

                {/* Scrolling page body + footer (footer scrolls with content, as on
                    the real site) */}
                <Box style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                    {isPreviewMode && <PreviewModeIndicator />}

                    <DynamicPageClient keyword={effectiveKeyword} initialPageId={pageId} />

                    {!isHeadless && (footerMenu?.items?.length ?? 0) > 0 && (
                        <Box
                            component="footer"
                            w="100%"
                            py="xl"
                            mt="xl"
                            style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
                        >
                            <Container size="xl">
                                <Stack gap="lg">
                                    <Group justify="center" gap="xl">
                                        <FooterLinks footerMenu={footerMenu} />
                                    </Group>
                                    <Divider />
                                    <Text size="sm" c="dimmed" ta="center">
                                        © {new Date().getFullYear()} SelfHelp. All rights reserved.
                                    </Text>
                                </Stack>
                            </Container>
                        </Box>
                    )}
                </Box>
            </Box>
        </PreviewNavigationProvider>
    );
}
