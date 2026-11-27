/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Bridge between `PluginRuntime` (which keeps each enabled plugin's `sync`
 * map) and `applySyncTags` / the ACL watcher. The runtime installs the
 * provider on boot; tests install their own map without booting plugins.
 */
import type { IPluginSyncEntry } from '@selfhelp/shared/plugin-sdk';

type TProvider = () => readonly IPluginSyncEntry[];

let provider: TProvider = () => [];

/** Install the live (or test) source of plugin sync entries. */
export function setPluginSyncEntriesProvider(next: TProvider): void {
    provider = next;
}

/** Sync entries of every enabled, registered plugin. */
export function getPluginSyncEntries(): readonly IPluginSyncEntry[] {
    return provider();
}
