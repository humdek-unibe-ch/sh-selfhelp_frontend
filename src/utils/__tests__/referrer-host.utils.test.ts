/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
    REFERRER_HOST_HEADER,
    consumeLandingReferrerHost,
    dismissLandingReferrerHost,
    externalReferrerHost,
    resetLandingReferrerForTests,
} from '../referrer-host.utils';

/**
 * The admin "Referrers" card counts outside sites that send visitors. The
 * backend takes a bare host name from `X-Referrer-Host`; the web client decides
 * what is worth sending: an outside http(s) host, never the site itself, and
 * from the browser only once, for the landing page.
 */
describe('externalReferrerHost', () => {
    it('uses the same header name the backend reads', () => {
        expect(REFERRER_HOST_HEADER).toBe('X-Referrer-Host');
    });

    it('returns the host of an outside referrer, without scheme, port, path or query', () => {
        expect(externalReferrerHost('https://news.example.org:8443/story?id=1#top', 'site.test')).toBe('news.example.org');
    });

    it('lower-cases the host', () => {
        expect(externalReferrerHost('https://News.Example.ORG/', 'site.test')).toBe('news.example.org');
    });

    it('returns null for a referrer from the site itself, whatever the case or port', () => {
        expect(externalReferrerHost('https://site.test/home', 'site.test')).toBeNull();
        expect(externalReferrerHost('https://SITE.test:8443/home', 'site.test:3000')).toBeNull();
    });

    it('takes the first entry of a forwarded host list as the own host', () => {
        expect(externalReferrerHost('https://site.test/', 'site.test, proxy.internal')).toBeNull();
        expect(externalReferrerHost('https://proxy.internal/', 'site.test, proxy.internal')).toBe('proxy.internal');
    });

    it('returns the host when the own host is unknown', () => {
        expect(externalReferrerHost('https://news.example.org/', null)).toBe('news.example.org');
        expect(externalReferrerHost('https://news.example.org/', undefined)).toBe('news.example.org');
        expect(externalReferrerHost('https://news.example.org/', '')).toBe('news.example.org');
    });

    it.each([
        ['nothing', undefined],
        ['null', null],
        ['an empty string', ''],
        ['text that is not a URL', 'not a url'],
        ['an app link', 'android-app://com.google.android.gm'],
        ['a file URL', 'file:///home/user/page.html'],
        ['an ftp URL', 'ftp://files.example.org/'],
    ])('returns null for %s', (_label, referrer) => {
        expect(externalReferrerHost(referrer, 'site.test')).toBeNull();
    });

    it('returns null for a host longer than the backend column', () => {
        const host = `${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.example`;
        expect(host.length).toBeGreaterThan(190);
        expect(externalReferrerHost(`https://${host}/`, 'site.test')).toBeNull();
    });
});

describe('consumeLandingReferrerHost', () => {
    const referrerOf = (value: string): void => {
        Object.defineProperty(document, 'referrer', { value, configurable: true });
    };

    /** Opens `path` as the landing page, as if the visitor came from `referrer`. */
    const landOn = (path: string, referrer: string): void => {
        window.history.pushState({}, '', path);
        referrerOf(referrer);
        resetLandingReferrerForTests();
    };

    beforeEach(() => {
        window.history.pushState({}, '', '/');
        referrerOf('');
        resetLandingReferrerForTests();
    });

    afterEach(() => {
        window.history.pushState({}, '', '/');
        referrerOf('');
        resetLandingReferrerForTests();
    });

    it('hands out the outside referrer for the request of the landing page', () => {
        landOn('/impressum', 'https://News.Example.org/story');

        expect(consumeLandingReferrerHost('/impressum')).toBe('news.example.org');
    });

    it('hands it out once only', () => {
        landOn('/impressum', 'https://news.example.org/story');

        expect(consumeLandingReferrerHost('/impressum')).toBe('news.example.org');
        expect(consumeLandingReferrerHost('/impressum')).toBeNull();
    });

    it('matches the landing path however the request writes it', () => {
        for (const requested of ['impressum', '/impressum/', '/impressum?x=1', 'https://site.test/impressum#a']) {
            landOn('/impressum', 'https://news.example.org/');
            expect(consumeLandingReferrerHost(requested), requested).toBe('news.example.org');
        }
    });

    it('gives nothing for another page and uses up the chance, so a later page never inherits it', () => {
        landOn('/impressum', 'https://news.example.org/');

        // e.g. a hover prefetch of another page that happens first
        expect(consumeLandingReferrerHost('/contact')).toBeNull();
        expect(consumeLandingReferrerHost('/impressum')).toBeNull();
    });

    it('gives nothing when the visitor did not come from an outside site', () => {
        landOn('/impressum', '');
        expect(consumeLandingReferrerHost('/impressum')).toBeNull();

        landOn('/impressum', `${window.location.origin}/home`);
        expect(consumeLandingReferrerHost('/impressum')).toBeNull();
    });

    it('treats the home page as a landing page too', () => {
        landOn('/', 'https://search.example.org/?q=selfhelp');

        expect(consumeLandingReferrerHost('/')).toBe('search.example.org');
    });
});

describe('dismissLandingReferrerHost', () => {
    const referrerOf = (value: string): void => {
        Object.defineProperty(document, 'referrer', { value, configurable: true });
    };

    const landOn = (path: string, referrer: string): void => {
        window.history.pushState({}, '', path);
        referrerOf(referrer);
        resetLandingReferrerForTests();
    };

    beforeEach(() => {
        window.history.pushState({}, '', '/');
        referrerOf('');
        resetLandingReferrerForTests();
    });

    afterEach(() => {
        window.history.pushState({}, '', '/');
        referrerOf('');
        resetLandingReferrerForTests();
    });

    it('clears the landing snapshot so a later consume for that path returns null', () => {
        landOn('/impressum', 'https://news.example.org/story');

        dismissLandingReferrerHost('/impressum');

        expect(consumeLandingReferrerHost('/impressum')).toBeNull();
    });

    it('does not clear when the seeded path is not the landing path', () => {
        landOn('/impressum', 'https://news.example.org/');

        dismissLandingReferrerHost('/contact');

        expect(consumeLandingReferrerHost('/impressum')).toBe('news.example.org');
    });

    it('is a no-op when there is no snapshot', () => {
        expect(() => dismissLandingReferrerHost('/impressum')).not.toThrow();
        expect(consumeLandingReferrerHost('/impressum')).toBeNull();
    });
});
