/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * CMS platform-targeting helpers for the style picker.
 *
 * A style's render target is taken from the backend catalog (`IStyle.renderTarget`,
 * the `styleRenderTargets` lookup) when present — the installed catalog is
 * authoritative and may differ from the app build. When the backend value is
 * absent the shared registry (`@selfhelp/shared`) default applies, so existing
 * styles keep showing everywhere.
 */
import {
    getStylePlatforms,
    isStyleAllowedOnPage,
    isStyleSupportedOnPlatform,
    setToStylePlatform,
    type TConcretePlatform,
    type TStylePlatform,
} from '@selfhelp/shared/registry';
import { type IStyle } from '../types/responses/admin/styles.types';

/** Resolve the render target (`web` | `mobile` | `both`) of a style. */
export function getStylePlatform(style: IStyle): TStylePlatform {
    if (style.renderTarget) return style.renderTarget;
    return setToStylePlatform(getStylePlatforms(style.name));
}

/**
 * Resolve the CMS platform target of a style by its registry name. Used by the
 * section inspector, which only has the style name (not the full catalog item).
 */
export function getStylePlatformByName(name: string): TStylePlatform {
    return setToStylePlatform(getStylePlatforms(name));
}

/**
 * Coerce a page access-type lookup code (`web` | `mobile` | `mobile_and_web`)
 * into the picker's platform target. `mobile_and_web` (and any other/absent
 * code) maps to `both`.
 */
export function toPagePlatform(lookupCode: string | null | undefined): TStylePlatform {
    return lookupCode === 'web' || lookupCode === 'mobile' ? lookupCode : 'both';
}

/** Whether a style may be placed on a page that targets `pagePlatform`. */
export function isStyleOnPagePlatform(style: IStyle, pagePlatform: TStylePlatform): boolean {
    if (style.renderTarget) {
        if (pagePlatform === 'both' || style.renderTarget === 'both') return true;
        return style.renderTarget === pagePlatform;
    }
    return isStyleAllowedOnPage(style.name, pagePlatform);
}

/** Whether a style supports a single concrete platform (for the manual filter). */
export function isStyleOnPlatform(style: IStyle, platform: TConcretePlatform): boolean {
    if (style.renderTarget) return style.renderTarget === 'both' || style.renderTarget === platform;
    return isStyleSupportedOnPlatform(style.name, platform);
}

/** Visual treatment for a platform badge in the picker / inspector. */
export const PLATFORM_BADGE: Record<TStylePlatform, { label: string; color: string }> = {
    web: { label: 'Web', color: 'indigo' },
    mobile: { label: 'Mobile', color: 'teal' },
    both: { label: 'Web + Mobile', color: 'gray' },
};

/** Manual platform filter values for the add-section picker. */
export type TPlatformFilter = 'all' | TConcretePlatform;
