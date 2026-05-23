#!/usr/bin/env node
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * plugins-sync.mjs
 *
 * Reads the live plugin manifest from a SelfHelp backend, generates
 * a deterministic `selfhelp.plugins.lock.json` next to the project,
 * and ensures every enabled plugin's frontend npm package is listed
 * in `package.json` dependencies. Designed to be run as part of CI
 * before `npm install` so deployments are reproducible.
 *
 * Usage:
 *   node scripts/plugins-sync.mjs --backend https://cms.example.org [--lock selfhelp.plugins.lock.json] [--dry-run]
 *
 * Environment variables:
 *   SELFHELP_BACKEND_URL  — alternative to --backend.
 *   SELFHELP_API_TOKEN    — optional bearer token (sent as Authorization header).
 *
 * Exit codes:
 *   0 — sync complete (or dry-run reported no changes).
 *   1 — fetch failed.
 *   2 — manifest looked malformed.
 *   3 — local file system error.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function argFlag(name) {
    const idx = process.argv.indexOf(`--${name}`);
    return idx === -1 ? null : process.argv[idx + 1] ?? true;
}

const backendUrl = argFlag('backend') ?? process.env.SELFHELP_BACKEND_URL;
const lockPath = path.resolve(process.cwd(), String(argFlag('lock') ?? 'selfhelp.plugins.lock.json'));
const packagePath = path.resolve(process.cwd(), 'package.json');
const dryRun = Boolean(argFlag('dry-run'));

if (!backendUrl || typeof backendUrl !== 'string') {
    console.error('plugins-sync: pass --backend https://... or set SELFHELP_BACKEND_URL.');
    process.exit(1);
}

const apiToken = process.env.SELFHELP_API_TOKEN;

async function fetchManifest(base) {
    const url = `${base.replace(/\/$/, '')}/cms-api/v1/plugins/manifest`;
    const headers = { Accept: 'application/json' };
    if (apiToken) {
        headers.Authorization = `Bearer ${apiToken}`;
    }
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
        throw new Error(`manifest fetch failed (${resp.status}): ${await resp.text()}`);
    }
    const json = await resp.json();
    if (!json?.data) {
        throw new Error('manifest response missing `data` envelope.');
    }
    return json.data;
}

function buildLock(manifest) {
    const plugins = (manifest.plugins ?? []).map((p) => ({
        id: p.pluginId,
        version: p.version,
        pluginApiVersion: p.pluginApiVersion,
        enabled: p.enabled,
        trustLevel: p.trustLevel,
        frontend: p.frontendRuntimeUrl
            ? {
                runtimeUrl: p.frontendRuntimeUrl,
                stylesheetUrl: p.frontendRuntimeStylesheetUrl ?? null,
                integrity: p.frontendRuntimeIntegrity ?? null,
                format: p.frontendRuntimeFormat ?? 'esm',
            }
            : null,
        mobile: p.mobilePackage
            ? { package: p.mobilePackage, version: p.mobilePackageVersion ?? p.version }
            : null,
        capabilities: p.capabilities ?? [],
    }));
    return {
        schemaVersion: '1.0',
        generatedAt: new Date().toISOString(),
        cmsVersion: manifest.cmsVersion ?? null,
        sdkApiVersion: manifest.sdkApiVersion ?? null,
        plugins,
    };
}

async function writeLock(target, payload) {
    const serialized = `${JSON.stringify(payload, null, 2)}\n`;
    if (dryRun) {
        console.log(`plugins-sync: would write ${target}`);
        console.log(serialized);
        return false;
    }
    let existing = null;
    try {
        existing = await fs.readFile(target, 'utf8');
    } catch (e) {
        if (e.code !== 'ENOENT') throw e;
    }
    if (existing === serialized) {
        console.log(`plugins-sync: lock file already up to date (${target}).`);
        return false;
    }
    await fs.writeFile(target, serialized, 'utf8');
    console.log(`plugins-sync: wrote ${target}`);
    return true;
}

async function syncPackageJson(target, payload) {
    const raw = await fs.readFile(target, 'utf8');
    const pkg = JSON.parse(raw);
    pkg.dependencies = pkg.dependencies ?? {};

    const updated = {};
    for (const plugin of payload.plugins) {
        if (!plugin.enabled || !plugin.frontend) continue;
        updated[plugin.frontend.package] = plugin.frontend.version
            ? `^${plugin.frontend.version}`
            : 'latest';
    }

    // Preserve unrelated dependencies; only ensure plugin packages are
    // present (do NOT auto-remove other plugins the operator might have
    // pinned manually).
    let changed = false;
    for (const [pkgName, constraint] of Object.entries(updated)) {
        if (pkg.dependencies[pkgName] !== constraint) {
            pkg.dependencies[pkgName] = constraint;
            changed = true;
        }
    }

    if (!changed) {
        console.log('plugins-sync: package.json already lists all enabled plugin packages.');
        return false;
    }

    if (dryRun) {
        console.log('plugins-sync: would update package.json dependencies:');
        console.log(JSON.stringify(updated, null, 2));
        return false;
    }

    await fs.writeFile(target, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
    console.log('plugins-sync: package.json updated. Run `npm install` next.');
    return true;
}

async function main() {
    try {
        const manifest = await fetchManifest(backendUrl);
        if (!Array.isArray(manifest.plugins)) {
            console.error('plugins-sync: manifest.plugins must be an array.');
            process.exit(2);
        }
        const lock = buildLock(manifest);
        await writeLock(lockPath, lock);
        await syncPackageJson(packagePath, lock);
    } catch (err) {
        console.error('plugins-sync:', err.message ?? err);
        process.exit(1);
    }
}

main();
