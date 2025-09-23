import React from 'react';
import { Highlight } from '@mantine/core';
import { IHighlightStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for HighlightStyle component
 */
interface IHighlightStyleProps {
    style: IHighlightStyle;
}

/**
 * HighlightStyle component renders a Mantine Highlight component for text highlighting.
 * Supports highlighting specific text within content.
 *
 * @component
 * @param {IHighlightStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Highlight with styled configuration
 */
const HighlightStyle: React.FC<IHighlightStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const content = style.text?.content || 'Highlight some text in this content';
    const highlightText = style.mantine_highlight_highlight?.content || 'highlight';
    const color = style.mantine_color?.content || 'yellow';
    const use_mantine_style = style.use_mantine_style?.content === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Highlight
                highlight={highlightText}
                color={color}
                className={cssClass}
                style={styleObj}
            >
                {content}
            </Highlight>
        );
    }

    // Fallback to basic styled span when Mantine styling is disabled
    return (
        <span
            className={cssClass}
            style={{
                ...styleObj,
                backgroundColor: color === 'yellow' ? '#fff3cd' : color,
                padding: '2px 4px',
                borderRadius: '2px'
            }}
        >
            {content.split(new RegExp(`(${highlightText})`, 'gi')).map((part, index) =>
                part.toLowerCase() === highlightText.toLowerCase() ? (
                    <mark
                        key={index}
                        style={{
                            backgroundColor: color,
                            color: '#000',
                            padding: '0 2px',
                            borderRadius: '2px'
                        }}
                    >
                        {part}
                    </mark>
                ) : (
                    part
                )
            )}
        </span>
    );
};

export default HighlightStyle;

