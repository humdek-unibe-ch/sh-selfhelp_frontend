/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group, Image, Text } from '@mantine/core';
import { resolveBrandingPresentation, type INavigationBranding } from '@selfhelp/shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { InternalLink } from '../../../shared';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';

interface IHeaderBrandProps {
    /** Server-resolved branding for first paint (avoids logo flash). */
    initialBranding?: INavigationBranding | null;
    /** Cap on the logo height in px (header row height minus padding). */
    height?: number;
}

/**
 * Global brand slot in the web header (and live-preview chrome).
 *
 * Renders the logo configured in Navigation → Settings → Branding using the
 * configured size (`logo_size`) and display variant (`logo_variant`: logo +
 * name, logo only, name only), falling back to a text logo (`logo_alt`,
 * default "Your Logo"). Clicking it navigates to the configured link page
 * (default home). Uses `InternalLink` so navigation stays preview-aware
 * inside the CMS Live Preview pane.
 */
export function HeaderBrand({ initialBranding = null, height }: IHeaderBrandProps) {
    const { navigation } = useAppNavigation();
    const branding = navigation?.branding ?? initialBranding;
    const presentation = resolveBrandingPresentation(branding);

    const href = branding?.link_url && branding.link_url.trim() !== '' ? branding.link_url : '/';
    const alt = branding?.logo_alt && branding.logo_alt.trim() !== '' ? branding.logo_alt : 'Your Logo';
    // Respect the configured size but never overflow the header row when the
    // caller passes an explicit cap.
    const logoHeight = height !== undefined
        ? Math.min(presentation.logoHeight, height)
        : presentation.logoHeight;

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
            <Group gap="xs" wrap="nowrap">
                {presentation.showLogo && branding?.logo_url ? (
                    <Image
                        src={getAssetUrl(branding.logo_url)}
                        alt={alt}
                        h={logoHeight}
                        w="auto"
                        fit="contain"
                        style={{ maxWidth: 220 }}
                    />
                ) : null}
                {presentation.showName ? (
                    <Text
                        size={logoHeight >= 44 ? 'xl' : 'lg'}
                        fw={700}
                        c="blue"
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        {alt}
                    </Text>
                ) : null}
            </Group>
        </InternalLink>
    );
}
