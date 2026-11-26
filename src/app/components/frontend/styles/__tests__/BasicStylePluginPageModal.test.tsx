/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type * as SharedRegistry from '@selfhelp/shared/registry';
import { renderWithProviders } from '../../../../../test-utils/renderWithProviders';

/**
 * A plugin style receives the popup its page is shown in (`pageModal`), so it
 * can close it after a save like the core form does with
 * `close_modal_on_save` (SurveyJS upgrade H2), and the page it is on (`page`),
 * which it names in its calls so the server checks access and reads the
 * section's settings (rule 7.7).
 */
interface IQaPluginProps {
    pageModal: { inModal: boolean; closeModal: () => void };
    page: { id: number | null; languageId: number | null; preview: boolean; routeParams: Record<string, string> };
}

function QaPluginStyle({ pageModal, page }: IQaPluginProps) {
    return (
        <>
            <button type="button" onClick={pageModal.closeModal}>
                {pageModal.inModal ? 'qa in popup' : 'qa on page'}
            </button>
            <output aria-label="qa page">{JSON.stringify(page)}</output>
        </>
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

vi.mock('../../../../../hooks/usePageContentValue', () => ({
    usePageContentValue: () => ({ id: 42, route_params: { record: '7' } }),
}));

vi.mock('../../../contexts/LanguageContext', () => ({
    useLanguageContext: () => ({ currentLanguageId: 3 }),
}));

const { default: BasicStyle } = await import('../BasicStyle');
const { PageModalProvider } = await import('../../../contexts/PageModalContext');

const section = { id: 1, style_name: 'qa-plugin-style' } as never;

describe('BasicStyle: what a plugin style gets from the host', () => {
    it('lets a plugin style inside a popup close it', async () => {
        const closeModal = vi.fn();
        renderWithProviders(
            <PageModalProvider value={{ inModal: true, closeModal }}>
                <BasicStyle style={section} />
            </PageModalProvider>,
        );

        await userEvent.click(screen.getByRole('button', { name: 'qa in popup' }));
        expect(closeModal).toHaveBeenCalledTimes(1);
    });

    it('tells a plugin style on a plain page that there is no popup', () => {
        renderWithProviders(<BasicStyle style={section} />);

        expect(screen.getByRole('button', { name: 'qa on page' })).toBeInTheDocument();
    });

    it('tells a plugin style the page, language, preview state and route it is drawn with', () => {
        renderWithProviders(<BasicStyle style={section} />, { previewMode: true });

        expect(JSON.parse(screen.getByLabelText('qa page').textContent ?? '')).toEqual({
            id: 42,
            languageId: 3,
            preview: true,
            routeParams: { record: '7' },
        });
    });
});
