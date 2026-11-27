/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRef, useState } from 'react';
import { renderWithProviders } from '../../../../../../test-utils/renderWithProviders';
import { InspectorFieldSearch } from '../InspectorFieldSearch';
import {
    matchesFieldQuery,
    countMatchingFields,
    isTypingTarget,
} from '../inspectorFieldMatch';
import { useInspectorFieldFilter } from '../useInspectorFieldFilter';

describe('matchesFieldQuery', () => {
    const field = {
        id: '1',
        label: 'Submit label',
        name: 'label_submit',
        help: 'Shown on the save button',
    };

    it('matches label, name and help text (case-insensitive)', () => {
        expect(matchesFieldQuery(field, 'submit')).toBe(true);
        expect(matchesFieldQuery(field, 'LABEL_SUBMIT')).toBe(true);
        expect(matchesFieldQuery(field, 'save button')).toBe(true);
        expect(matchesFieldQuery(field, 'zzz')).toBe(false);
    });

    it('counts matches and treats empty query as all', () => {
        const fields = [field, { id: '2', name: 'url', label: 'URL' }];
        expect(countMatchingFields(fields, '')).toBe(2);
        expect(countMatchingFields(fields, 'url')).toBe(1);
        expect(countMatchingFields(fields, 'zzz')).toBe(0);
    });
});

describe('isTypingTarget', () => {
    it('detects inputs and contenteditable surfaces', () => {
        const input = document.createElement('input');
        expect(isTypingTarget(input)).toBe(true);

        const div = document.createElement('div');
        expect(isTypingTarget(div)).toBe(false);

        const editable = document.createElement('div');
        editable.setAttribute('contenteditable', 'true');
        expect(isTypingTarget(editable)).toBe(true);
    });
});

function SearchHarness({ resetKey }: { resetKey?: string | number }) {
    const filter = useInspectorFieldFilter({ resetKey });
    return (
        <div data-admin-page-editor>
            <button type="button">Outside</button>
            <InspectorFieldSearch
                query={filter.query}
                onQueryChange={filter.setQuery}
                onClear={filter.clear}
                onInputKeyDown={filter.handleInputKeyDown}
                inputRef={filter.inputRef}
                matchCount={filter.isActive ? 0 : undefined}
            />
        </div>
    );
}

describe('InspectorFieldSearch UI', () => {
    it('shows the empty state and clears with Esc', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SearchHarness />);

        const input = screen.getByRole('textbox', { name: 'Search fields' });
        await user.type(input, 'zzz');
        expect(screen.getByText(/No field matches 'zzz'/)).toBeInTheDocument();

        await user.keyboard('{Escape}');
        expect(input).toHaveValue('');
        expect(screen.queryByText(/No field matches/)).not.toBeInTheDocument();
    });

    it('focuses via / and Ctrl+K when focus is in the editor', async () => {
        const user = userEvent.setup();
        renderWithProviders(<SearchHarness />);

        await user.click(screen.getByRole('button', { name: 'Outside' }));
        await user.keyboard('/');
        expect(screen.getByRole('textbox', { name: 'Search fields' })).toHaveFocus();

        await user.click(screen.getByRole('button', { name: 'Outside' }));
        await user.keyboard('{Control>}k{/Control}');
        expect(screen.getByRole('textbox', { name: 'Search fields' })).toHaveFocus();
    });

    it('does not steal / while typing in another input', async () => {
        const user = userEvent.setup();

        function WithOtherInput() {
            const [other, setOther] = useState('');
            const filter = useInspectorFieldFilter();
            const otherRef = useRef<HTMLInputElement>(null);
            return (
                <div data-admin-page-editor>
                    <input
                        ref={otherRef}
                        aria-label="Other field"
                        value={other}
                        onChange={(e) => setOther(e.target.value)}
                    />
                    <InspectorFieldSearch
                        query={filter.query}
                        onQueryChange={filter.setQuery}
                        onClear={filter.clear}
                        onInputKeyDown={filter.handleInputKeyDown}
                        inputRef={filter.inputRef}
                    />
                </div>
            );
        }

        renderWithProviders(<WithOtherInput />);
        const other = screen.getByRole('textbox', { name: 'Other field' });
        await user.click(other);
        await user.keyboard('/');
        expect(other).toHaveFocus();
        expect(other).toHaveValue('/');
        expect(screen.getByRole('textbox', { name: 'Search fields' })).not.toHaveFocus();
    });

    it('resets the query when resetKey changes', async () => {
        const user = userEvent.setup();
        const { rerender } = renderWithProviders(<SearchHarness resetKey={1} />);

        const input = screen.getByRole('textbox', { name: 'Search fields' });
        await user.type(input, 'url');
        expect(input).toHaveValue('url');

        rerender(<SearchHarness resetKey={2} />);
        expect(screen.getByRole('textbox', { name: 'Search fields' })).toHaveValue('');
    });
});

describe('InspectorFieldSearch clear button', () => {
    it('clears from the empty-state button', async () => {
        const user = userEvent.setup();
        const onClear = vi.fn();
        const onQueryChange = vi.fn();
        const inputRef = { current: null };

        renderWithProviders(
            <InspectorFieldSearch
                query="zzz"
                onQueryChange={onQueryChange}
                onClear={onClear}
                onInputKeyDown={() => {}}
                inputRef={inputRef}
                matchCount={0}
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Clear' }));
        expect(onClear).toHaveBeenCalled();
    });
});
