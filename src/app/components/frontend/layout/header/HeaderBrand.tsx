/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { Group, Image, Text } from '@mantine/core';
import {
    NAVIGATION_BRANDING_LOGO_HEIGHTS,
    resolveBrandingPresentation,
    type INavigationBranding,
    type TNavigationBrandingSize,
} from '@selfhelp/shared';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import { InternalLink } from '../../../shared';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';
import classes from './HeaderBrand.module.css';

const LOGO_MAX_WIDTHS: Record<TNavigationBrandingSize, number> = {
    sm: 120,
    md: 160,
    lg: 200,
    xl: 260,
};

interface IHeaderBrandProps {
    /** Server-resolved branding for first paint (avoids logo flash). */
    initialBranding?: INavigationBranding | null;
    /** Cap on the logo height in px (header row height minus padding). */
    height?: number;
}

/**
 * Global brand slot in the web header (and live-preview chrome).
 */
export function HeaderBrand({ initialBranding = null, height }: IHeaderBrandProps) {
    const { navigation } = useAppNavigation();
    const branding = navigation?.branding ?? initialBranding;
    const presentation = resolveBrandingPresentation(branding);

    const href = branding?.link_url && branding.link_url.trim() !== '' ? branding.link_url : '/';
    const alt = branding?.logo_alt && branding.logo_alt.trim() !== '' ? branding.logo_alt : 'Your Logo';
    const configuredHeight = NAVIGATION_BRANDING_LOGO_HEIGHTS[presentation.size];
    const logoHeight = height !== undefined
        ? Math.min(presentation.logoHeight, height)
        : presentation.logoHeight;
    const logoMaxWidth = Math.round(LOGO_MAX_WIDTHS[presentation.size] * (logoHeight / configuredHeight));
    const showLogo = presentation.showLogo && Boolean(branding?.logo_url);
    const showName = presentation.showName;
    const nameOnly = showName && !showLogo;

    const brandLinkClass = [classes.brandLink, classes[`brandLinkSize${presentation.size}`]]
        .filter(Boolean)
        .join(' ');
    const brandGroupClass = [classes.brandGroup, classes[`brandGroupSize${presentation.size}`]]
        .filter(Boolean)
        .join(' ');
    const brandNameClass = [
        classes.brandName,
        showLogo ? classes.brandNameWithLogo : classes.brandNameOnly,
    ].join(' ');

    return (
        <InternalLink
            href={href}
            aria-label={alt}
            className={brandLinkClass}
        >
            <Group
                wrap="nowrap"
                className={brandGroupClass}
                data-brand-size={presentation.size}
            >
                {showLogo && branding?.logo_url ? (
                    <span className={classes.logoFrame} data-brand-size={presentation.size}>
                        <Image
                            src={getAssetUrl(branding.logo_url)}
                            alt={alt}
                            mah={logoHeight}
                            w="auto"
                            fit="contain"
                            className={classes.logoImage}
                            style={{ maxWidth: logoMaxWidth, maxHeight: logoHeight }}
                        />
                    </span>
                ) : null}
                {showName ? (
                    <Text
                        size={nameOnly
                            ? (presentation.size === 'xl' ? 'xl' : presentation.size === 'lg' ? 'lg' : 'md')
                            : (presentation.size === 'xl' ? 'lg' : presentation.size === 'lg' ? 'md' : 'sm')}
                        fw={nameOnly ? 700 : 600}
                        c={nameOnly ? 'blue' : undefined}
                        className={brandNameClass}
                        data-brand-size={presentation.size}
                    >
                        {alt}
                    </Text>
                ) : null}
            </Group>
        </InternalLink>
    );
}
