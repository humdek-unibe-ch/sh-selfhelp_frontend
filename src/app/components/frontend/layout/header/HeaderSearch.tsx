/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
'use client';

import {
    ActionIcon,
    Box,
    Group,
    Highlight,
    Loader,
    Modal,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    UnstyledButton,
    VisuallyHidden,
} from '@mantine/core';
import { useClickOutside, useDebouncedValue, useDisclosure, useId, useMediaQuery } from '@mantine/hooks';
import { IconFileText, IconSearch, IconX } from '@tabler/icons-react';
import { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { searchMenuPagesInPayload, type TNavigationSearchMode } from '@selfhelp/shared';
import { permissionAwareApiClient } from '../../../../../api/base.api';
import { API_CONFIG } from '../../../../../config/api.config';
import { useLanguageContext } from '../../../contexts/LanguageContext';
import { useAppNavigation } from '../../../../../hooks/useAppNavigation';
import type { IBaseApiResponse, INavigationPayload } from '../../../../../shared';
import styles from './HeaderSearch.module.css';

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

/** Result row backed by a search hit; `value` is the unique keyword. */
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

/** The page a hit opens; null when the hit has neither a url nor a keyword. */
function hitHref(hit: ISearchHit): string | null {
    return hit.url || (hit.keyword ? `/${hit.keyword}` : null);
}

/**
 * Dedupe hits into options keyed by the page keyword (unique per page), so
 * two pages sharing a visible title ("Impressum" in header + footer) can
 * never produce duplicate result rows.
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
    /** True while the query is shorter than the configured `min_chars`. */
    belowMinChars: boolean;
    compact?: boolean;
}

/** Search field + docked results panel, matching the admin `NavigationSearch`. */
function HeaderSearchField({
    query,
    onQueryChange,
    onNavigate,
    options,
    loading,
    belowMinChars,
    compact = false,
}: IHeaderSearchFieldProps): React.ReactElement {
    // Tracked separately from the query so dismissing keeps what was typed.
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    // Keyboard-highlighted result (-1 = none); reset whenever the results change.
    const [activeIndex, setActiveIndex] = useState(-1);
    const [prevOptions, setPrevOptions] = useState(options);
    if (prevOptions !== options) {
        setPrevOptions(options);
        setActiveIndex(-1);
    }
    const listboxId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const clickOutsideRef = useClickOutside(() => setIsPanelOpen(false));

    // Stay closed below min_chars and during the first load, so the panel
    // never opens as an empty box.
    const isPanelVisible =
        Boolean(query) && !belowMinChars && isPanelOpen && !(loading && options.length === 0);

    const status = !query || belowMinChars
        ? ''
        : loading
            ? 'Searching…'
            : options.length === 0
                ? 'No results'
                : `${options.length} ${options.length === 1 ? 'result' : 'results'}`;

    const clearSearch = () => {
        onQueryChange('');
        setIsPanelOpen(false);
        inputRef.current?.focus();
    };

    return (
        <Box
            className={`${styles.root} ${compact ? styles.rootBlock : styles.rootInline}`}
            ref={clickOutsideRef}
        >
            {/* Always mounted so changes are announced. */}
            <VisuallyHidden role="status" aria-live="polite">
                {status}
            </VisuallyHidden>
            <TextInput aria-label="Search the site"
                ref={inputRef}
                placeholder="Search"
                value={query}
                onChange={(event) => {
                    onQueryChange(event.currentTarget.value);
                    setIsPanelOpen(true);
                }}
                onFocus={() => setIsPanelOpen(true)}
                // Escape keeps focus here, so a click must reopen the results.
                onClick={() => setIsPanelOpen(true)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && isPanelVisible) {
                        // Don't let a parent overlay close too.
                        event.stopPropagation();
                        setIsPanelOpen(false);
                        return;
                    }
                    if (!isPanelVisible || options.length === 0) {
                        return;
                    }
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        event.preventDefault();
                        const step = event.key === 'ArrowDown' ? 1 : -1;
                        setActiveIndex((index) => (index + step + options.length) % options.length);
                    } else if (event.key === 'Enter' && activeIndex >= 0) {
                        event.preventDefault();
                        setIsPanelOpen(false);
                        onNavigate(options[activeIndex].value);
                    }
                }}
                role="combobox"
                aria-expanded={isPanelVisible}
                aria-controls={isPanelVisible && options.length > 0 ? listboxId : undefined}
                aria-autocomplete="list"
                aria-activedescendant={
                    isPanelVisible && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
                }
                data-panel-open={isPanelVisible || undefined}
                leftSection={<IconSearch size={16} stroke={1.6} />}
                rightSection={
                    loading ? (
                        <Loader size={16} />
                    ) : query ? (
                        <ActionIcon
                            variant="subtle"
                            color="gray"
                            size="sm"
                            onClick={clearSearch}
                            aria-label="Clear search"
                        >
                            <IconX size={14} />
                        </ActionIcon>
                    ) : null
                }
                size="sm"
                radius="md"
                autoFocus={compact}
                classNames={{ input: styles.input }}
            />

            {isPanelVisible && (
                <Box className={styles.panel}>
                    {options.length > 0 ? (
                        <>
                            <Box className={styles.panelHeader}>
                                <Text component="span" className={styles.panelHeaderLabel}>
                                    Results
                                </Text>
                                <Text component="span" className={styles.panelHeaderCount}>
                                    {options.length}
                                </Text>
                            </Box>

                            <ScrollArea.Autosize mah={280} type="hover">
                                <Stack gap={2} className={styles.panelList} id={listboxId} role="listbox" aria-label="Search results">
                                    {options.map((option, index) => (
                                        <UnstyledButton
                                            key={option.value}
                                            component={Link}
                                            href={hitHref(option.hit) ?? '#'}
                                            id={`${listboxId}-${index}`}
                                            role="option"
                                            aria-selected={index === activeIndex}
                                            data-active={index === activeIndex || undefined}
                                            onClick={(event: React.MouseEvent<HTMLAnchorElement>) => {
                                                // Let the browser handle new-tab / new-window clicks.
                                                if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
                                                    return;
                                                }
                                                event.preventDefault();
                                                setIsPanelOpen(false);
                                                onNavigate(option.value);
                                            }}
                                            className={styles.searchItem}
                                        >
                                            <Group gap="sm" wrap="nowrap" align="flex-start">
                                                <Box className={styles.searchItemIcon}>
                                                    <IconFileText size={16} />
                                                </Box>
                                                <Box className={styles.searchItemText}>
                                                    <Text size="sm" fw={500} lineClamp={1}>
                                                        <Highlight highlight={query} component="span">
                                                            {option.label}
                                                        </Highlight>
                                                    </Text>
                                                    {option.hit.snippet ? (
                                                        <Text size="xs" lineClamp={2} className={styles.searchItemMeta}>
                                                            {option.hit.snippet}
                                                        </Text>
                                                    ) : option.hit.url ? (
                                                        <Text size="xs" lineClamp={1} className={styles.searchItemMeta}>
                                                            {option.hit.url}
                                                        </Text>
                                                    ) : null}
                                                </Box>
                                            </Group>
                                        </UnstyledButton>
                                    ))}
                                </Stack>
                            </ScrollArea.Autosize>
                        </>
                    ) : (
                        <Box className={styles.emptyState}>
                            <IconSearch size={20} stroke={1.5} className={styles.emptyStateIcon} />
                            <Text size="sm" fw={500}>
                                No results
                            </Text>
                            <Text size="xs" c="dimmed" lineClamp={1}>
                                Nothing matches &quot;{query}&quot;
                            </Text>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}

interface IHeaderSearchProps {
    /** SSR navigation fallback used to avoid hydration flicker. */
    initialNavigation?: INavigationPayload | null;
    /**
     * Breakpoint slot this instance sits in. The header mounts a desktop and a
     * mobile slot, and `visibleFrom`/`hiddenFrom` hide with CSS only — both stay
     * mounted. Each instance renders only when it matches the viewport, so
     * exactly one search is live.
     */
    surface?: 'desktop' | 'mobile';
}

export function HeaderSearch({
    initialNavigation = null,
    surface = 'desktop',
}: IHeaderSearchProps): React.ReactElement | null {
    const router = useRouter();
    const { currentLanguageId } = useLanguageContext();
    const { navigation: liveNavigation } = useAppNavigation();
    const [query, setQuery] = useState('');
    const [opened, { open, close }] = useDisclosure(false);
    const compact = useMediaQuery('(max-width: 62em)') ?? false;

    // Only the instance matching the viewport is live; its counterpart in the
    // other (CSS-hidden but still mounted) slot renders nothing and skips the
    // query entirely.
    const isActiveSurface = compact === (surface === 'mobile');

    const navigation = liveNavigation ?? initialNavigation;
    const searchMode = navigation?.search?.mode ?? 'off';
    const minChars = navigation?.search?.min_chars ?? 2;
    const resultLimit = navigation?.search?.result_limit ?? 8;
    const endpoint = searchEndpointForMode(searchMode);
    const trimmed = query.trim();
    // Remote search waits for a typing pause instead of firing per keystroke.
    const [debouncedTrimmed] = useDebouncedValue(trimmed, 250);
    const isDebouncing = debouncedTrimmed !== trimmed;
    const enabled = isActiveSurface && endpoint !== null && debouncedTrimmed.length >= minChars;

    const menuHits = useMemo(() => {
        if (searchMode !== 'menu_pages' || !navigation || trimmed.length < minChars) {
            return [];
        }
        return searchMenuPagesInPayload(navigation, trimmed, resultLimit);
    }, [navigation, resultLimit, searchMode, minChars, trimmed]);

    const { data, isFetching } = useQuery({
        queryKey: ['search', searchMode, debouncedTrimmed, currentLanguageId],
        queryFn: async () => {
            if (!endpoint) {
                return [];
            }
            const response = await permissionAwareApiClient.get<IBaseApiResponse<ISearchResponse>>(
                endpoint,
                debouncedTrimmed,
                currentLanguageId,
            );
            return response.data.data?.results ?? [];
        },
        enabled: enabled && currentLanguageId > 0,
        staleTime: 30_000,
        // Each keystroke is a new query key; keep the previous hits so the
        // panel doesn't collapse between them.
        placeholderData: (previous) => previous,
    });

    const remoteHits = useMemo(() => data ?? [], [data]);
    const hits = useMemo(
        (): ISearchHit[] => (searchMode === 'menu_pages' ? menuHits : remoteHits),
        [searchMode, menuHits, remoteHits],
    );

    const options = useMemo(() => buildSearchOptions(hits), [hits]);

    if (!isActiveSurface || currentLanguageId <= 0 || searchMode === 'off') {
        return null;
    }

    const loading = searchMode === 'menu_pages' ? false : isFetching || isDebouncing;

    const navigateToHit = (value: string) => {
        const option = options.find((row) => row.value === value);
        const hit = option?.hit;
        const href = hit ? hitHref(hit) : null;
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
                            belowMinChars={trimmed.length < minChars}
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
            belowMinChars={trimmed.length < minChars}
        />
    );
}
