import React from 'react';
import { Highlight } from '@mantine/core';
import { IHighlightStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for HighlightStyle component
 */
/**
 * Props interface for IHighlightStyle component
 */
interface IHighlightStyleProps {
    style: IHighlightStyle;
    styleProps: Record<string, any>;
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
    const highlightText = style.mantine_highlight_highlight?.content || 'highlight';
    const color = style.mantine_color?.content || 'yellow';
    const use_mantine_style = style.use_mantine_style?.content === '1';

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

