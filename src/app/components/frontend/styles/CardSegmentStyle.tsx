import React from 'react';
import { Card } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { ICardSegmentStyle } from '../../../../types/common/styles.types';
import { getFieldContent } from '../../../../utils/style-field-extractor';

/**
 * Props interface for CardSegmentStyle component
 */
interface ICardSegmentStyleProps {
    style: ICardSegmentStyle;
}

/**
 * CardSegmentStyle component renders a Mantine Card.Section component.
 * Used to organize content within Card components with optional sections.
 *
 * @component
 * @param {ICardSegmentStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Card.Section with child content
 */
const CardSegmentStyle: React.FC<ICardSegmentStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    if (use_mantine_style) {
        return (
            <Card.Section
                className={cssClass}
                style={styleObj}
            >
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </Card.Section>
        );
    }

    // Fallback to basic div when Mantine styling is disabled
    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                padding: '16px'
            }}
        >
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </div>
    );
};

export default CardSegmentStyle;
