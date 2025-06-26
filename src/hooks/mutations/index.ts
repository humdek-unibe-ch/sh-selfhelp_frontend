/**
 * Centralized exports for all React Query mutation hooks.
 * This file provides a single import point for all mutation hooks in the application.
 * 
 * @module hooks/mutations
 */

// Page mutations
export { useCreatePageMutation } from './useCreatePageMutation';
export { useUpdatePageMutation } from './useUpdatePageMutation';
export { useDeletePageMutation } from './useDeletePageMutation';

// Section mutations
export * from './sections';

// Future mutations will be exported here:
// export { useCreateUserMutation } from './useCreateUserMutation';
// export { useUpdateUserMutation } from './useUpdateUserMutation';
// export { useDeleteUserMutation } from './useDeleteUserMutation';

// Re-export utility types and functions
export type { IParsedError } from '../../utils/mutation-error-handler';
export { parseApiError, getOperationErrorMessage, ERROR_MESSAGES } from '../../utils/mutation-error-handler';

export { useUpdateLanguagePreferenceMutation } from './useUpdateLanguagePreferenceMutation'; 