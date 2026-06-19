/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Highlight } from '@mantine/core';
import { type IHighlightStyle } from '../../../../../types/common/styles.types';

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
    // Extract field values using the new unified field structure
    const content = style.text?.content || 'Highlight some text in this content';
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

