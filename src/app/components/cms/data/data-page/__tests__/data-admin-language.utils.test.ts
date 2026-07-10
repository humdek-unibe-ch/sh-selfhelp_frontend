/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it } from 'vitest';
import {
  readLanguageIdFromSearchParams,
  resolveDataAdminLanguageId,
  shouldPersistLanguageIdInUrl,
} from '../data-admin-language.utils';

describe('data-admin-language.utils', () => {
  it('reads languageId from search params', () => {
    expect(readLanguageIdFromSearchParams(new URLSearchParams('languageId=3'))).toBe(3);
    expect(readLanguageIdFromSearchParams(new URLSearchParams())).toBeNull();
  });

  it('prefers an explicit language over the CMS default', () => {
    expect(resolveDataAdminLanguageId(3, 2)).toBe(3);
    expect(resolveDataAdminLanguageId(null, 2)).toBe(2);
    expect(resolveDataAdminLanguageId(undefined, undefined)).toBe(1);
  });

  it('omits the default CMS language from the URL', () => {
    expect(shouldPersistLanguageIdInUrl(2, 2)).toBe(false);
    expect(shouldPersistLanguageIdInUrl(3, 2)).toBe(true);
  });
});
