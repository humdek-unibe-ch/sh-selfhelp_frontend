/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { IStyle } from '../../../../../../types/responses/admin/styles.types';
import { MAX_SECTIONS, MAX_UNUSED_SECTIONS, AddSectionTab, ADD_SECTION_TAB } from './addSectionModal.constants';

// ==================== New Section helpers ====================

export const getNewSectionLimitState = (count: number) => ({
    styleCount: count,
    isNearLimit: count >= MAX_SECTIONS - 2,
    isLimit: count >= MAX_SECTIONS,
});

// Single mode = exactly one style selected with quantity 1, which enables the custom name input
export const isSingleMode = (selectedStyles: { style: IStyle; quantity: number }[]) =>
    selectedStyles.length === 1 && selectedStyles[0].quantity === 1;

// ==================== Unused Section helpers ====================

export const getUnusedSectionLimitState = (count: number) => ({
    unusedCount: count,
    isUnusedNearLimit: count >= MAX_UNUSED_SECTIONS - 2,
    isUnusedLimit: count >= MAX_UNUSED_SECTIONS,
});

// ==================== Footer status text ====================

interface GetStatusTextParams {
    activeTab: AddSectionTab;
    // new-section
    newSectionCount: number;
    isNearLimit: boolean;
    isLimit: boolean;
    // unassigned-section
    unusedSectionCount: number;
    isUnusedNearLimit: boolean;
    isUnusedLimit: boolean;
    // reference-section
    hasRefContainerSelection: boolean;
    // import-section
    hasImportFile: boolean;
    importFileName: string | null;
}

/* ==================== STATUS TEXT GENERATOR ==================== */

/**
 * Generates contextual status text for the modal footer based on the active tab
 * and current selection state. Provides clear user feedback.
 */
export const getStatusText = ({
    activeTab,
    newSectionCount,
    isNearLimit,
    isLimit,
    unusedSectionCount,
    isUnusedNearLimit,
    isUnusedLimit,
    hasRefContainerSelection,
    hasImportFile,
    importFileName,
}: GetStatusTextParams): string => {
    switch (activeTab) {
        case ADD_SECTION_TAB.IMPORT_SECTION:
            return hasImportFile
                ? `Ready to import from "${importFileName}"`
                : 'Select a JSON file to import';

        case ADD_SECTION_TAB.UNASSIGNED_SECTION:
            if (isUnusedLimit) return `Limit reached (${unusedSectionCount}/${MAX_UNUSED_SECTIONS})`;
            if (isUnusedNearLimit) return `Almost at limit (${unusedSectionCount}/${MAX_UNUSED_SECTIONS})`;
            if (unusedSectionCount > 0) return `Ready to add "${unusedSectionCount}" section(s)`;
            return 'Select an unused section to continue';

        case ADD_SECTION_TAB.REFERENCE_SECTION:
            return hasRefContainerSelection
                ? 'Ready to add reference container'
                : 'Select a reference container to continue';

        default:
            if (isLimit) return `Limit reached (${newSectionCount}/${MAX_SECTIONS})`;
            if (isNearLimit) return `Almost at limit (${newSectionCount}/${MAX_SECTIONS})`;
            if (newSectionCount > 0) return `Ready to add "${newSectionCount}" style(s)`;
            return 'Select a style to continue';
    }
};


/* ==================== STATUS COLOR HELPER ==================== */

/**
 * Returns appropriate Mantine color for the status text based on current state.
 * Red = blocked/limit reached, Orange = warning, Dimmed = normal state.
 */
export const getStatusColor = (
  activeTab: AddSectionTab,
  flags: {
    isLimit: boolean;
    isNearLimit: boolean;
    isUnusedLimit: boolean;
    isUnusedNearLimit: boolean;
    hasImportFile: boolean;
    hasRefContainerSelection: boolean;
  }
): "orange" | "red" | "dimmed" => {
  switch (activeTab) {
    case ADD_SECTION_TAB.NEW_SECTION:
      if (flags.isLimit) return "red";
      if (flags.isNearLimit) return "orange";
      return "dimmed";

    case ADD_SECTION_TAB.UNASSIGNED_SECTION:
      if (flags.isUnusedLimit) return "red";
      if (flags.isUnusedNearLimit) return "orange";
      return "dimmed";

    case ADD_SECTION_TAB.IMPORT_SECTION:
      return flags.hasImportFile ? "dimmed" : "orange";

    case ADD_SECTION_TAB.REFERENCE_SECTION:
      return flags.hasRefContainerSelection ? "dimmed" : "orange";

    default:
      return "dimmed";
  }
};