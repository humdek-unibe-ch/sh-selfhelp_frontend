import React from 'react';
import { Card } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { ICardStyle } from '../../../../types/common/styles.types';
import { getFieldContent, castMantineRadius } from '../../../../utils/style-field-extractor';

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
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    if (use_mantine_style) {
        return (
            <Card
                shadow={shadow as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
                padding={padding as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
                radius={radius}
                className={cssClass}
                style={styleObj}
            >
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </Card>
        );
    }

    // Fallback to basic div when Mantine styling is disabled
    const getShadowStyle = (shadow: string) => {
        const shadows = {
            'xs': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
            'sm': '0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)',
            'md': '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
            'lg': '0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22)',
            'xl': '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
        };
        return shadows[shadow as keyof typeof shadows] || shadows.sm;
    };

    const getPaddingStyle = (padding: string) => {
        const paddings = {
            'xs': '8px',
            'sm': '12px',
            'md': '16px',
            'lg': '24px',
            'xl': '32px'
        };
        return paddings[padding as keyof typeof paddings] || paddings.md;
    };

    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                backgroundColor: 'white',
                borderRadius: radius === 'xs' ? '2px' :
                           radius === 'sm' ? '4px' :
                           radius === 'md' ? '8px' :
                           radius === 'lg' ? '12px' :
                           radius === 'xl' ? '16px' : '4px',
                boxShadow: getShadowStyle(shadow),
                padding: getPaddingStyle(padding),
                border: '1px solid #e9ecef'
            }}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </div>
    );
};

export default CardStyle;
