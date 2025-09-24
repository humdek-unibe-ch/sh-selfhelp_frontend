import React from 'react';
import { Kbd } from '@mantine/core';
import { IKbdStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for KbdStyle component
 */
/**
 * Props interface for IKbdStyle component
 */
interface IKbdStyleProps {
    style: IKbdStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * KbdStyle component renders a Mantine Kbd component for keyboard key display.
 * Used to show keyboard shortcuts and key combinations.
 *
 * @component
 * @param {IKbdStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Kbd component
 */
const KbdStyle: React.FC<IKbdStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values using the new unified field structure
    const key = style.label?.content || 'A';
    const size = style.mantine_size?.content || 'sm';

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <Kbd size={size as any} {...styleProps} className={cssClass} style={styleObj}>
            {key}
        </Kbd>
    );
};

export default KbdStyle;

