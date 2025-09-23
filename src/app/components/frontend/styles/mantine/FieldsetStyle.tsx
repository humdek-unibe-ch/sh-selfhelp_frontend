import React from 'react';
import { Fieldset } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IFieldsetStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for FieldsetStyle component
 */
interface IFieldsetStyleProps {
    style: IFieldsetStyle;
}

/**
 * FieldsetStyle component renders a Mantine Fieldset component for grouping form elements.
 * Provides legend, variant options (default, filled, unstyled), and disabled functionality.
 * Returns null when Mantine styling is disabled (no fallback needed).
 *
 * @component
 * @param {IFieldsetStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Fieldset with child content or null
 */
const FieldsetStyle: React.FC<IFieldsetStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const label = style.label?.content;
    const variant = style.mantine_fieldset_variant?.content || 'default';
    const radius = style.mantine_radius?.content || 'sm';
    const disabled = style.disabled?.content === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

        return (
            <Fieldset
                legend={label}
                variant={variant as 'default' | 'filled' | 'unstyled'}
                radius={radius === 'none' ? 0 : radius}
                disabled={disabled}
                className={cssClass}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Fieldset>
        );
};

export default FieldsetStyle;

