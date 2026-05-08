/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Centralized exports for all section-related React Query mutation hooks.
 * This file provides a single import point for all section mutation hooks.
 * 
 * @module hooks/mutations/sections
 */

// Page-Section mutations
export { useAddSectionToPageMutation } from './useAddSectionToPageMutation';
export { useRemoveSectionFromPageMutation } from './useRemoveSectionFromPageMutation';
export { useRemoveBulkSectionsFromPageMutation } from './useRemoveBulkSectionsFromPageMutation';

// Section-Section mutations
export { useAddSectionToSectionMutation } from './useAddSectionToSectionMutation';
export { useRemoveSectionFromSectionMutation } from './useRemoveSectionFromSectionMutation';

// Section creation mutations
export { useCreateSectionInPageMutation } from './useCreateSectionInPageMutation';
export { useCreateSectionInSectionMutation } from './useCreateSectionInSectionMutation';

// Sibling creation mutations
export { useCreateSiblingAboveMutation } from './useCreateSiblingAboveMutation';
export { useCreateSiblingBelowMutation } from './useCreateSiblingBelowMutation';

// Section update mutations
export { useUpdateSectionMutation } from './useUpdateSectionMutation';

// Section delete mutations
export { useDeleteSectionMutation } from './useDeleteSectionMutation'; 
