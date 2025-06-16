/**
 * Centralized exports for all section-related React Query mutation hooks.
 * This file provides a single import point for all section mutation hooks.
 * 
 * @module hooks/mutations/sections
 */

// Page-Section mutations
export { useAddSectionToPageMutation } from './useAddSectionToPageMutation';
export { useUpdateSectionInPageMutation } from './useUpdateSectionInPageMutation';
export { useRemoveSectionFromPageMutation } from './useRemoveSectionFromPageMutation';

// Section-Section mutations
export { useAddSectionToSectionMutation } from './useAddSectionToSectionMutation';
export { useUpdateSectionInSectionMutation } from './useUpdateSectionInSectionMutation';
export { useRemoveSectionFromSectionMutation } from './useRemoveSectionFromSectionMutation'; 