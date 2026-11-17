/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MantineProvider } from '@mantine/core';
import type * as SharedRegistry from '@selfhelp/shared/registry';

/**
 * A plugin style receives the popup its page is shown in (`pageModal`), so it
 * can close it after a save like the core form does with
 * `close_modal_on_save` (SurveyJS upgrade H2).
 */
interface IPageModalProp {
    pageModal: { inModal: boolean; closeModal: () => void };
}

function QaPluginStyle({ pageModal }: IPageModalProp) {
    return (
        <button type="button" onClick={pageModal.closeModal}>
            {pageModal.inModal ? 'qa in popup' : 'qa on page'}
        </button>
    );
}

vi.mock('../../plugin-runtime', () => ({
    usePluginRuntime: () => ({ isLoading: false }),
    usePluginStyleComponent: (name: string) => (name === 'qa-plugin-style' ? QaPluginStyle : undefined),
}));

vi.mock('@selfhelp/shared/registry', async (importOriginal) => {
    const actual = await importOriginal<typeof SharedRegistry>();
    return { ...actual, isStyleSupportedOnPlatform: () => true };
});

const { default: BasicStyle } = await import('../BasicStyle');
const { PageModalProvider } = await import('../../../contexts/PageModalContext');

const section = { id: 1, style_name: 'qa-plugin-style' } as never;

describe('BasicStyle: page popup for plugin styles', () => {
    it('lets a plugin style inside a popup close it', async () => {
        const closeModal = vi.fn();
        render(
            <MantineProvider>
                <PageModalProvider value={{ inModal: true, closeModal }}>
                    <BasicStyle style={section} />
                </PageModalProvider>
            </MantineProvider>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'qa in popup' }));
        expect(closeModal).toHaveBeenCalledTimes(1);
    });

    it('tells a plugin style on a plain page that there is no popup', () => {
        render(
            <MantineProvider>
                <BasicStyle style={section} />
            </MantineProvider>,
        );

        expect(screen.getByRole('button', { name: 'qa on page' })).toBeInTheDocument();
    });
});
