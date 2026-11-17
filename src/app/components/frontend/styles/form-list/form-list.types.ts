/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import type { IFormListSelected, TFormListMode } from '../../../../../shared';

/**
 * What the record area of a list shows for the URL state:
 * - `loading`: the URL names a record or the create mode and its state is on the way;
 * - `create`: the inline form for a new record;
 * - `edit`: the inline form on the record the person opened (a snapshot, so a
 *   background refresh never replaces what they are typing);
 * - `view`: the record read-only, with its history;
 * - `unavailable`: the record is not there or may not be opened.
 */
export type TFormListPanel =
    | { kind: 'loading'; mode: TFormListMode }
    | { kind: 'create' }
    | { kind: 'edit'; selected: IFormListSelected }
    | { kind: 'view'; selected: IFormListSelected }
    | { kind: 'unavailable' };
