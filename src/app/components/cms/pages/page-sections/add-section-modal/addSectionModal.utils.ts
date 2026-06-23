/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { isStylePlacementAllowed, type TStylePlatform } from '@selfhelp/shared/registry';
import { type IStyle } from '../../../../../../types/responses/admin/styles.types';
import { isStyleOnPagePlatform, isStyleOnPlatform, type TPlatformFilter } from '../../../../../../utils/style-platform.utils';
import { MAX_SECTIONS, MAX_UNUSED_SECTIONS, type AddSectionTab, ADD_SECTION_TAB } from './addSectionModal.constants';

// ==================== New Section catalog filtering ====================

/** Minimal style-group shape the add-section catalog filter operates on. */
export interface IFilterableStyleGroup {
    styles: IStyle[];
}

export interface IFilterStyleGroupsParams<TGroup extends IFilterableStyleGroup> {
    styleGroups: TGroup[];
    /** True when adding directly to a page (no parent section). */
    isRoot: boolean;
    /** Platform the target page renders on. */
    pagePlatform: TStylePlatform;
    /** Manual All / Web / Mobile toggle layered on top of the page gate. */
    platformFilter: TPlatformFilter;
    searchQuery: string;
    /** Parent/child relationship predicate (compound rules). */
    isStyleAllowedAsChild: (style: IStyle) => boolean;
}

/**
 * Apply the full add-section catalog filter to a list of style groups:
 *
 *   parent/child relationship ∩ placement ∩ page platform ∩ manual filter ∩ search
 *
 * Returns only non-empty groups. Pure so it can be unit-tested without
 * mounting the modal. A mobile-only style is hidden on web-only pages
 * (platform), and a root-only style is hidden inside containers (placement).
 */
export function filterStyleGroupsForAdd<TGroup extends IFilterableStyleGroup>({
    styleGroups,
    isRoot,
    pagePlatform,
    platformFilter,
    searchQuery,
    isStyleAllowedAsChild,
}: IFilterStyleGroupsParams<TGroup>): TGroup[] {
    const query = searchQuery.trim().toLowerCase();

    return styleGroups
        .map((group) => ({
            ...group,
            styles: group.styles.filter((style) => {
                const isAllowed = isStyleAllowedAsChild(style);
                const allowedPlacement = isStylePlacementAllowed(style.name, isRoot);
                const allowedOnPage = isStyleOnPagePlatform(style, pagePlatform);
                const matchesPlatformFilter =
                    platformFilter === 'all' || isStyleOnPlatform(style, platformFilter);
                const matchesSearch =
                    !query ||
                    style.name.toLowerCase().includes(query) ||
                    style.description?.toLowerCase().includes(query);

                return isAllowed && allowedPlacement && allowedOnPage && matchesPlatformFilter && matchesSearch;
            }),
        }))
        .filter((group) => group.styles.length > 0);
}

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