/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Tiny version utilities for the SelfHelp `0.x` (dotted-numeric, optional
 * prerelease) version scheme used by the core + frontend release channels.
 *
 * This is intentionally NOT a full semver implementation (no build metadata, no
 * range satisfaction): the registry already sorts/filters published releases and
 * the SelfHelp Manager performs the authoritative resolve + signature check at
 * execution time. Here we only need a deterministic "is A newer than B"
 * comparison so the System Maintenance page can answer "is an update available,
 * and what is the newest version this instance could move to".
 */

/** One published release ref as returned by the update-releases endpoints. */
export interface IReleaseRef {
    version: string;
    channel?: string;
    blocked?: boolean;
}

export interface IUpdateAvailability {
    /** Newest installable (non-blocked) version found, or null if none/unknown. */
    latestVersion: string | null;
    /** True when {@link latestVersion} is strictly newer than the current version. */
    updateAvailable: boolean;
}

/**
 * Split a version into numeric release segments + an optional prerelease tag.
 * `v1.2.3-rc.1` → `{ release: [1, 2, 3], pre: 'rc.1' }`. A non-numeric segment
 * collapses to `0` so a malformed value never throws — it just sorts low.
 */
function parse(version: string): { release: number[]; pre: string | null } {
    const trimmed = version.trim().replace(/^v/i, '');
    const dash = trimmed.indexOf('-');
    const core = dash === -1 ? trimmed : trimmed.slice(0, dash);
    const preRaw = dash === -1 ? '' : trimmed.slice(dash + 1);
    const release = core.split('.').map((s) => {
        const n = Number.parseInt(s, 10);
        return Number.isNaN(n) ? 0 : n;
    });
    return { release, pre: preRaw === '' ? null : preRaw };
}

/** True when a version string can be meaningfully parsed (has a leading digit). */
export function isComparableVersion(version: string | null | undefined): version is string {
    if (!version) return false;
    return /\d/.test(version) && version.toLowerCase() !== 'unknown';
}

/**
 * Compare two versions. Returns `>0` when `a` is newer, `<0` when older, `0`
 * when equal. A prerelease (`1.2.3-rc.1`) is OLDER than its release (`1.2.3`),
 * per semver precedence.
 */
export function compareVersions(a: string, b: string): number {
    const pa = parse(a);
    const pb = parse(b);
    const len = Math.max(pa.release.length, pb.release.length);
    for (let i = 0; i < len; i++) {
        const diff = (pa.release[i] ?? 0) - (pb.release[i] ?? 0);
        if (diff !== 0) return diff > 0 ? 1 : -1;
    }
    // Equal release numbers: a release outranks a prerelease; else compare tags.
    if (pa.pre === pb.pre) return 0;
    if (pa.pre === null) return 1;
    if (pb.pre === null) return -1;
    return pa.pre > pb.pre ? 1 : pa.pre < pb.pre ? -1 : 0;
}

/**
 * Given the current version and the registry's published releases (in any
 * order), report the newest INSTALLABLE (non-blocked) version and whether it is
 * strictly newer than current. Blocked releases are excluded — the preflight is
 * what enforces a block, but for the "latest you can move to" hint we only
 * consider installable versions. An empty/unknown list yields no update, and a
 * non-comparable current version (e.g. `unknown`) never reports an update.
 */
export function summarizeUpdateAvailability(
    currentVersion: string,
    releases: IReleaseRef[],
): IUpdateAvailability {
    let latest: string | null = null;
    for (const r of releases) {
        if (r.blocked || !r.version) continue;
        if (latest === null || compareVersions(r.version, latest) > 0) {
            latest = r.version;
        }
    }
    const updateAvailable =
        latest !== null && isComparableVersion(currentVersion) && compareVersions(latest, currentVersion) > 0;
    return { latestVersion: latest, updateAvailable };
}
