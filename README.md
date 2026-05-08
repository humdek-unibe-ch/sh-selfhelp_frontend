/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
# SelfHelp Frontend

React frontend for SelfHelp based on [MaterialPro NextJs template](https://www.wrappixel.com/templates/materialpro-nextjs-admin-dashboard-app-directory/).

## License

Licensed under the [Mozilla Public License 2.0](LICENSE). Copyright (c) 2026 Humdek, University of Bern.

### SPDX headers

Every TS/TSX/JS file should carry a two-line SPDX header:

```ts
/*
 * SPDX-FileCopyrightText: 2026 Humdek, University of Bern
 * SPDX-License-Identifier: MPL-2.0
 */
```

The header text lives in [`header.txt`](header.txt). Header insertion / verification / removal is automated with [`license-check-and-add`](https://www.npmjs.com/package/license-check-and-add) using [`license-check-and-add-config.json`](license-check-and-add-config.json).

```bash
# One-time install (already in devDependencies):
npm install

# Add the header to every .ts/.tsx/.js/.jsx/.mjs/.cjs file
# under src/ (excluding node_modules, .next, public/, build/).
npm run headers:add

# Verify (CI-friendly: exits 1 if any file is missing the header).
npm run headers:check

# Strip the header (rarely needed; e.g. before re-licensing).
npm run headers:remove
```

The tool also reads `.gitignore` so build/cache directories are auto-excluded. Extra exclusions live in the `exact_paths` section of the config.
