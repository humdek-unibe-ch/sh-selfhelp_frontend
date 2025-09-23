import React from 'react';
import { Center } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { ICenterStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for CenterStyle component
 * @interface ICenterStyleProps
 * @property {ICenterStyle} style - The center style configuration object
 */
interface ICenterStyleProps {
    style: ICenterStyle;
}

/**
 * CenterStyle component renders a Mantine Center component with optional styling.
 * Centers content both horizontally and vertically within its container.
 *
 * @component
 * @param {ICenterStyleProps} props - Component props
 * @returns {JSX.Element} Rendered center component with specified styling
 */
const CenterStyle: React.FC<ICenterStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values
    const inline = style.mantine_center_inline?.content === '1';
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;
    const minWidth = style.mantine_miw?.content;
    const minHeight = style.mantine_mih?.content;
    const maxWidth = style.mantine_maw?.content;
    const maxHeight = style.mantine_mah?.content;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;
    if (minWidth) styleObj.minWidth = minWidth;
    if (minHeight) styleObj.minHeight = minHeight;
    if (maxWidth) styleObj.maxWidth = maxWidth;
    if (maxHeight) styleObj.maxHeight = maxHeight;

    return (
        <Center
            inline={inline}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Center>
    );
};

export default CenterStyle;
