/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

/** Localized label for the header nav overflow control ("More" menu). */
const NAV_MORE_LABEL_BY_LOCALE: Record<string, string> = {
    'de-CH': 'Mehr',
    'de-DE': 'Mehr',
    'en-GB': 'More',
    'en-US': 'More',
    'fr-CH': 'Plus',
    'fr-FR': 'Plus',
    'it-CH': 'Altro',
    'it-IT': 'Altro',
};

const DEFAULT_NAV_MORE_LABEL = NAV_MORE_LABEL_BY_LOCALE['en-GB'];

/**
 * Resolve the overflow-menu label for the active content locale.
 * Falls back from full locale (`de-CH`) to language prefix (`de`), then English.
 */
export function resolveNavMoreLabel(locale: string | null | undefined): string {
    if (!locale) {
        return DEFAULT_NAV_MORE_LABEL;
    }

    const exact = NAV_MORE_LABEL_BY_LOCALE[locale];
    if (exact) {
        return exact;
    }

    const prefix = locale.split('-')[0]?.toLowerCase();
    if (prefix) {
        const byPrefix = Object.entries(NAV_MORE_LABEL_BY_LOCALE).find(([key]) =>
            key.toLowerCase().startsWith(`${prefix}-`),
        );
        if (byPrefix) {
            return byPrefix[1];
        }
    }

    return DEFAULT_NAV_MORE_LABEL;
}
