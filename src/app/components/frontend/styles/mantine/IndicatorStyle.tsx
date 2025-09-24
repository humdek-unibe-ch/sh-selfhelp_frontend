import React from 'react';
import { Indicator } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IIndicatorStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for IndicatorStyle component
 */
/**
 * Props interface for IIndicatorStyle component
 */
interface IIndicatorStyleProps {
    style: IIndicatorStyle;
    styleProps: Record<string, any>;
    cssClass: string;
}

/**
 * IndicatorStyle component renders a Mantine Indicator component for status indicators.
 * Supports processing animation, positioning, labels, and can wrap child components.
 *
 * @component
 * @param {IIndicatorStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Indicator with child content
 *
 * Supports all Mantine Indicator props:
 * - processing: Shows processing animation
 * - disabled: Disables the indicator
 * - position: Position relative to children (top-start, top-center, top-end, middle-start, middle-center, middle-end, bottom-start, bottom-center, bottom-end)
 * - label: Text label displayed in the indicator
 * - inline: Uses inline-block display instead of block
 * - offset: Distance from the positioned edge
 * - withBorder: Adds white border around indicator
 * - radius: Border radius of the indicator
 */
const IndicatorStyle: React.FC<IIndicatorStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const processing = style.mantine_indicator_processing?.content === '1';
    const disabled = style.mantine_indicator_disabled?.content === '1';
    const size = parseInt((style as any).mantine_indicator_size?.content || '10');
    const color = style.mantine_color?.content || 'red';
    const position = style.mantine_indicator_position?.content || 'top-end';
    const label = style.label?.content || '';
    const inline = style.mantine_indicator_inline?.content === '1';
    const offset = parseInt((style as any).mantine_indicator_offset?.content || '0');
    const withBorder = style.mantine_border?.content === '1';
    const radius = style.mantine_radius?.content || 'xl';
    const use_mantine_style = style.use_mantine_style?.content === '1';

    // Handle CSS field - use direct property from API response


    // Build style object
    const styleObj: React.CSSProperties = {};


    return (
        <Indicator
            processing={processing}
            disabled={disabled}
            size={size}
            color={color}
            position={position as any}
            label={label || undefined}
            inline={inline}
            offset={offset}
            withBorder={withBorder}
            radius={radius}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {children.length > 0 ? (
                children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))
            ) : (
                // Default content if no children
                <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    ?
                </div>
            )}
        </Indicator>
    );
};

export default IndicatorStyle;

