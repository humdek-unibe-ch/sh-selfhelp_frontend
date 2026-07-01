/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import { ActionIcon, Autocomplete, Loader, Modal, Stack } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { searchMenuPagesInPayload, type TNavigationSearchMode } from '@selfhelp/shared';
import { permissionAwareApiClient } from '../../../../../api/base.api';
import { API_CONFIG } from '../../../../../config/api.config';
import { useLanguageContext } from '../../../contexts/LanguageContext';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import type { IBaseApiResponse } from '../../../../../shared';

interface ISearchHit {
    page_id?: number;
    keyword?: string;
    url?: string | null;
    title?: string;
}

interface ISearchResponse {
    results: ISearchHit[];
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

interface IHeaderSearchFieldProps {
    query: string;
    onQueryChange: (value: string) => void;
    onNavigate: (value: string) => void;
    options: string[];
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
    return (
        <Autocomplete
            placeholder="Search"
            data={options}
            value={query}
            onChange={onQueryChange}
            onOptionSubmit={onNavigate}
            rightSection={loading ? <Loader size={16} /> : null}
            w={compact ? '100%' : 220}
            size="sm"
            autoFocus={compact}
        />
    );
}

export function HeaderSearch(): React.ReactElement | null {
    const router = useRouter();
    const { currentLanguageId } = useLanguageContext();
    const { navigation } = useAppNavigation();
    const [query, setQuery] = useState('');
    const [opened, { open, close }] = useDisclosure(false);
    const compact = useMediaQuery('(max-width: 62em)') ?? false;

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

    const options = useMemo(
        () => hits.map((hit: ISearchHit) => hit.title || hit.keyword || '').filter(Boolean),
        [hits],
    );

    if (currentLanguageId <= 0 || searchMode === 'off') {
        return null;
    }

    const loading = searchMode === 'menu_pages' ? false : isFetching;

    const navigateToHit = (value: string) => {
        const hit = hits.find((row: ISearchHit) => (row.title || row.keyword) === value);
        const href = hit?.url || (hit?.keyword ? `/${hit.keyword}` : null);
        if (href) {
            router.push(href);
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
