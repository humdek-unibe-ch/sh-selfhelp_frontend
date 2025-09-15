import React from 'react';
import { Card } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { ICardStyle } from '../../../../../../types/common/styles.types';
import { getFieldContent, castMantineRadius } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for CardStyle component
 */
interface ICardStyleProps {
    style: ICardStyle;
}

/**
 * CardStyle component renders a Mantine Card component as a container.
 * Supports shadow, padding, and can contain child components.
 *
 * @component
 * @param {ICardStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Card with child content
 */
const CardStyle: React.FC<ICardStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const shadow = getFieldContent(style, 'mantine_card_shadow') || 'sm';
    const padding = getFieldContent(style, 'mantine_card_padding') || 'md';
    const radius = castMantineRadius(getFieldContent(style, 'mantine_radius'));
    const withBorder = getFieldContent(style, 'mantine_border') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <Card
            shadow={shadow === 'none' ? undefined : shadow as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            padding={padding === 'none' ? undefined : padding as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
            radius={radius === 'none' ? 0 : radius}
            withBorder={withBorder}
            className={cssClass}
            style={styleObj}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Card>
    );
};

export default CardStyle;
