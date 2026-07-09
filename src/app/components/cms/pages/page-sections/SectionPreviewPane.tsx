/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

/**
 * SectionPreviewPane — a FLOATING, draggable companion preview that hovers over
 * the section editor and FOLLOWS the currently selected section. It never
 * reflows the tree: it is `position: fixed` and can be dragged out of the way by
 * its header and resized from its corner.
 *
 * It reuses the SAME inline public renderer the CMS Live Preview uses
 * (`LivePreviewWebPane` → `DynamicPageClient`), so the preview is real (no
 * admin-shape → public-shape converter) and always reflects the shared
 * draft/published `PreviewMode`. Selecting a section in the tree auto-scrolls the
 * panel to that section's `#section-{id}` anchor and pulses a highlight ring IN
 * THE SECTION'S OWN STYLE ACCENT colour, tying the tree and the preview together.
 *
 * @module components/cms/pages/page-sections/SectionPreviewPane
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionIcon, Anchor, Box, Group, Text, Tooltip } from '@mantine/core';
import { IconExternalLink, IconGripHorizontal, IconX } from '@tabler/icons-react';
import { LivePreviewWebPane } from '../../live-preview/LivePreviewWebPane';
import { usePreviewMode } from '../../../contexts/PreviewModeContext';
import { getStyleVisual } from '../../../../../utils/style-visuals';
import { useSectionPreviewScroll } from './useSectionPreviewScroll';
import styles from './SectionPreviewPane.module.css';

interface ISectionPreviewPaneProps {
    /** Keyword of the page being edited (null while it resolves). */
    keyword: string | null;
    /** The section to follow (scroll to + highlight), or null for none. */
    activeSectionId: number | null;
    /** Style name of the active section — drives the highlight accent colour. */
    activeSectionStyleName: string | null;
    /** Whether the active section can nest — feeds the style-visual fallback. */
    activeSectionCanHaveChildren: boolean;
    /** Close the floating panel. */
    onClose: () => void;
}

const PANEL_WIDTH = 460;
const PANEL_HEIGHT = 560;
const MARGIN = 24;

/** Initial position: bottom-right, clamped into the viewport. */
function initialPosition(): { x: number; y: number } {
    if (typeof window === 'undefined') return { x: MARGIN, y: MARGIN };
    return {
        x: Math.max(MARGIN, window.innerWidth - PANEL_WIDTH - MARGIN),
        y: Math.max(MARGIN, window.innerHeight - PANEL_HEIGHT - MARGIN),
    };
}

export function SectionPreviewPane({
    keyword,
    activeSectionId,
    activeSectionStyleName,
    activeSectionCanHaveChildren,
    onClose,
}: ISectionPreviewPaneProps) {
    const { isPreviewMode } = usePreviewMode();
    const bodyRef = useRef<HTMLDivElement>(null);

    const [pos, setPos] = useState(initialPosition);
    const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

    // Drag by the header. Pointer events (not mouse) so it works with touch/pen,
    // and pointer capture keeps the drag alive even if the cursor outruns the panel.
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }, [pos.x, pos.y]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        const nextX = drag.originX + (e.clientX - drag.startX);
        const nextY = drag.originY + (e.clientY - drag.startY);
        // Keep the header grabbable: clamp so the panel never leaves the viewport.
        const maxX = window.innerWidth - 120;
        const maxY = window.innerHeight - 48;
        setPos({
            x: Math.min(Math.max(-PANEL_WIDTH + 160, nextX), maxX),
            y: Math.min(Math.max(0, nextY), maxY),
        });
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        dragRef.current = null;
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }, []);

    // Close on Escape, mirroring modal/drawer dismissal conventions.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    // The highlight ring is drawn in the active section's own unique hue.
    const accentHue = activeSectionStyleName
        ? getStyleVisual(activeSectionStyleName, activeSectionCanHaveChildren).hue
        : 220;

    useSectionPreviewScroll({
        rootRef: bodyRef,
        sectionId: activeSectionId,
        active: keyword != null,
        accentHue,
        highlightClass: styles.highlight,
    });

    const fullPreviewHref = keyword ? `/admin/preview/${encodeURIComponent(keyword)}` : '/admin/preview/home';

    return (
        <Box
            className={styles.pane}
            style={{ left: pos.x, top: pos.y, width: PANEL_WIDTH, height: PANEL_HEIGHT }}
            role="dialog"
            aria-label="Section preview"
        >
            <Group
                justify="space-between"
                px="sm"
                py={6}
                className={styles.paneHeader}
                wrap="nowrap"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
            >
                <Group gap={8} wrap="nowrap" className={styles.dragLabel}>
                    <IconGripHorizontal size={15} className={styles.dragIcon} />
                    <Text fw={600} size="sm">Preview</Text>
                    <Text size="xs" c="dimmed">{isPreviewMode ? 'Draft' : 'Published'}</Text>
                </Group>
                <Group gap={4} wrap="nowrap">
                    <Anchor href={fullPreviewHref} target="_blank" size="xs" onPointerDown={(e) => e.stopPropagation()}>
                        <Group gap={4} wrap="nowrap">
                            <IconExternalLink size={13} />
                            Full
                        </Group>
                    </Anchor>
                    <Tooltip label="Close preview (Esc)" position="left" withArrow>
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={onClose}
                            onPointerDown={(e) => e.stopPropagation()}
                            aria-label="Close preview"
                        >
                            <IconX size={16} />
                        </ActionIcon>
                    </Tooltip>
                </Group>
            </Group>
            <Box ref={bodyRef} className={styles.paneBody}>
                {keyword != null && (
                    <LivePreviewWebPane
                        keyword={keyword}
                        onNavigate={() => { /* preview is read-only; ignore in-pane navigation */ }}
                    />
                )}
            </Box>
        </Box>
    );
}
