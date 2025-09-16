import React from 'react';
import { Spoiler } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ISpoilerStyle } from '../../../../../types/common/styles.types';
import BasicStyle from '../BasicStyle';

/**
 * Props interface for SpoilerStyle component
 */
interface ISpoilerStyleProps {
    style: ISpoilerStyle;
}

/**
 * SpoilerStyle component renders a Mantine Spoiler component for collapsible text.
 * Supports custom show/hide labels and maximum height configuration.
 *
 * @component
 * @param {ISpoilerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Spoiler with child content
 */
const SpoilerStyle: React.FC<ISpoilerStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const maxHeight = getFieldContent(style, 'mantine_height') || '200px';
    const showLabel = getFieldContent(style, 'mantine_spoiler_show_label') || 'Show more';
    const hideLabel = getFieldContent(style, 'mantine_spoiler_hide_label') || 'Hide';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <Spoiler
            maxHeight={100}
            showLabel={showLabel}
            hideLabel={hideLabel}
            className={cssClass}
            style={styleObj}
        >
                        {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Spoiler>
    );

};

export default SpoilerStyle;

