/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { useInterpolationVariables } from './useInterpolationVariables';

/**
 * Section specialization of {@link useInterpolationVariables} (issue #56).
 *
 * Kept as a named convenience so the many section-editor call sites read
 * clearly, but it now delegates to the single unified context-aware picker hook
 * (`context: 'section'`) so every CMS surface shares one endpoint and one cache
 * strategy. The section catalog is data_config columns (rename-safe `field_key`
 * tokens) + system + globals.
 *
 * @param sectionId - The section to resolve variables for
 * @param enabled - Whether the query should run (e.g. inspector is open)
 * @returns React Query result with the token => label map
 */
export function useSectionDataVariables(sectionId: number | null, enabled: boolean = true) {
    return useInterpolationVariables('section', sectionId, enabled);
}
