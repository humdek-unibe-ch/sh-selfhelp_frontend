/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ActionIcon, Autocomplete, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconFileText, IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { searchMenuPagesInPayload, type TNavigationSearchMode } from '@selfhelp/shared';
import { permissionAwareApiClient } from '../../../../../api/base.api';
import { API_CONFIG } from '../../../../../config/api.config';
import { useLanguageContext } from '../../../contexts/LanguageContext';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import type { IBaseApiResponse, INavigationPayload } from '../../../../../shared';

interface ISearchHit {
    page_id?: number;
    keyword?: string;
    url?: string | null;
    title?: string;
    snippet?: string | null;
}

interface ISearchResponse {
    results: ISearchHit[];
}

/** Autocomplete option backed by a search hit; `value` is the unique keyword. */
interface ISearchOption {
    value: string;
    label: string;
    hit: ISearchHit;
}

function searchEndpointForMode(
    mode: TNavigationSearchMode,
): typeof API_CONFIG.ENDPOINTS.SEARCH_CONTENT | typeof API_CONFIG.ENDPOINTS.SEARCH_PAGES | null {
    if (mode === 'off' || mode === 'menu_pages') {
        return null;
    }
    if (mode === 'content_index') {
        return API_CONFIG.ENDPOINTS.SEARCH_CONTENT;
    }
    return API_CONFIG.ENDPOINTS.SEARCH_PAGES;
}

/**
 * Dedupe hits into options keyed by the page keyword (unique per page), so
 * two pages sharing a visible title ("Impressum" in header + footer) can
 * never produce duplicate Autocomplete values.
 */
function buildSearchOptions(hits: ISearchHit[]): ISearchOption[] {
    const seen = new Set<string>();
    const options: ISearchOption[] = [];
    for (const hit of hits) {
        const value = hit.keyword || (hit.page_id != null ? `page-${hit.page_id}` : '');
        if (!value || seen.has(value)) {
            continue;
        }
        seen.add(value);
        options.push({
            value,
            label: hit.title || hit.keyword || value,
            hit,
        });
    }
    return options;
}

interface IHeaderSearchFieldProps {
    query: string;
    onQueryChange: (value: string) => void;
    onNavigate: (value: string) => void;
    options: ISearchOption[];
    loading: boolean;
    compact?: boolean;
}

function HeaderSearchField({
    query,
    onQueryChange,
    onNavigate,
    options,
    loading,
    compact = false,
}: IHeaderSearchFieldProps): React.ReactElement {
    const optionByValue = useMemo(
        () => new Map(options.map((option) => [option.value, option])),
        [options],
    );

    return (
        <Autocomplete
            placeholder="Search"
            data={options.map(({ value, label }) => ({ value, label }))}
            value={query}
            onChange={onQueryChange}
            onOptionSubmit={onNavigate}
            // The backend already filtered; matching option values (keywords)
            // against the typed title text would wrongly drop results.
            filter={({ options: comboboxOptions }) => comboboxOptions}
            renderOption={({ option }) => {
                const searchOption = optionByValue.get(option.value);
                const hit = searchOption?.hit;
                return (
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                        <IconFileText size={16} style={{ marginTop: 2, opacity: 0.6, flexShrink: 0 }} />
                        <Stack gap={2} style={{ minWidth: 0 }}>
                            <Text size="sm" fw={500} lineClamp={1}>
                                {searchOption?.label ?? option.value}
                            </Text>
                            {hit?.snippet ? (
                                <Text size="xs" c="dimmed" lineClamp={2}>
                                    {hit.snippet}
                                </Text>
                            ) : hit?.url ? (
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                    {hit.url}
                                </Text>
                            ) : null}
                        </Stack>
                    </Group>
                );
            }}
            rightSection={loading ? <Loader size={16} /> : <IconSearch size={16} style={{ opacity: 0.5 }} />}
            w={compact ? '100%' : 220}
            size="sm"
            autoFocus={compact}
            comboboxProps={{ width: compact ? undefined : 320, position: 'bottom-end', shadow: 'md' }}
        />
    );
}

interface IHeaderSearchProps {
    /** SSR navigation fallback used to avoid hydration flicker. */
    initialNavigation?: INavigationPayload | null;
}

export function HeaderSearch({ initialNavigation = null }: IHeaderSearchProps): React.ReactElement | null {
    const router = useRouter();
    const { currentLanguageId } = useLanguageContext();
    const { navigation: liveNavigation } = useAppNavigation();
    const [query, setQuery] = useState('');
    const [opened, { open, close }] = useDisclosure(false);
    const compact = useMediaQuery('(max-width: 62em)') ?? false;

    const navigation = liveNavigation ?? initialNavigation;
    const searchMode = navigation?.search?.mode ?? 'off';
    const minChars = navigation?.search?.min_chars ?? 2;
    const resultLimit = navigation?.search?.result_limit ?? 8;
    const endpoint = searchEndpointForMode(searchMode);
    const trimmed = query.trim();
    const enabled = endpoint !== null && trimmed.length >= minChars;

    const menuHits = useMemo(() => {
        if (searchMode !== 'menu_pages' || !navigation || trimmed.length < minChars) {
            return [];
        }
        return searchMenuPagesInPayload(navigation, trimmed, resultLimit);
    }, [navigation, resultLimit, searchMode, minChars, trimmed]);

    const { data, isFetching } = useQuery({
        queryKey: ['search', searchMode, trimmed, currentLanguageId],
        queryFn: async () => {
            if (!endpoint) {
                return [];
            }
            const response = await permissionAwareApiClient.get<IBaseApiResponse<ISearchResponse>>(
                endpoint,
                trimmed,
                currentLanguageId,
            );
            return response.data.data?.results ?? [];
        },
        enabled: enabled && currentLanguageId > 0,
        staleTime: 30_000,
    });

    const remoteHits = useMemo(() => data ?? [], [data]);
    const hits = useMemo(
        (): ISearchHit[] => (searchMode === 'menu_pages' ? menuHits : remoteHits),
        [searchMode, menuHits, remoteHits],
    );

    const options = useMemo(() => buildSearchOptions(hits), [hits]);

    if (currentLanguageId <= 0 || searchMode === 'off') {
        return null;
    }

    const loading = searchMode === 'menu_pages' ? false : isFetching;

    const navigateToHit = (value: string) => {
        const option = options.find((row) => row.value === value);
        const hit = option?.hit;
        const href = hit?.url || (hit?.keyword ? `/${hit.keyword}` : null);
        if (href) {
            router.push(href);
            setQuery('');
            close();
        }
    };

    if (compact) {
        return (
            <>
                <ActionIcon variant="subtle" aria-label="Search" onClick={open}>
                    <IconSearch size={18} />
                </ActionIcon>
                <Modal opened={opened} onClose={close} title="Search" centered size="md">
                    <Stack gap="sm">
                        <HeaderSearchField
                            query={query}
                            onQueryChange={setQuery}
                            onNavigate={navigateToHit}
                            options={options}
                            loading={loading}
                            compact
                        />
                    </Stack>
                </Modal>
            </>
        );
    }

    return (
        <HeaderSearchField
            query={query}
            onQueryChange={setQuery}
            onNavigate={navigateToHit}
            options={options}
            loading={loading}
        />
    );
}
