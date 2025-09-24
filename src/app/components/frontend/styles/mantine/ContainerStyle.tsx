import React from 'react';
import { Container } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IContainerStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ContainerStyle component
 * @interface IContainerStyleProps
 * @property {IContainerStyle} style - The container style configuration object
 * @property {Record<string, any>} styleProps - Additional style properties for spacing
 * @property {string} cssClass - CSS class name for the component
 */
interface IContainerStyleProps {
    style: IContainerStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * ContainerStyle component renders a Mantine Container component with responsive layout.
 * Provides responsive max-widths and horizontal centering for content.
 *
 * @component
 * @param {IContainerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Container with styled children
 */
const ContainerStyle: React.FC<IContainerStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine Container props
    const size = style.mantine_size?.content;
    const fluid = style.mantine_fluid?.content === '1';
    const px = style.mantine_px?.content;
    const py = style.mantine_py?.content;

    // Mantine Container doesn't support direct width/height props
    // Size prop handles max-width responsively, fluid makes it 100%
    const styleObj: React.CSSProperties = {};

    // Handle default values for better UX
    const containerSize = size || 'md'; // Default to 'md' if no size is set
    const containerPx = px || undefined; // Mantine handles undefined gracefully
    const containerPy = py || undefined; // Mantine handles undefined gracefully

    // Conditional rendering based on use_mantine_style
    return (
        <Container
            {...styleProps}
            size={containerSize}  // Mantine size prop (xs, sm, md, lg, xl)
            fluid={fluid}
            px={containerPx}
            py={containerPy}
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
