/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import {
  getDataCellDisplayValue,
  getDataCellStoredCode,
  isRuntimeOptionLabelKey,
} from '../data-table-display.utils';

describe('data-table-display.utils', () => {
  it('detects runtime option label keys', () => {
    expect(isRuntimeOptionLabelKey('_role_label')).toBe(true);
    expect(isRuntimeOptionLabelKey('_tags_labels')).toBe(true);
    expect(isRuntimeOptionLabelKey('role')).toBe(false);
    expect(isRuntimeOptionLabelKey('_role')).toBe(false);
  });

  it('prefers hydrated labels for display', () => {
    const row = {
      role: 'lead-engineer',
      _role_label: 'Leitende Entwicklung',
    };

    expect(getDataCellDisplayValue('role', row)).toBe('Leitende Entwicklung');
    expect(getDataCellStoredCode('role', row)).toBe('lead-engineer');
  });

  it('resolves labels from option label maps when hydration keys are absent', () => {
    const row = { role: 'lead-engineer' };

    expect(getDataCellDisplayValue('role', row, {
      role: { 'lead-engineer': 'Lead Engineer' },
    })).toBe('Lead Engineer');
  });

  it('resolves labels using immutable section field keys', () => {
    const row = { section_238: 'web-architect' };

    expect(getDataCellDisplayValue('section_238', row, {
      section_238: { 'web-architect': 'Web Architect' },
    })).toBe('Web Architect');
  });

  it('falls back to stored code when no hydrated label exists', () => {
    const row = { role: 'researcher' };

    expect(getDataCellDisplayValue('role', row)).toBe('researcher');
  });

  it('uses multi-value labels when present', () => {
    const row = {
      topics: 'release,feature',
      _topics_labels: 'Freigabe, Funktion',
    };

    expect(getDataCellDisplayValue('topics', row)).toBe('Freigabe, Funktion');
  });
});
