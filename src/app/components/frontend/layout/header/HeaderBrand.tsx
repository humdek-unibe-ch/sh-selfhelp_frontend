/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Image, Text } from '@mantine/core';
import type { INavigationBranding } from '@selfhelp/shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { InternalLink } from '../../../shared';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';

interface IHeaderBrandProps {
    /** Server-resolved branding for first paint (avoids logo flash). */
    initialBranding?: INavigationBranding | null;
    /** Logo image height in px (header row height minus padding). */
    height?: number;
}

/**
 * Global brand slot in the web header (and live-preview chrome).
 *
 * Renders the logo image configured in Navigation → Settings → Branding,
 * falling back to a text logo (`logo_alt`, default "Your Logo"). Clicking it
 * navigates to the configured link page (default home). Uses `InternalLink`
 * so navigation stays preview-aware inside the CMS Live Preview pane.
 */
export function HeaderBrand({ initialBranding = null, height = 36 }: IHeaderBrandProps) {
    const { navigation } = useAppNavigation();
    const branding = navigation?.branding ?? initialBranding;

    const href = branding?.link_url && branding.link_url.trim() !== '' ? branding.link_url : '/';
    const alt = branding?.logo_alt && branding.logo_alt.trim() !== '' ? branding.logo_alt : 'Your Logo';

    return (
        <InternalLink
            href={href}
            aria-label={alt}
            style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
            }}
        >
            {branding?.logo_url ? (
                <Image
                    src={getAssetUrl(branding.logo_url)}
                    alt={alt}
                    h={height}
                    w="auto"
                    fit="contain"
                    style={{ maxWidth: 180 }}
                />
            ) : (
                <Text size="xl" fw={700} c="blue" style={{ whiteSpace: 'nowrap' }}>
                    {alt}
                </Text>
            )}
        </InternalLink>
    );
}
