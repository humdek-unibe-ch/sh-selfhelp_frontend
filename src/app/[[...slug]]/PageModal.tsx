/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * Standardized page modal for `open_in_modal` pages (web only).
 *
 * Every page that opts into `open_in_modal` is rendered through THIS component,
 * so all such modals share the exact same chrome as the rest of the app's
 * modals (matching the admin `ModalWrapper`): a clearly separated header band
 * with the page title + a single close button, and a scrollable body. The only
 * difference from `ModalWrapper` is that page modals have NO footer.
 *
 * Authors only control the box SIZE via the page properties
 * `modal_width` / `modal_height`:
 *
 *   - empty / unset -> the default 80% of the viewport (so every modal is the
 *     same size unless an author opts out);
 *   - a CSS length  -> `'80%'`, `'640px'`, `'48rem'`, `'90vw'`, ...;
 *   - `'auto'`      -> the box grows to fit its content.
 *
 * Whatever the value, the box is capped at 90% of the viewport (`90vw` / `90vh`)
 * so it never overflows the screen, and the body scrolls when the content is
 * taller than the (capped) box. Mirrors `IPageContent.modal_width|modal_height`
 * (`@selfhelp/shared`), projected by the backend `PageService`.
 *
 * Closing (the X button, the backdrop, or Escape) hides the overlay IMMEDIATELY
 * via local state — so it always closes even if the back-navigation below is a
 * no-op — and then returns to the previous page (`onClose`).
 */

import { Modal, Group, Text, CloseButton, Box } from '@mantine/core';
import { useCallback, useState, type ReactNode } from 'react';
import styles from './PageModal.module.css';

/** Applied when a modal dimension is unset/empty: 80% of the viewport. */
const DEFAULT_MODAL_DIMENSION = '80%';
/** Hard cap so a modal (including `auto`) never exceeds 90% of the viewport. */
const MODAL_WIDTH_CAP = '90vw';
const MODAL_HEIGHT_CAP = '90vh';

/** Resolve an authored dimension to a concrete CSS value (default 80%). */
function resolveDimension(value: string | null | undefined): string {
    const trimmed = (value ?? '').trim();
    return trimmed === '' ? DEFAULT_MODAL_DIMENSION : trimmed;
}

interface IPageModalProps {
    /** Plain-text page title shown in the standardized modal header. */
    title: string;
    /** `modal_width` page property: CSS length, `'auto'`, or null/empty (=> 80%). */
    width?: string | null;
    /** `modal_height` page property: CSS length, `'auto'`, or null/empty (=> 80%). */
    height?: string | null;
    /** Close handler (returns to the previous page, which refetches). */
    onClose: () => void;
    /** Mirrors the page wrapper's `data-language-changing` flag for tests/styling. */
    dataLanguageChanging?: boolean;
    children: ReactNode;
}

export function PageModal({
    title,
    width,
    height,
    onClose,
    dataLanguageChanging,
    children,
}: IPageModalProps) {
    // Controlled open state so a close visibly takes effect immediately, even if
    // the back-navigation in `onClose` cannot go anywhere (e.g. the modal page
    // was opened directly). Without this the modal could appear "stuck".
    const [opened, setOpened] = useState(true);

    const resolvedWidth = resolveDimension(width);
    const resolvedHeight = resolveDimension(height);
    const widthIsAuto = resolvedWidth.toLowerCase() === 'auto';
    const heightIsAuto = resolvedHeight.toLowerCase() === 'auto';

    const handleClose = useCallback(() => {
        setOpened(false);
        onClose();
    }, [onClose]);

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            centered
            withCloseButton={false}
            data-language-changing={dataLanguageChanging}
            classNames={{ content: styles.modalContent, body: styles.modalBody }}
            styles={{
                // Box sizing lives on `content`. Width/height honor the authored
                // value (default 80%); `auto` fits content. Both axes are capped
                // at 90% of the viewport.
                content: {
                    width: widthIsAuto ? 'fit-content' : resolvedWidth,
                    maxWidth: MODAL_WIDTH_CAP,
                    height: heightIsAuto ? undefined : resolvedHeight,
                    maxHeight: MODAL_HEIGHT_CAP,
                },
            }}
        >
            {/* Separated header band (page title + close), same look as ModalWrapper. */}
            <Group justify="space-between" align="center" p="md" wrap="nowrap" className={styles.modalHeader}>
                <Text size="lg" fw={600} lineClamp={1}>
                    {title}
                </Text>
                <CloseButton onClick={handleClose} aria-label="Close" />
            </Group>

            {/* Scrollable body — no footer (the one difference from ModalWrapper). */}
            <Box p="md" className={styles.modalScroll}>
                {children}
            </Box>
        </Modal>
    );
}
