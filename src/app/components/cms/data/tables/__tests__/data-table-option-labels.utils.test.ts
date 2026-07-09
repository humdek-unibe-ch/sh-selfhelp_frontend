/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import {
  alignOptionLabelMapsToFieldKeys,
  buildOptionLabelMapsFromExport,
  resolveStoredCodesToLabels,
} from '../data-table-option-labels.utils';
import type { ISectionExportData } from '../../../../../../api/admin/section.api';

const languages = [
  { id: 2, language: 'Deutsch (Schweiz)', locale: 'de-CH' },
  { id: 3, language: 'English', locale: 'en-GB' },
];

const roleSection: ISectionExportData = {
  style_name: 'select',
  fields: {
    name: { all: { content: 'role' } },
    options: {
      all: {
        content: '[{"value":"lead-engineer","sort":1},{"value":"researcher","sort":2}]',
      },
    },
    option_labels: {
      'de-CH': {
        content: '{"lead-engineer":"Leitende Entwicklung","researcher":"Forschung"}',
      },
      'en-GB': {
        content: '{"lead-engineer":"Lead Engineer","researcher":"Researcher"}',
      },
    },
  },
};

describe('data-table-option-labels.utils', () => {
  it('builds per-field code-to-label maps from exported form children', () => {
    const maps = buildOptionLabelMapsFromExport([roleSection], 2, languages);

    expect(maps.role).toEqual({
      'lead-engineer': 'Leitende Entwicklung',
      researcher: 'Forschung',
    });
  });

  it('switches labels when the language id changes', () => {
    const maps = buildOptionLabelMapsFromExport([roleSection], 3, languages);

    expect(maps.role['lead-engineer']).toBe('Lead Engineer');
  });

  it('aligns input-name maps onto immutable field keys from column metadata', () => {
    const maps = {
      role: { 'lead-engineer': 'Lead Engineer' },
    };

    expect(alignOptionLabelMapsToFieldKeys(maps, [
      { fieldKey: 'section_238', displayName: 'role' },
    ])).toEqual({
      role: { 'lead-engineer': 'Lead Engineer' },
      section_238: { 'lead-engineer': 'Lead Engineer' },
    });
  });

  it('resolves comma-separated stored codes to labels', () => {
    expect(resolveStoredCodesToLabels('release,notice', {
      release: 'Freigabe',
      notice: 'Hinweis',
    })).toBe('Freigabe, Hinweis');
  });
});
