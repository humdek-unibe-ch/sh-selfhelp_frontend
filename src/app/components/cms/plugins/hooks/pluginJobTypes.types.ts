/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { IPluginManifestJobConfigSchema } from '@selfhelp/shared/plugin-sdk';

/** One action-plannable plugin job type from C12. */
export interface IPluginJobType {
    type: string;
    plugin_id: string;
    label: string;
    config_schema: IPluginManifestJobConfigSchema | Record<string, unknown>;
    resource_fields: Record<string, string>;
}
