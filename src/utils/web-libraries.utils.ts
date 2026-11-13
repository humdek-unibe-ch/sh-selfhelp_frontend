/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * The libraries this web app is built with, for the "about the platform" block
 * and the admin System page.
 *
 * The list is generated, never typed: `scripts/generate-web-libraries.mjs`
 * reads `package.json` `dependencies` and the installed versions and writes
 * `src/generated/web-libraries.json` before every dev server, build and type
 * check. Vitest swaps in an empty list when that file does not exist yet, so a
 * test run never breaks on a fresh checkout.
 *
 * The list carries exact versions. Whether a screen may show them is decided by
 * the server (`about.detail`), never here: a caller shows `version` only when
 * the platform block says so.
 */
import type { IAboutItem } from '../shared';
import generated from '../generated/web-libraries.json';

export const WEB_LIBRARIES: readonly IAboutItem[] = generated;
