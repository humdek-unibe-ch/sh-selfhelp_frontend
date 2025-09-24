import React from 'react';
import { Card } from '@mantine/core';
import BasicStyle from '../../BasicStyle';
import { ICardStyle } from '../../../../../../types/common/styles.types';
import { castMantineRadius } from '../../../../../../utils/style-field-extractor';

/**
 * Props interface for CardStyle component
 */
/**
 * Props interface for ICardStyle component
 */
interface ICardStyleProps {
    style: ICardStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * CardStyle component renders a Mantine Card component as a container.
 * Supports shadow, padding, and can contain child components.
 *
 * @component
 * @param {ICardStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Card with child content
 */
const CardStyle: React.FC<ICardStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const shadow = style.mantine_card_shadow?.content || 'sm';
    const padding = style.mantine_card_padding?.content || 'md';
    const radius = castMantineRadius((style as any).mantine_radius?.content);
    const withBorder = style.mantine_border?.content === '1';

    // Handle CSS field - use direct property from API response
    

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
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </Card>
    );
};

export default CardStyle;
