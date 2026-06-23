<!--
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
-->
# Copilot instructions

Follow [`AGENTS.md`](../AGENTS.md) as the authoritative repository contract.
Read [`docs/developer/ssr-bff-architecture.md`](../docs/developer/ssr-bff-architecture.md)
for the current architecture; do not use removed root `architecture.md` /
`design.md` guidance or archived architecture as the implementation source.

Use only commands that exist in `package.json`. The current test runner is
Vitest, the UI stack is Mantine 9 + Tailwind CSS 4, and plugin frontend code is
loaded from manifest-provided ESM runtime URLs rather than installed into the
host as npm dependencies.
