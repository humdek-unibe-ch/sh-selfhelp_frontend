/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { compareVersions, isComparableVersion, summarizeUpdateAvailability } from '../version.utils';

describe('compareVersions', () => {
    it('orders by numeric release segments', () => {
        expect(compareVersions('0.2.0', '0.1.0')).toBeGreaterThan(0);
        expect(compareVersions('0.1.0', '0.2.0')).toBeLessThan(0);
        expect(compareVersions('0.1.10', '0.1.9')).toBeGreaterThan(0); // not lexical
        expect(compareVersions('1.0.0', '1.0.0')).toBe(0);
    });

    it('treats a missing trailing segment as zero and tolerates a v prefix', () => {
        expect(compareVersions('1.2', '1.2.0')).toBe(0);
        expect(compareVersions('v1.3.0', '1.2.9')).toBeGreaterThan(0);
    });

    it('ranks a prerelease below its final release (semver precedence)', () => {
        expect(compareVersions('1.2.3-rc.1', '1.2.3')).toBeLessThan(0);
        expect(compareVersions('1.2.3', '1.2.3-rc.1')).toBeGreaterThan(0);
        expect(compareVersions('1.2.3-rc.2', '1.2.3-rc.1')).toBeGreaterThan(0);
    });
});

describe('isComparableVersion', () => {
    it('rejects empty, nullish, and the literal "unknown"', () => {
        expect(isComparableVersion('')).toBe(false);
        expect(isComparableVersion(null)).toBe(false);
        expect(isComparableVersion(undefined)).toBe(false);
        expect(isComparableVersion('unknown')).toBe(false);
    });

    it('accepts a dotted-numeric version', () => {
        expect(isComparableVersion('0.1.10')).toBe(true);
    });
});

describe('summarizeUpdateAvailability', () => {
    it('flags an update and reports the newest installable version', () => {
        const result = summarizeUpdateAvailability('0.1.0', [
            { version: '0.2.0', blocked: false },
            { version: '0.1.0', blocked: false },
        ]);
        expect(result).toEqual({ latestVersion: '0.2.0', updateAvailable: true });
    });

    it('reports up to date when current already is the newest', () => {
        const result = summarizeUpdateAvailability('0.2.0', [
            { version: '0.2.0', blocked: false },
            { version: '0.1.0', blocked: false },
        ]);
        expect(result).toEqual({ latestVersion: '0.2.0', updateAvailable: false });
    });

    it('ignores blocked releases when choosing the latest installable version', () => {
        // A newer release exists but is blocked, so the newest INSTALLABLE target
        // is the older one and no update is offered over the current 0.2.0.
        const result = summarizeUpdateAvailability('0.2.0', [
            { version: '0.3.0', blocked: true },
            { version: '0.2.0', blocked: false },
        ]);
        expect(result).toEqual({ latestVersion: '0.2.0', updateAvailable: false });
    });

    it('does not depend on input ordering', () => {
        const result = summarizeUpdateAvailability('0.1.0', [
            { version: '0.1.5', blocked: false },
            { version: '0.2.0', blocked: false },
            { version: '0.1.9', blocked: false },
        ]);
        expect(result.latestVersion).toBe('0.2.0');
        expect(result.updateAvailable).toBe(true);
    });

    it('returns no update for an empty or unreachable registry list', () => {
        expect(summarizeUpdateAvailability('0.1.0', [])).toEqual({ latestVersion: null, updateAvailable: false });
    });

    it('never claims an update when the current version is unknown', () => {
        // The newest installable version is still surfaced, but with no trustworthy
        // current version we must not assert that an update is available.
        const result = summarizeUpdateAvailability('unknown', [{ version: '0.2.0', blocked: false }]);
        expect(result).toEqual({ latestVersion: '0.2.0', updateAvailable: false });
    });
});
