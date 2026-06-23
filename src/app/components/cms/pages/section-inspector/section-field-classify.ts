/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Pure field-classification helpers for the section inspector.
 *
 * The inspector groups a style's fields into platform-aware cards driven ONLY by
 * the backend-emitted field `scope` (mobile rendering plan, section 6.4):
 *   - Content    (scope `content` — translatable copy, display=1)
 *   - Properties (scope `common`  — cross-platform behavior/data + portable
 *                  presentation the shared mapper consumes, display=0)
 *   - Web        (scope `web`     — Mantine/web-only)   — only on web / both styles
 *   - Mobile     (scope `mobile`  — HeroUI/native-only) — only on mobile / both styles
 *
 * The backend is the single source of truth for scope. This module never
 * re-derives scope from the field name (no `startsWith('web_')`, no hard-coded
 * shared-semantic allowlist) and never from the `display` flag: grouping uses
 * `field.scope` exclusively, and an absent/invalid scope is a contract error in
 * development and tests.
 *
 * Section-global fields (condition / css / css_mobile / data_config / debug) are
 * Section-entity columns returned separately as `global_fields`; they are not
 * part of the per-style `fields` array and are not classified here.
 */
import type { TStylePlatform } from '@selfhelp/shared/registry';

/** Backend field scope contract (mobile rendering plan, section 6.4). */
export const FIELD_SCOPES = ['content', 'common', 'web', 'mobile'] as const;
export type TFieldScope = (typeof FIELD_SCOPES)[number];

/**
 * Inspector card a field renders in. `property` is the "Properties" card, fed by
 * the backend `common` scope. The card label set is intentionally 1:1 with the
 * four scopes (content/common/web/mobile).
 */
export type TFieldBucket = 'content' | 'web' | 'mobile' | 'property';

interface IClassifiableField {
    name: string;
    /**
     * Translatability flag from the backend. Retained on the field shape (the
     * Content card uses it for per-language rendering) but NEVER used for
     * grouping — classification is scope-only by contract.
     */
    display?: boolean;
    /** Backend-derived scope; required by contract, optional in the type for cache tolerance. */
    scope?: string | null;
}

/** Type guard for the backend field scope enum. */
export function isFieldScope(value: unknown): value is TFieldScope {
    return typeof value === 'string' && (FIELD_SCOPES as readonly string[]).includes(value);
}

/**
 * Resolve a field's backend scope. The backend MUST emit a valid scope for every
 * field; an absent/invalid scope is a contract break. In development and tests we
 * fail loudly so backend-shaped fixtures stay honest; in production we log a
 * diagnostic and fall back to `content` (never guessing from the field name).
 */
export function resolveFieldScope(field: IClassifiableField): TFieldScope {
    if (isFieldScope(field.scope)) return field.scope;

    const message =
        `Section field "${field.name}" is missing a valid backend scope (got ${String(field.scope)}). ` +
        `The CMS groups by backend fieldMeta.scope and must not infer scope from the field name.`;
    if (process.env.NODE_ENV !== 'production') {
        throw new Error(message);
    }
    console.error(`[section-inspector] ${message}`);
    return 'content';
}

/** Classify a single field into its inspector bucket, using backend scope only. */
export function classifySectionField(field: IClassifiableField): TFieldBucket {
    const scope = resolveFieldScope(field);
    switch (scope) {
        case 'web':
            return 'web';
        case 'mobile':
            return 'mobile';
        case 'common':
            // Cross-platform behavior/data properties (display=0, unprefixed).
            return 'property';
        case 'content':
        default:
            // Translatable authored copy (display=1) — rendered per language.
            return 'content';
    }
}

/** Filter helper: all fields in a given bucket. */
export function fieldsInBucket<T extends IClassifiableField>(fields: T[], bucket: TFieldBucket): T[] {
    return fields.filter((f) => classifySectionField(f) === bucket);
}

/**
 * Whether a platform-specific card may be shown for a style on `stylePlatform`.
 * Web card hides on mobile-only styles; Mobile card hides on web-only styles.
 */
export function isPlatformCardVisible(card: 'web' | 'mobile', stylePlatform: TStylePlatform): boolean {
    if (card === 'web') return stylePlatform === 'web' || stylePlatform === 'both';
    return stylePlatform === 'mobile' || stylePlatform === 'both';
}

/**
 * Cross-platform validation: returns the names of off-platform fields that
 * carry a non-empty value (data drift). On a web-only style, any `mobile`-scoped
 * value is off-platform; on a mobile-only style, any `web`-scoped value is. These
 * values are ignored by the renderer and should be flagged to the author.
 */
export function offPlatformFieldsWithValues(
    fields: IClassifiableField[],
    properties: Record<string, unknown>,
    stylePlatform: TStylePlatform,
): string[] {
    const hidden: TFieldBucket | null =
        stylePlatform === 'web' ? 'mobile' : stylePlatform === 'mobile' ? 'web' : null;
    if (!hidden) return [];

    return fields
        .filter((f) => classifySectionField(f) === hidden)
        .filter((f) => {
            const v = properties[f.name];
            return v !== undefined && v !== null && v !== '' && v !== false;
        })
        .map((f) => f.name);
}
