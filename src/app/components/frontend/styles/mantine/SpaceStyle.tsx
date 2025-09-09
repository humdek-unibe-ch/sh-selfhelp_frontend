import React from 'react';
import { Space } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ISpaceStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SpaceStyle component
 * @interface ISpaceStyleProps
 * @property {ISpaceStyle} style - The space style configuration object
 */
interface ISpaceStyleProps {
    style: ISpaceStyle;
}

/**
 * SpaceStyle component renders a Mantine Space component for adding spacing.
 * Provides consistent spacing between elements without content.
 *
 * @component
 * @param {ISpaceStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Space component
 */
const SpaceStyle: React.FC<ISpaceStyleProps> = ({ style }) => {
    // Extract field values for Mantine Space props
    const size = getFieldContent(style, 'mantine_slider_size');
    const h = getFieldContent(style, 'mantine_space_h') === '1';
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    return (
        <Space
            h={h ? size || 'md' : undefined}
            w={h ? undefined : size || 'md'}
            className={cssClass}
            style={styleObj}
        />
    );
};

export default SpaceStyle;
