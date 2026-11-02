/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { getStyleVisual, KNOWN_STYLE_NAMES } from '../style-visuals';

// A representative slice of the catalog across every family, used to assert
// global uniqueness + valid hues without hard-coding all ~90 names.
const SAMPLE_STYLES = [
    // layout
    'container', 'box', 'paper', 'card', 'flex', 'stack', 'grid', 'group', 'divider',
    // content
    'text', 'title', 'typography', 'code', 'list', 'blockquote',
    // media
    'image', 'video', 'audio', 'carousel', 'avatar',
    // form
    'input', 'textarea', 'select', 'checkbox', 'switch', 'rating', 'file-input',
    // auth
    'login', 'register', 'reset-password', 'two-factor-auth', 'profile', 'not-found',
    // data
    'data-container', 'entry-list', 'entry-record', 'loop',
    // nav
    'link', 'button', 'tabs', 'accordion', 'timeline',
    // feedback
    'alert', 'notification', 'badge', 'progress', 'version',
];

describe('getStyleVisual', () => {
    it('resolves a known style to its icon + hue, ignoring the container hint', () => {
        // `login` is a leaf auth style: it must resolve to its own visual even if a
        // caller mislabels it as able to have children.
        const login = getStyleVisual('login', true);
        expect(login.icon).toBeDefined();
        expect(typeof login.hue).toBe('number');

        // The child hint never changes a KNOWN style's resolution.
        expect(getStyleVisual('container', true)).toEqual(getStyleVisual('container', false));
    });

    it('assigns every style a unique hue (no two styles share a colour)', () => {
        const hues = SAMPLE_STYLES.map((s) => getStyleVisual(s, false).hue);
        // Uniqueness is the whole point of the hue model — the sample must have no
        // duplicates.
        expect(new Set(hues).size).toBe(SAMPLE_STYLES.length);
    });

    it('assigns a globally unique hue across the ENTIRE catalog (guards arc overlap)', () => {
        const hues = KNOWN_STYLE_NAMES.map((s) => getStyleVisual(s, false).hue);
        // If two family hue arcs overlap, two styles collide — this must fail CI.
        expect(new Set(hues).size).toBe(KNOWN_STYLE_NAMES.length);
    });

    it('produces hues in the valid 0–359 range', () => {
        for (const s of SAMPLE_STYLES) {
            const { hue } = getStyleVisual(s, false);
            expect(hue).toBeGreaterThanOrEqual(0);
            expect(hue).toBeLessThan(360);
        }
    });

    it('is deterministic — the same style always yields the same hue', () => {
        expect(getStyleVisual('entry-list', false).hue).toBe(getStyleVisual('entry-list', false).hue);
        expect(getStyleVisual('input', true).hue).toBe(getStyleVisual('input', false).hue);
    });

    it('falls back to a container-aware default for an unknown style', () => {
        const containerLike = getStyleVisual('brand-new-style', true);
        const leafLike = getStyleVisual('brand-new-style', false);

        // A missing entry still yields a renderable icon + a valid hue.
        expect(containerLike.icon).toBeDefined();
        expect(leafLike.icon).toBeDefined();
        expect(containerLike.hue).toBeGreaterThanOrEqual(0);
        expect(leafLike.hue).toBeGreaterThanOrEqual(0);
    });
});
