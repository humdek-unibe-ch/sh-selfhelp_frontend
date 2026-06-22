/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Highlight } from '@mantine/core';
import { type IHighlightStyle } from '../../../../../types/common/styles.types';
import { stripHtmlTags } from '../../../../../utils/html-sanitizer.utils';

/**
 * Props interface for HighlightStyle component
 */
/**
 * Props interface for IHighlightStyle component
 */
interface IHighlightStyleProps {
    style: IHighlightStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * HighlightStyle component renders a Mantine Highlight component for text highlighting.
 * Supports highlighting specific text within content.
 *
 * @component
 * @param {IHighlightStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Highlight with styled configuration
 */
const HighlightStyle: React.FC<IHighlightStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure.
    // `text` is a `markdown-inline` field, so the editor may store a `<p>` wrapper
    // or inline tags (Ctrl+B). Mantine `<Highlight>` renders its child as a plain
    // string (it matches a substring to wrap in `<mark>`), so any HTML would show
    // as literal tags. Strip it to readable text first — this mirrors the mobile
    // renderer, which also shows plain text plus the highlight mark.
    const content = stripHtmlTags(style.text?.content || 'Highlight some text in this content');
    const highlightText = style.highlight_highlight?.content || 'highlight';
    const color = style.shared_color?.content || 'yellow';
    // Handle CSS field - use direct property from API response


    // Build style object
    const styleObj: React.CSSProperties = {};


    return (
        <Highlight
            highlight={highlightText}
            color={color}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {content}
        </Highlight>
    );
};

export default HighlightStyle;

