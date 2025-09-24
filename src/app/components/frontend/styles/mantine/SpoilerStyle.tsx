import React from 'react';
import { Spoiler } from '@mantine/core';
import { ISpoilerStyle } from '../../../../../types/common/styles.types';
import BasicStyle from '../BasicStyle';

/**
 * Props interface for SpoilerStyle component
 */
/**
 * Props interface for ISpoilerStyle component
 */
interface ISpoilerStyleProps {
    style: ISpoilerStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * SpoilerStyle component renders a Mantine Spoiler component for collapsible text.
 * Supports custom show/hide labels and maximum height configuration.
 *
 * @component
 * @param {ISpoilerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Spoiler with child content
 */
const SpoilerStyle: React.FC<ISpoilerStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const maxHeight = style.mantine_height?.content || '200px';
    const showLabel = style.mantine_spoiler_show_label?.content || 'Show more';
    const hideLabel = style.mantine_spoiler_hide_label?.content || 'Hide';

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <Spoiler
            maxHeight={100}
            showLabel={showLabel}
            hideLabel={hideLabel}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
                        {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Spoiler>
    );

};

export default SpoilerStyle;

