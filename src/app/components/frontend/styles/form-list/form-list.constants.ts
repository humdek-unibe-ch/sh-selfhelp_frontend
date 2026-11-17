/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { RESTORE_TEXT } from '../../../shared/history/restore-preview';

/**
 * The words a form list draws around the author's content.
 *
 * Author text (the add button, the empty text, the search placeholder and the
 * delete confirmation) comes from the server in the visitor's language
 * (`list.labels`); these are what is shown when the author set none, and the
 * fixed chrome (history, conflicts, discard prompts) that is not author text.
 * The web app has no UI translation library yet, so the chrome is English.
 */
export const FORM_LIST_TEXT = {
    add: 'Add entry',
    empty: 'No entries yet.',
    emptyFiltered: 'No entries match your search or filters.',
    search: 'Search',
    searchShort: 'Type at least 2 characters to search.',
    clearSearch: 'Clear search',
    /** Empty choice in a select / multi-select filter control. */
    filterAny: 'Any',
    resetFilters: 'Reset search and filters',
    confirmDelete: 'Delete this entry? This cannot be undone.',
    loading: 'Loading entries',
    loadFailed: 'The list could not be loaded.',
    refreshFailed: 'The list could not be refreshed. The entries shown may be out of date.',
    retry: 'Try again',
    backToList: 'Back to the list',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    history: 'History',
    details: 'Details',
    cancel: 'Cancel',
    close: 'Close',
    entry: 'Entry',
    editTitle: 'Edit entry',
    viewTitle: 'Entry',
    saved: 'Entry saved.',
    created: 'Entry created.',
    deleted: 'Entry deleted.',
    actionDone: 'Done.',
    discardTitle: 'Discard your changes?',
    discardBody: 'You have changes that are not saved. If you leave now they are lost.',
    discardConfirm: 'Discard changes',
    keepEditing: 'Keep editing',
    notFound: 'This entry no longer exists or you may not open it.',
    noForm: 'This list has no form to create or edit entries.',
    notConfigured: 'This list is not configured yet.',
    cannotEdit: 'You may not edit this entry.',
    conflictTitle: 'Someone else changed this entry',
    conflictBody: 'Your changes were not saved, and what you typed is still in the form.',
    conflictReview: 'Review what changed',
    conflictKeep: 'Keep my changes and save over theirs',
    conflictReload: 'Load the latest version',
    conflictKeepHint: 'Your changes will replace the newer version when you press save.',
    conflictDeleteBody: 'This entry was changed by someone else, so it was not deleted. Reload the list to see the latest version.',
    conflictReloadList: 'Reload the list',
    loginRequired: 'Sign in to see your entries.',
    forbidden: 'You may not use this list.',
    invalidLink: 'This link does not describe a valid list state.',
    showAll: 'Show the whole list',
    sortBy: 'Sort by',
    previous: 'Previous',
    next: 'Next',
    historyEmpty: 'No earlier versions are available.',
    historyCurrent: 'Current version',
    historyCompare: 'Compare selected',
    historyCompareCurrent: 'Compare with current',
    historyRestore: 'Restore this version',
    historyRestorePreview: RESTORE_TEXT.preview,
    historyRestoreConfirm: RESTORE_TEXT.confirm,
    historyRestoreOnlyPossible: RESTORE_TEXT.onlyPossible,
    historyBlockedTitle: RESTORE_TEXT.blockedTitle,
    historyNothingToRestore: RESTORE_TEXT.nothing,
    historyChecks: 'Select two versions to compare',
    historyAvailableNo: RESTORE_TEXT.fileUnavailable,
    historyDenied: 'The history of this entry is not available to you.',
} as const;

/** How long the search and text filters wait after the last keystroke before the list reads again. */
export const FORM_LIST_INPUT_DEBOUNCE_MS = 350;

/** Phone width below which the record dialog fills the screen. */
export const FORM_LIST_COMPACT_QUERY = '(max-width: 48em)';
