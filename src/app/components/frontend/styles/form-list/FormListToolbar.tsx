/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
    ActionIcon,
    Button,
    Group,
    MultiSelect,
    SegmentedControl,
    Select,
    Stack,
    Text,
    TextInput,
    type ComboboxData,
} from '@mantine/core';
import { IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import type {
    IFormListControl,
    IFormListState,
    IFormListUrlState,
    TFormListUrlChange,
} from '../../../../../shared';
import { isSearchTermUsable } from '../../../../../utils/form-list.utils';
import { FORM_LIST_INPUT_DEBOUNCE_MS, FORM_LIST_TEXT } from './form-list.constants';

interface INavigateOptions {
    replace?: boolean;
}

interface IFormListToolbarProps {
    state: IFormListState;
    urlState: IFormListUrlState;
    /** Apply a change to the page URL. */
    onChange: (change: TFormListUrlChange, options?: INavigateOptions) => void;
    /** The label of the add button (author text in the visitor's language). */
    addLabel: string;
    /** The search placeholder (author text). */
    searchLabel: string;
    /** Show the add button (an entry list the visitor may add to). */
    canCreate: boolean;
    onAdd: () => void;
}

/**
 * A text that follows the page URL but is committed to it only after the
 * person paused typing. The URL stays the single state: Back, a reset link or
 * a shared link change the text; typing changes the URL once per pause.
 */
function useDebouncedUrlText(urlValue: string, commit: (value: string) => void) {
    // What the person typed; null follows the URL.
    const [draft, setDraft] = useState<string | null>(null);
    // The trimmed text last sent to the URL (or the URL value when it changed elsewhere).
    const [committed, setCommitted] = useState(urlValue);
    const [seenUrl, setSeenUrl] = useState(urlValue);

    if (urlValue !== seenUrl) {
        setSeenUrl(urlValue);
        if (urlValue !== committed) {
            // The URL changed somewhere else (Back button, reset link): show it.
            setDraft(null);
            setCommitted(urlValue);
        }
    }

    const text = draft ?? urlValue;

    useEffect(() => {
        if (draft === null || draft.trim() === committed) {
            return undefined;
        }
        const timer = window.setTimeout(() => {
            setCommitted(draft.trim());
            commit(draft);
        }, FORM_LIST_INPUT_DEBOUNCE_MS);
        return () => window.clearTimeout(timer);
    }, [draft, committed, commit]);

    const flush = useCallback(() => {
        if (draft !== null && draft.trim() !== committed) {
            setCommitted(draft.trim());
            commit(draft);
        }
    }, [draft, committed, commit]);

    return { text, setText: setDraft, flush };
}

function SearchBox({ state, urlState, onChange, searchLabel }: Pick<IFormListToolbarProps, 'state' | 'urlState' | 'onChange' | 'searchLabel'>) {
    const commit = useCallback((value: string) => {
        const term = value.trim();
        if (term !== '' && !isSearchTermUsable(term)) {
            return;
        }
        onChange({ type: 'search', q: term === '' ? null : term }, { replace: true });
    }, [onChange]);
    const { text, setText, flush } = useDebouncedUrlText(urlState.q ?? '', commit);

    const tooShort = text.trim() !== '' && !isSearchTermUsable(text.trim());

    const submit = (event: FormEvent) => {
        event.preventDefault();
        flush();
    };

    return (
        <form role="search" onSubmit={submit} aria-label={`${searchLabel} ${state.list.key}`} style={{ flex: '1 1 14rem', minWidth: 0, maxWidth: '28rem' }}>
            <TextInput
                type="search"
                value={text}
                onChange={(event) => setText(event.currentTarget.value)}
                placeholder={searchLabel}
                aria-label={searchLabel}
                leftSection={<IconSearch size={16} aria-hidden="true" />}
                rightSection={text !== '' ? (
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        aria-label={FORM_LIST_TEXT.clearSearch}
                        onClick={() => {
                            setText('');
                            onChange({ type: 'search', q: null }, { replace: true });
                        }}
                    >
                        <IconX size={14} aria-hidden="true" />
                    </ActionIcon>
                ) : null}
                error={tooShort ? FORM_LIST_TEXT.searchShort : undefined}
                maxLength={100}
            />
        </form>
    );
}

interface IControlProps {
    control: IFormListControl;
    value: string;
    onValue: (value: string | null, options?: INavigateOptions) => void;
}

function TextControl({ control, value, onValue }: IControlProps) {
    const commit = useCallback((next: string) => onValue(next.trim() === '' ? null : next.trim(), { replace: true }), [onValue]);
    const { text, setText } = useDebouncedUrlText(value, commit);
    return (
        <TextInput
            label={control.label}
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
            style={{ minWidth: 0, flex: '1 1 10rem', maxWidth: '16rem' }}
        />
    );
}

function optionData(control: IFormListControl): ComboboxData {
    return (control.options ?? []).map((option) => ({
        value: option.value,
        label: option.count === null ? option.label : `${option.label} (${option.count})`,
    }));
}

function BooleanControl({ control, value, onValue }: IControlProps) {
    const normalized = ['1', 'true', 'yes'].includes(value.toLowerCase())
        ? '1'
        : (['0', 'false', 'no'].includes(value.toLowerCase()) ? '0' : '');
    return (
        <div role="group" aria-label={control.label}>
            <Text size="sm" fw={500} mb={4}>{control.label}</Text>
            <SegmentedControl
                size="sm"
                value={normalized}
                onChange={(next) => onValue(next === '' ? null : next)}
                data={[
                    { value: '', label: 'Any' },
                    { value: '1', label: 'Yes' },
                    { value: '0', label: 'No' },
                ]}
                aria-label={control.label}
            />
        </div>
    );
}

/** `from..to`, either side may be empty. */
function splitRange(value: string): [string, string] {
    const at = value.indexOf('..');
    if (at === -1) {
        return [value, ''];
    }
    return [value.slice(0, at), value.slice(at + 2)];
}

function RangeControl({ control, value, onValue, kind }: IControlProps & { kind: 'date' | 'number' }) {
    const [from, to] = splitRange(value);
    const join = (nextFrom: string, nextTo: string) => (nextFrom === '' && nextTo === '' ? null : `${nextFrom}..${nextTo}`);
    return (
        <Group gap="xs" align="flex-end" wrap="wrap" role="group" aria-label={control.label}>
            <TextInput
                type={kind}
                label={`${control.label} from`}
                value={from}
                onChange={(event) => onValue(join(event.currentTarget.value, to), { replace: kind === 'number' })}
                style={{ minWidth: 0, flex: '1 1 8rem', maxWidth: '12rem' }}
            />
            <TextInput
                type={kind}
                label={`${control.label} to`}
                value={to}
                onChange={(event) => onValue(join(from, event.currentTarget.value), { replace: kind === 'number' })}
                style={{ minWidth: 0, flex: '1 1 8rem', maxWidth: '12rem' }}
            />
        </Group>
    );
}

function Control({ control, urlState, onChange }: { control: IFormListControl; urlState: IFormListUrlState; onChange: IFormListToolbarProps['onChange'] }) {
    const value = urlState.filters[control.id] ?? '';
    const onValue = useCallback(
        (next: string | null, options?: INavigateOptions) => onChange({ type: 'filter', id: control.id, value: next }, options),
        [onChange, control.id],
    );

    switch (control.type) {
        case 'text':
            return <TextControl control={control} value={value} onValue={onValue} />;
        case 'select':
            return (
                <Select
                    label={control.label}
                    data={optionData(control)}
                    value={value === '' ? null : value}
                    onChange={(next) => onValue(next)}
                    placeholder={FORM_LIST_TEXT.filterAny}
                    clearable
                    comboboxProps={{ withinPortal: true }}
                    style={{ minWidth: 0, flex: '1 1 10rem', maxWidth: '16rem' }}
                />
            );
        case 'multi_select':
            return (
                <MultiSelect
                    label={control.label}
                    data={optionData(control)}
                    value={value === '' ? [] : value.split(',').filter((item) => item !== '')}
                    onChange={(next) => onValue(next.length === 0 ? null : next.join(','))}
                    placeholder={FORM_LIST_TEXT.filterAny}
                    clearable
                    style={{ minWidth: 0, flex: '1 1 12rem', maxWidth: '20rem' }}
                />
            );
        case 'boolean':
            return <BooleanControl control={control} value={value} onValue={onValue} />;
        case 'date_range':
            return <RangeControl control={control} value={value} onValue={onValue} kind="date" />;
        case 'number_range':
            return <RangeControl control={control} value={value} onValue={onValue} kind="number" />;
        default:
            return null;
    }
}

/** Search, the visitor's controls, the reset link and the add button of a list. */
export function FormListToolbar({ state, urlState, onChange, addLabel, searchLabel, canCreate, onAdd }: IFormListToolbarProps) {
    const narrowed = urlState.q !== null || Object.keys(urlState.filters).length > 0 || urlState.sort.length > 0;
    const showSearch = state.capabilities.search;

    if (!showSearch && state.controls.length === 0 && !canCreate && !narrowed) {
        return null;
    }

    return (
        <Stack gap="sm" data-testid="form-list-toolbar">
            {(showSearch || canCreate) && (
                <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                    {showSearch ? (
                        <SearchBox state={state} urlState={urlState} onChange={onChange} searchLabel={searchLabel} />
                    ) : <span />}
                    {canCreate && (
                        <Button leftSection={<IconPlus size={16} aria-hidden="true" />} onClick={onAdd}>
                            {addLabel}
                        </Button>
                    )}
                </Group>
            )}
            {(state.controls.length > 0 || narrowed) && (
                <Group align="flex-end" wrap="wrap" gap="sm">
                    {state.controls.map((control) => (
                        <Control key={control.id} control={control} urlState={urlState} onChange={onChange} />
                    ))}
                    {narrowed && (
                        <Button variant="subtle" size="compact-sm" onClick={() => onChange({ type: 'reset' })}>
                            {FORM_LIST_TEXT.resetFilters}
                        </Button>
                    )}
                </Group>
            )}
        </Stack>
    );
}
