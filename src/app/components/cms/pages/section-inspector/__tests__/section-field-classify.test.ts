/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Unit coverage for the section-inspector field classifier — the contract that
 * drives the Web / Mobile / Properties cards and cross-platform
 * validation. Grouping is driven ONLY by the backend-emitted field `scope`
 * (mobile rendering plan, section 6.4); this suite pins that contract, including
 * the failure when a field arrives without a valid scope.
 */
import { describe, it, expect } from 'vitest';
import {
    classifySectionField,
    fieldsInBucket,
    isFieldScope,
    isPlatformCardVisible,
    offPlatformFieldsWithValues,
    resolveFieldScope,
    type TFieldScope,
} from '../section-field-classify';

const f = (name: string, scope: TFieldScope) => ({ name, scope });

describe('classifySectionField (backend scope only)', () => {
    it('maps content scope to the Content card and common scope to the Properties card', () => {
        expect(classifySectionField(f('label', 'content'))).toBe('content');
        expect(classifySectionField(f('value', 'common'))).toBe('property');
        expect(classifySectionField(f('disabled', 'common'))).toBe('property');
    });

    it('classifies portable presentation (common scope) into the Properties card', () => {
        expect(classifySectionField(f('size', 'common'))).toBe('property');
        expect(classifySectionField(f('color', 'common'))).toBe('property');
        expect(classifySectionField(f('spacing', 'common'))).toBe('property');
    });

    it('classifies web and mobile scope into their platform cards', () => {
        expect(classifySectionField(f('web_variant', 'web'))).toBe('web');
        expect(classifySectionField(f('web_mantine_color', 'web'))).toBe('web');
        expect(classifySectionField(f('mobile_variant', 'mobile'))).toBe('mobile');
        expect(classifySectionField(f('mobile_keyboard_type', 'mobile'))).toBe('mobile');
    });

    it('relies on scope, not the field name or display flag', () => {
        // A field literally named with a web_ prefix but classified content by the
        // backend must group as content — proving no name-based inference remains.
        expect(classifySectionField({ name: 'web_card_shadow', scope: 'content' })).toBe('content');
        // display is never consulted: a common-scoped field stays a Property even
        // if a (legacy) display flag is attached to the object.
        expect(classifySectionField({ name: 'value', display: true, scope: 'common' })).toBe('property');
    });

    it('treats an absent or invalid scope as a contract error (dev/test)', () => {
        expect(() => classifySectionField({ name: 'mystery' })).toThrow(/missing a valid backend scope/);
        expect(() =>
            classifySectionField({ name: 'mystery', scope: 'bogus' }),
        ).toThrow(/missing a valid backend scope/);
    });
});

describe('isFieldScope / resolveFieldScope', () => {
    it('accepts only the four backend scopes', () => {
        for (const s of ['content', 'common', 'web', 'mobile']) expect(isFieldScope(s)).toBe(true);
        for (const s of ['', 'shared', 'property', 'global', 'pro', null, undefined, 3]) expect(isFieldScope(s)).toBe(false);
    });

    it('returns the valid scope and throws on an invalid one in test mode', () => {
        expect(resolveFieldScope({ name: 'x', scope: 'mobile' })).toBe('mobile');
        expect(() => resolveFieldScope({ name: 'x' })).toThrow();
    });
});

describe('fieldsInBucket (save shape)', () => {
    it('partitions fields into the expected buckets by scope', () => {
        const fields = [
            f('label', 'content'),
            f('size', 'common'),
            f('value', 'common'),
            f('web_card_shadow', 'web'),
            f('mobile_variant', 'mobile'),
        ];
        expect(fieldsInBucket(fields, 'content').map((x) => x.name)).toEqual(['label']);
        expect(fieldsInBucket(fields, 'property').map((x) => x.name)).toEqual(['size', 'value']);
        expect(fieldsInBucket(fields, 'web').map((x) => x.name)).toEqual(['web_card_shadow']);
        expect(fieldsInBucket(fields, 'mobile').map((x) => x.name)).toEqual(['mobile_variant']);
    });
});

describe('isPlatformCardVisible', () => {
    it('hides the Mobile card on web-only styles and shows it on mobile/both', () => {
        expect(isPlatformCardVisible('mobile', 'web')).toBe(false);
        expect(isPlatformCardVisible('mobile', 'mobile')).toBe(true);
        expect(isPlatformCardVisible('mobile', 'both')).toBe(true);
    });

    it('hides the Web card on mobile-only styles and shows it on web/both', () => {
        expect(isPlatformCardVisible('web', 'mobile')).toBe(false);
        expect(isPlatformCardVisible('web', 'web')).toBe(true);
        expect(isPlatformCardVisible('web', 'both')).toBe(true);
    });
});

describe('offPlatformFieldsWithValues (cross-platform validation)', () => {
    const fields = [f('web_card_shadow', 'web'), f('mobile_variant', 'mobile'), f('size', 'common')];

    it('flags mobile-scoped values set on a web-only style', () => {
        expect(offPlatformFieldsWithValues(fields, { mobile_variant: 'ghost' }, 'web')).toEqual(['mobile_variant']);
    });

    it('flags web-scoped values set on a mobile-only style', () => {
        expect(offPlatformFieldsWithValues(fields, { web_card_shadow: 'sm' }, 'mobile')).toEqual(['web_card_shadow']);
    });

    it('ignores empty / false / missing off-platform values', () => {
        expect(offPlatformFieldsWithValues(fields, { mobile_variant: '' }, 'web')).toEqual([]);
        expect(offPlatformFieldsWithValues(fields, { mobile_variant: false }, 'web')).toEqual([]);
        expect(offPlatformFieldsWithValues(fields, {}, 'web')).toEqual([]);
    });

    it('never flags drift for both-platform styles', () => {
        expect(offPlatformFieldsWithValues(fields, { web_card_shadow: 'sm', mobile_variant: 'ghost' }, 'both')).toEqual([]);
    });
});
