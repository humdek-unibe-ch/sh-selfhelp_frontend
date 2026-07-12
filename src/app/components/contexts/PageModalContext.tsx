/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
/**
 * Modal-page context.
 *
 * When a page has the `open_in_modal` property, `DynamicPageClient` renders its
 * content inside a modal overlay (page title as header + close button) instead
 * of a full page — used to open CMS-in-CMS create/edit/detail pages from a list.
 *
 * This context lets content rendered inside that modal (e.g. a form) know it is
 * in a modal and ask to close it (`closeModal`) — for example after a successful
 * submit when `close_modal_on_save` is set. Outside a modal `inModal` is false
 * and `closeModal` is a no-op, so consumers can call it unconditionally.
 *
 * @module contexts/PageModalContext
 */

'use client';

import { createContext, useContext } from 'react';

export interface IPageModalContextValue {
    /** True when the surrounding page content is rendered inside a modal. */
    inModal: boolean;
    /** Close the surrounding modal (no-op when not in a modal). */
    closeModal: () => void;
}

const PageModalContext = createContext<IPageModalContextValue>({
    inModal: false,
    closeModal: () => {},
});

export const PageModalProvider = PageModalContext.Provider;

/** Read the modal context. Always returns a value (no-op default outside a modal). */
export function usePageModal(): IPageModalContextValue {
    return useContext(PageModalContext);
}
