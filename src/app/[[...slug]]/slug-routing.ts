/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

const HOME_KEYWORD = 'home';

const STATIC_FALLBACK_BY_KEYWORD: Record<string, string> = {
    login: '/auth/login',
    'two-factor-authentication': '/auth/two-factor-authentication',
    profile: '/auth/profile',
    register: '/auth/register',
    reset_password: '/auth/reset-password',
    no_access: '/auth/no-access',
    no_access_guest: '/auth/no-access-guest',
    missing: '/auth/missing',
};

const SLUG_TO_KEYWORD: Record<string, string> = {
    'no-access': 'no_access',
    'no-access-guest': 'no_access_guest',
    reset: 'reset_password',
};

export function keywordFromSlug(slug: string[] | undefined): string {
    if (!slug || slug.length === 0) return HOME_KEYWORD;

    if (slug[0] === 'validate' && slug.length === 3) {
        return 'validate';
    }

    if (slug[0] === 'reset' && (slug.length === 1 || slug.length === 3)) {
        return 'reset_password';
    }

    const joined = slug.join('/');
    return SLUG_TO_KEYWORD[joined] ?? joined;
}

export function buildStaticFallbackPath(keyword: string, slug: string[] | undefined): string | null {
    const basePath = STATIC_FALLBACK_BY_KEYWORD[keyword];
    if (!basePath) {
        return null;
    }

    if (keyword === 'reset_password' && Array.isArray(slug) && slug[0] === 'reset' && slug.length === 3) {
        const suffix = slug.slice(1).map(encodeURIComponent).join('/');
        return `${basePath}/${suffix}`;
    }

    return basePath;
}
