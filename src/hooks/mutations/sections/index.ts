/**
 * Centralized exports for all section-related React Query mutation hooks.
 * This file provides a single import point for all section mutation hooks.
 * 
 * @module hooks/mutations/sections
 */

// Page-Section mutations
export { useAddSectionToPageMutation } from './useAddSectionToPageMutation';
export { useRemoveSectionFromPageMutation } from './useRemoveSectionFromPageMutation';

// Section-Section mutations
export { useAddSectionToSectionMutation } from './useAddSectionToSectionMutation';
export { useRemoveSectionFromSectionMutation } from './useRemoveSectionFromSectionMutation';

// Section creation mutations
export { useCreateSectionInPageMutation } from './useCreateSectionInPageMutation';
export { useCreateSectionInSectionMutation } from './useCreateSectionInSectionMutation';

// Sibling creation mutations
export { useCreateSiblingAboveMutation } from './useCreateSiblingAboveMutation';
export { useCreateSiblingBelowMutation } from './useCreateSiblingBelowMutation'; 