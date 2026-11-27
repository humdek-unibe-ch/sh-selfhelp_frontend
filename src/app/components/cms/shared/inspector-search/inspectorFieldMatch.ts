/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Case-insensitive field matching for the shared inspector search.
 * Matches the visible label, technical name, help text and optional keywords.
 */

export interface ISearchableField {
    id: string;
    label?: string | null;
    name?: string | null;
    help?: string | null;
    /** Extra searchable strings (group titles, fixed-panel labels, …). */
    keywords?: ReadonlyArray<string | null | undefined>;
}

export function normalizeSearchQuery(query: string): string {
    return query.trim().toLowerCase();
}

export function matchesFieldQuery(field: ISearchableField, query: string): boolean {
    const q = normalizeSearchQuery(query);
    if (!q) {
        return true;
    }

    const haystacks: Array<string | null | undefined> = [
        field.label,
        field.name,
        field.help,
        ...(field.keywords ?? []),
    ];

    return haystacks.some((text) => (text ?? '').toLowerCase().includes(q));
}

export function countMatchingFields(
    fields: ReadonlyArray<ISearchableField>,
    query: string,
): number {
    const q = normalizeSearchQuery(query);
    if (!q) {
        return fields.length;
    }
    return fields.filter((field) => matchesFieldQuery(field, q)).length;
}

/** True when the event target is a text field or rich-text surface. */
export function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return true;
    }
    // jsdom often leaves `isContentEditable` false on detached nodes; also
    // accept the attribute and the contenteditable="true" ancestor.
    const contentEditableAttr = target.getAttribute('contenteditable');
    if (
        target.isContentEditable ||
        contentEditableAttr === 'true' ||
        contentEditableAttr === ''
    ) {
        return true;
    }
    if (target.closest('[contenteditable="true"], [contenteditable=""]')) {
        return true;
    }
    if (target.closest('.ProseMirror, .ql-editor, [role="textbox"]')) {
        return true;
    }
    return false;
}
