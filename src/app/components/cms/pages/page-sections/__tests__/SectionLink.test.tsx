/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SectionLink from '../SectionLink';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: pushMock }),
    usePathname: () => '/admin/pages/my-page',
}));

// next/link renders a plain anchor so the native-navigation behaviour is testable.
vi.mock('next/link', () => ({
    default: ({ children, ...props }: React.ComponentProps<'a'>) => <a {...props}>{children}</a>,
}));

describe('SectionLink', () => {
    beforeEach(() => {
        pushMock.mockClear();
    });

    afterEach(() => {
        cleanup();
    });

    it('selects the section when the row itself is clicked', async () => {
        const onSectionSelect = vi.fn();
        const user = userEvent.setup();

        render(
            <SectionLink sectionId={7} onSectionSelect={onSectionSelect}>
                <span>row body</span>
            </SectionLink>,
        );

        await user.click(screen.getByText('row body'));

        expect(onSectionSelect).toHaveBeenCalledWith(7);
        expect(pushMock).toHaveBeenCalledWith('/admin/pages/my-page/7', { scroll: false });
    });

    it('does not select the section when an action button inside the row is clicked', async () => {
        const onSectionSelect = vi.fn();
        const user = userEvent.setup();

        render(
            <SectionLink sectionId={7} onSectionSelect={onSectionSelect}>
                <button type="button" data-action-button="true">
                    add
                </button>
            </SectionLink>,
        );

        await user.click(screen.getByRole('button', { name: 'add' }));

        expect(onSectionSelect).not.toHaveBeenCalled();
        expect(pushMock).not.toHaveBeenCalled();
    });

    it('does not select the section when a Mantine ActionIcon (menu trigger) is clicked', async () => {
        const onSectionSelect = vi.fn();
        const user = userEvent.setup();

        render(
            <SectionLink sectionId={7} onSectionSelect={onSectionSelect}>
                <button
                    type="button"
                    className="mantine-ActionIcon-root"
                    data-action-button="true"
                    aria-label="add"
                >
                    +
                </button>
            </SectionLink>,
        );

        await user.click(screen.getByRole('button', { name: 'add' }));

        expect(onSectionSelect).not.toHaveBeenCalled();
        expect(pushMock).not.toHaveBeenCalled();
    });
});
