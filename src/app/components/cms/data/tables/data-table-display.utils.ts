/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/

import {
  resolveStoredCodesToLabels,
  type TOptionLabelMaps,
} from './data-table-option-labels.utils';

/** Runtime keys injected during option-label hydration (`_role_label`, `_tags_labels`). */
const RUNTIME_OPTION_LABEL_KEY = /^_[A-Za-z0-9_.]+_(label|labels)$/;

export function isRuntimeOptionLabelKey(key: string): boolean {
  return RUNTIME_OPTION_LABEL_KEY.test(key);
}

export function getDataCellStoredCode(fieldKey: string, row: Record<string, unknown>): string {
  const raw = row[fieldKey];
  if (raw === null || raw === undefined) {
    return '';
  }
  return String(raw);
}

/**
 * Prefer hydrated `_field_label` / `_field_labels`, then client-resolved option
 * label maps for the selected language.
 */
export function getDataCellDisplayValue(
  fieldKey: string,
  row: Record<string, unknown>,
  optionLabelMaps?: TOptionLabelMaps,
): string {
  const singleKey = `_${fieldKey}_label`;
  const multiKey = `_${fieldKey}_labels`;
  const hydrated = row[singleKey] ?? row[multiKey];
  if (typeof hydrated === 'string' && hydrated.trim() !== '') {
    return hydrated;
  }

  const storedCode = getDataCellStoredCode(fieldKey, row);
  if (storedCode === '') {
    return '';
  }

  const resolved = resolveStoredCodesToLabels(storedCode, optionLabelMaps?.[fieldKey]);
  if (resolved !== storedCode) {
    return resolved;
  }

  return storedCode;
}