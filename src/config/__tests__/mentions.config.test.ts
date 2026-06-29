/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect } from 'vitest';
import { buildVariableSuggestions } from '../mentions.config';

/**
 * Issue #56: the section `data_variables` payload is a `token => label` map.
 * The CMS variable picker must INSERT the stable token (`{{token}}`) but SHOW
 * the human label, so admins pick by a readable name while content always
 * stores the immutable key. `buildVariableSuggestions` is that translation and
 * is the single contract point both editors share.
 */
describe('buildVariableSuggestions (token/label mapping)', () => {
  it('maps each token to a picker item: id = inserted token, label = display text', () => {
    const result = buildVariableSuggestions({
      'record.mood_score': 'record.Daily mood',
      'system.user_name': 'system.user_name',
    });

    expect(result).toEqual([
      { id: 'record.mood_score', label: 'record.Daily mood' },
      { id: 'system.user_name', label: 'system.user_name' },
    ]);
  });

  it('keeps the token as an opaque literal even when it contains dots', () => {
    // A SurveyJS dynamic-panel key is dotted; it must travel through verbatim.
    const [item] = buildVariableSuggestions({ 'record.household.member_name': 'record.Member name' });
    expect(item.id).toBe('record.household.member_name');
    expect(item.label).toBe('record.Member name');
  });

  it('falls back to the token when no label is provided', () => {
    expect(buildVariableSuggestions({ 'record.x': '' })).toEqual([{ id: 'record.x', label: 'record.x' }]);
  });

  it('returns an empty list when there are no variables', () => {
    expect(buildVariableSuggestions(undefined)).toEqual([]);
    expect(buildVariableSuggestions({})).toEqual([]);
  });
});
