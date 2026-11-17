/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { createContext, useContext } from 'react';
import type { IFormStaleVersionData } from '../../../../../shared';

/** What a successful save of the inline form tells the list. */
export interface IFormListFormSaved {
    /** The record that was created or changed (null when the server did not say). */
    recordId: number | null;
    /** The record's version after the save. */
    version: number | null;
    /** True when the save created the record. */
    created: boolean;
}

/**
 * What an `entry-form-list` hands to the one inline form it draws.
 *
 * The form is a normal child section of the list (an `entry-record-form`,
 * `form-record` or `form-log`); it keeps its own inputs, validation and
 * submit pipeline. Inside this context `FormStyle` edits the record the list
 * opened (or creates a new one), sends the version it started from, and
 * reports back instead of resetting, redirecting or closing a page modal on
 * its own. Outside a list the context is `null` and nothing changes.
 */
export interface IFormListFormContext {
    /** The record the form edits; null creates a new record. */
    recordId: number | null;
    /** The record's current values as the server sends them (`selected.form_values`); null for a new record. */
    prefill: Record<string, unknown> | unknown[] | null;
    /** The version the person started from; sent as `expected_version` on an update. */
    expectedVersion: number | null;
    onSaved: (result: IFormListFormSaved) => void;
    /** The record changed since the form was opened: nothing was written, the draft stays. */
    onStale: (data: IFormStaleVersionData) => void;
    onCancel: () => void;
    /** The form registers a function that says whether it holds input that was not saved. */
    registerDirtyCheck: (check: (() => boolean) | null) => void;
}

const FormListFormContext = createContext<IFormListFormContext | null>(null);

export const FormListFormProvider = FormListFormContext.Provider;

/** The list context of the inline form, or null for a form outside a list. */
export function useFormListForm(): IFormListFormContext | null {
    return useContext(FormListFormContext);
}
