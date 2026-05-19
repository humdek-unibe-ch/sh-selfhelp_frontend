/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
// Separated for detached logic, if we want future different values for each
export const MAX_SECTIONS = 20;
export const MAX_UNUSED_SECTIONS = 20;

export const ADD_SECTION_TAB = {
    NEW_SECTION: 'new-section',
    UNASSIGNED_SECTION: 'unassigned-section',
    REFERENCE_SECTION: 'reference-section',
    IMPORT_SECTION: 'import-section',
} as const;

export type AddSectionTab = typeof ADD_SECTION_TAB[keyof typeof ADD_SECTION_TAB];