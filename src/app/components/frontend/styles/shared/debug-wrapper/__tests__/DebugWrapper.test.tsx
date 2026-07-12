/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { renderWithProviders } from '../../../../../../../test-utils/renderWithProviders';
import DebugWrapper from '../DebugWrapper';

const jsonEditorSpy = vi.fn();

vi.mock('json-edit-react', () => ({
    JsonEditor: (props: { theme: { displayName: string } }) => {
        jsonEditorSpy(props);
        return <div data-testid="json-editor" data-theme={props.theme.displayName} />;
    },
    githubDarkTheme: { displayName: 'Github Dark', styles: {} },
    githubLightTheme: { displayName: 'Github Light', styles: {} },
}));

const computedColorScheme = vi.fn<() => 'light' | 'dark'>(() => 'light');

vi.mock('@mantine/core', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as Record<string, unknown>),
        useComputedColorScheme: () => computedColorScheme(),
    };
});

type DebugWrapperStyle = ComponentProps<typeof DebugWrapper>['style'];

const makeStyle = (overrides: Record<string, unknown> = {}): DebugWrapperStyle =>
    ({
        id: 252,
        style_name: 'badge',
        section_name: 'team-members-list-card-role',
        debug: 1,
        ...overrides,
    }) as unknown as DebugWrapperStyle;

async function openDebugPopover(): Promise<void> {
    fireEvent.mouseEnter(screen.getByRole('button'));
    await waitFor(() => {
        expect(jsonEditorSpy).toHaveBeenCalled();
    });
}

describe('DebugWrapper', () => {
    beforeEach(() => {
        jsonEditorSpy.mockClear();
        computedColorScheme.mockReturnValue('light');
    });

    it('does not render debug chrome when debug is disabled', () => {
        renderWithProviders(
            <DebugWrapper style={makeStyle({ debug: 0 })}>
                <span>content</span>
            </DebugWrapper>,
        );

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
        expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('uses the dark JSON editor theme when computed color scheme is dark', async () => {
        computedColorScheme.mockReturnValue('dark');

        renderWithProviders(
            <DebugWrapper style={makeStyle()}>
                <span>content</span>
            </DebugWrapper>,
        );

        await openDebugPopover();

        expect(jsonEditorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                theme: expect.objectContaining({ displayName: 'Github Dark' }),
            }),
        );
    });

    it('uses the light JSON editor theme when computed color scheme is light', async () => {
        computedColorScheme.mockReturnValue('light');

        renderWithProviders(
            <DebugWrapper style={makeStyle()}>
                <span>content</span>
            </DebugWrapper>,
        );

        await openDebugPopover();

        expect(jsonEditorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                theme: expect.objectContaining({ displayName: 'Github Light' }),
            }),
        );
    });
});
