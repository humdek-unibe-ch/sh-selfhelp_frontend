/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { asRecordVersion } from '../shared';

/**
 * Helpers of the write requests (`POST /forms/submit`, `PUT /forms/update`,
 * `DELETE /forms/delete`, quick actions, restore) that do not need React.
 *
 * The server judges a write by the page version the person is looking at: the
 * published one, or the draft when the page was asked for with `preview`. A client
 * names the draft exactly when it shows the draft, and never decides what the draft
 * allows; the rules stay on the server.
 */

/** Add `preview` to a JSON write body when the person looks at the draft. */
export function withPreview<T extends object>(body: T, preview: boolean): T & { preview?: boolean } {
    return preview ? { ...body, preview: true } : body;
}

/**
 * Add `preview` to a multipart write when the person looks at the draft. Returns a copy: a
 * retried request must not find the field of an earlier attempt, and the caller's form data
 * stays what the person sent.
 */
export function withPreviewFormData(body: FormData, preview: boolean): FormData {
    if (!preview) {
        return body;
    }
    const copy = new FormData();
    body.forEach((value, key) => {
        if (key !== 'preview') {
            copy.append(key, value);
        }
    });
    copy.append('preview', '1');
    return copy;
}

/**
 * The version of a record a page offers, from a value of the page payload (a number, digits, or a
 * `{ content }` field of a section). `null` when the page offered none: the caller then cannot
 * save or delete the record, because the server refuses a write that names no version.
 */
export function offeredRecordVersion(value: unknown): number | null {
    if (value !== null && typeof value === 'object' && 'content' in value) {
        return asRecordVersion((value as { content?: unknown }).content);
    }
    return asRecordVersion(value);
}
