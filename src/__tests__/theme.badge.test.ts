/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Regression for the operator complaint that status pills were cut off in dense
 * admin tables. The fix is a global Mantine `Badge` default in the app theme
 * that lets the label render in full (Mantine's stock Badge clips with an
 * ellipsis at a capped width). Asserting the theme contract is deterministic
 * and avoids brittle computed-style checks in jsdom.
 */
import { describe, it, expect } from 'vitest';
import { theme } from '../../theme';

describe('app theme: non-truncating status pills', () => {
  it('configures the Badge default so labels are never clipped in tables', () => {
    const styles = theme.components?.Badge?.styles as
      | { root?: Record<string, unknown>; label?: Record<string, unknown> }
      | undefined;

    expect(styles).toBeTruthy();
    expect(styles?.root?.maxWidth).toBe('none');
    expect(styles?.label?.overflow).toBe('visible');
  });
});
