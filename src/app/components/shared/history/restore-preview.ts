/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { IFormListRestoreBlocker, IFormListRestoreChange } from '../../../../shared';

/** Words of a record restore, shared by the form-list history and the data browser. */
export const RESTORE_TEXT = {
    preview: 'What a restore would change',
    confirm: 'Restore',
    onlyPossible: 'Restore only what can be restored',
    blockedTitle: 'Some fields cannot be restored',
    nothing: 'The entry already matches this version.',
    fileUnavailable: 'file no longer available',
} as const;

export const RESTORE_BLOCKER_WORDS: Record<IFormListRestoreBlocker['reason'], string> = {
    field_missing: 'the field no longer exists',
    language_missing: 'the language no longer exists',
    file_unavailable: 'the file is no longer available',
    invalid_value: 'the value is no longer valid',
};

export function restoreBlockerKey(fieldKey: string, languageId: number): string {
    return `${fieldKey}:${languageId}`;
}

/** Field keys of the dry-run changes that no blocker refuses (what a partial restore sends). */
export function restorableFieldKeys(
    changes: readonly IFormListRestoreChange[],
    blockers: readonly IFormListRestoreBlocker[],
): string[] {
    const blocked = new Set(blockers.map((blocker) => restoreBlockerKey(blocker.field_key, blocker.language_id)));
    return [...new Set(changes
        .filter((change) => !blocked.has(restoreBlockerKey(change.field_key, change.language_id)))
        .map((change) => change.field_key))];
}
