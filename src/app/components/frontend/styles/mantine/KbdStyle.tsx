import React from 'react';
import { Kbd } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IKbdStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for KbdStyle component
 */
interface IKbdStyleProps {
    style: IKbdStyle;
}

/**
 * KbdStyle component renders a Mantine Kbd component for keyboard key display.
 * Used to show keyboard shortcuts and key combinations.
 *
 * @component
 * @param {IKbdStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Kbd component
 */
const KbdStyle: React.FC<IKbdStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const key = getFieldContent(style, 'label') || 'A';
    const size = getFieldContent(style, 'mantine_size') || 'sm';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <Kbd size={size as any} className={cssClass} style={styleObj}>
            {key}
        </Kbd>
    );
};

export default KbdStyle;

