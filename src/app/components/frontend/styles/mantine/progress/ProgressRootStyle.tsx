import React from 'react';
import { Progress } from '@mantine/core';
import { getFieldContent, castMantineSize } from '../../../../../../utils/style-field-extractor';
import { IProgressRootStyle } from '../../../../../../types/common/styles.types';
import BasicStyle from '../../BasicStyle';

/**
 * Props interface for ProgressRootStyle component
 */
interface IProgressRootStyleProps {
    style: IProgressRootStyle;
}

/**
 * ProgressRootStyle component renders a Mantine Progress.Root component for compound progress bars.
 * Supports multiple progress sections and customizable orientation.
 *
 * @component
 * @param {IProgressRootStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Progress.Root with styled configuration and child sections
 */
const ProgressRootStyle: React.FC<IProgressRootStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const autoContrast = getFieldContent(style, 'mantine_progress_auto_contrast') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Render children sections
    const children = style.children?.map((childStyle) => (
        <BasicStyle key={childStyle.id} style={childStyle} />
    )) || [];

    return (
        <Progress.Root
            size={size}
            autoContrast={autoContrast}
            className={cssClass}
        >
            {children}
        </Progress.Root>
    );
};

export default ProgressRootStyle;
