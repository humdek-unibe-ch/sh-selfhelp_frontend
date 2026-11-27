#!/usr/bin/env node
/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * `next build` / `next dev` rewrites the typed-routes import in `next-env.d.ts`
 * (`.next/types` vs `.next/dev/types`). Restore the tracked file so the working
 * tree stays clean (F274).
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('git', ['checkout', '--', 'next-env.d.ts'], {
    cwd: root,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
});
if (result.status !== 0) {
    process.stderr.write(
        `[restore-next-env] could not restore next-env.d.ts: ${result.stderr || result.stdout || result.status}\n`,
    );
    process.exit(0);
}
