/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { SectionPreviewPane } from '../SectionPreviewPane';

// The real pane pulls in the entire public renderer + React Query; the docked
// pane's own behaviour (follow the selected section: scroll-to + highlight) is
// what we test, so stub the pane with a lightweight element carrying the anchor.
vi.mock('../../../live-preview/LivePreviewWebPane', () => ({
    LivePreviewWebPane: ({ keyword }: { keyword: string }) => (
        <div data-testid="web-pane" data-keyword={keyword}>
            <div id="section-7">rendered section 7</div>
        </div>
    ),
}));

vi.mock('../../../../contexts/PreviewModeContext', () => ({
    usePreviewMode: () => ({ isPreviewMode: true, togglePreviewMode: vi.fn() }),
}));

function renderPane(props: Partial<React.ComponentProps<typeof SectionPreviewPane>> = {}) {
    return render(
        <MantineProvider>
            <SectionPreviewPane
                keyword="consent-page"
                activeSectionId={7}
                activeSectionStyleName="container"
                activeSectionCanHaveChildren
                onClose={vi.fn()}
                {...props}
            />
        </MantineProvider>,
    );
}

describe('SectionPreviewPane', () => {
    beforeEach(() => {
        Element.prototype.scrollIntoView = vi.fn(); // jsdom has no scrollIntoView
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders the reused public pane for the page keyword', () => {
        renderPane();
        expect(screen.getByTestId('web-pane')).toHaveAttribute('data-keyword', 'consent-page');
    });

    it('shows the current draft/published preview state in the header', () => {
        renderPane();
        expect(screen.getByText('Draft')).toBeInTheDocument();
    });

    it('scrolls to the followed section and highlights it in its style accent', async () => {
        renderPane();
        await waitFor(
            () => expect(Element.prototype.scrollIntoView).toHaveBeenCalled(),
            { timeout: 2000 },
        );
        // The highlight accent is driven onto the anchor as an hsl() from the
        // section's unique hue.
        const target = document.getElementById('section-7');
        expect(target?.style.getPropertyValue('--section-preview-accent')).toMatch(/^hsl\(/);
    });

    it('does not render the pane when no keyword is resolved yet', () => {
        renderPane({ keyword: null });
        expect(screen.queryByTestId('web-pane')).not.toBeInTheDocument();
    });

    it('closes when Escape is pressed', () => {
        const onClose = vi.fn();
        renderPane({ onClose });
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('is a floating dialog positioned via inline coordinates (never reflows the tree)', () => {
        renderPane();
        const dialog = screen.getByRole('dialog', { name: 'Section preview' });
        // The panel is driven by inline left/top/size (the CSS module supplies
        // `position: fixed`, which jsdom does not compute). Assert the inline
        // coordinates that keep it a free-floating overlay.
        expect(dialog.style.left).not.toBe('');
        expect(dialog.style.top).not.toBe('');
        expect(dialog.style.width).toBe('460px');
    });
});
