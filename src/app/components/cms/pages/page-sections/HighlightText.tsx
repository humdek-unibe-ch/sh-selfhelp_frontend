'use client';

import { Fragment, memo, useMemo } from 'react';
import styles from './PageSection.module.css';

interface IHighlightTextProps {
    text: string;
    query?: string;
}

/**
 * Escapes a string for safe use inside a RegExp.
 */
function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders text with every occurrence of `query` wrapped in a <mark> element
 * for yellow search-match highlighting. Case-insensitive, purely visual.
 * When no query (or no match) is provided, the original text is rendered as-is.
 */
export const HighlightText = memo<IHighlightTextProps>(function HighlightText({
    text,
    query,
}) {
    const parts = useMemo(() => {
        if (!text) return [];
        const trimmed = query?.trim();
        if (!trimmed) return [{ value: text, isMatch: false }];

        const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
        return text
            .split(regex)
            .filter((segment) => segment !== '')
            .map((segment) => ({
                value: segment,
                isMatch: segment.toLowerCase() === trimmed.toLowerCase(),
            }));
    }, [text, query]);

    if (parts.length === 0) return null;

    return (
        <>
            {parts.map((part, index) =>
                part.isMatch ? (
                    <mark key={index} className={styles.searchMatch}>
                        {part.value}
                    </mark>
                ) : (
                    <Fragment key={index}>{part.value}</Fragment>
                )
            )}
        </>
    );
});
