/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import {
    parseFieldsMapCatalog,
    serializeFieldsMapCatalog,
    serializeFieldsMapLabels,
    parseFieldsMapLabels,
} from '@selfhelp/shared';

export interface IFieldsMapEntry {
    field_name: string;
    field_new_name: string;
}

export function parseFieldsMapFromJson(raw: string): IFieldsMapEntry[] {
    const keys = parseFieldsMapCatalog(raw);
    return keys.map((field_name) => ({ field_name, field_new_name: '' }));
}

export function serializeFieldsMapToJson(entries: IFieldsMapEntry[]): string {
    return serializeFieldsMapCatalog(entries.map((entry) => entry.field_name));
}

export { parseFieldsMapCatalog, serializeFieldsMapCatalog, parseFieldsMapLabels, serializeFieldsMapLabels };
