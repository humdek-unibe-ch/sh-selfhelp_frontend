import React from 'react';
import { Container } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IContainerStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ContainerStyle component
 * @interface IContainerStyleProps
 * @property {IContainerStyle} style - The container style configuration object
 */
interface IContainerStyleProps {
    style: IContainerStyle;
}

/**
 * ContainerStyle component renders a Mantine Container component with responsive layout.
 * Provides responsive max-widths and horizontal centering for content.
 *
 * @component
 * @param {IContainerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Container with styled children
 */
const ContainerStyle: React.FC<IContainerStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine Container props
    const size = getFieldContent(style, 'mantine_slider_size');
    const fluid = getFieldContent(style, 'mantine_container_fluid') === '1';
    const px = getFieldContent(style, 'mantine_padding_x');
    const py = getFieldContent(style, 'mantine_padding_y');
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');
    const minWidth = getFieldContent(style, 'mantine_miw');
    const minHeight = getFieldContent(style, 'mantine_mih');
    const maxWidth = getFieldContent(style, 'mantine_maw');
    const maxHeight = getFieldContent(style, 'mantine_mah');

    // Handle CSS field - use direct property from API response
    const cssClass = style.css ?? '';

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;
    if (minWidth) styleObj.minWidth = minWidth;
    if (minHeight) styleObj.minHeight = minHeight;
    if (maxWidth) styleObj.maxWidth = maxWidth;
    if (maxHeight) styleObj.maxHeight = maxHeight;

    return (
        <Container
            size={size || undefined}  // Mantine size prop (xs, sm, md, lg, xl)
            fluid={fluid}
            px={px || undefined}
            py={py || undefined}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </Container>
    );
};

export default ContainerStyle;
