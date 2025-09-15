import React from 'react';
import { Indicator } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IIndicatorStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for IndicatorStyle component
 */
interface IIndicatorStyleProps {
    style: IIndicatorStyle;
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
const IndicatorStyle: React.FC<IIndicatorStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const processing = getFieldContent(style, 'mantine_indicator_processing') === '1';
    const disabled = getFieldContent(style, 'mantine_indicator_disabled') === '1';
    const size = parseInt(getFieldContent(style, 'mantine_indicator_size') || '10');
    const color = getFieldContent(style, 'mantine_color') || 'red';
    const position = getFieldContent(style, 'mantine_indicator_position') || 'top-end';
    const label = getFieldContent(style, 'label') || '';
    const inline = getFieldContent(style, 'mantine_indicator_inline') === '1';
    const offset = parseInt(getFieldContent(style, 'mantine_indicator_offset') || '0');
    const withBorder = getFieldContent(style, 'mantine_indicator_with_border') === '1';
    const radius = getFieldContent(style, 'mantine_radius') || 'xl';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
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
                className={cssClass}
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
    }

    // Fallback when Mantine styling is disabled
    const getPositionStyles = () => {
        const actualOffset = offset || 2;

        switch (position) {
            case 'top-start':
                return { top: `-${actualOffset}px`, left: `-${actualOffset}px` };
            case 'top-center':
                return { top: `-${actualOffset}px`, left: '50%', transform: 'translateX(-50%)' };
            case 'top-end':
                return { top: `-${actualOffset}px`, right: `-${actualOffset}px` };
            case 'middle-start':
                return { top: '50%', left: `-${actualOffset}px`, transform: 'translateY(-50%)' };
            case 'middle-center':
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
            case 'middle-end':
                return { top: '50%', right: `-${actualOffset}px`, transform: 'translateY(-50%)' };
            case 'bottom-start':
                return { bottom: `-${actualOffset}px`, left: `-${actualOffset}px` };
            case 'bottom-center':
                return { bottom: `-${actualOffset}px`, left: '50%', transform: 'translateX(-50%)' };
            case 'bottom-end':
                return { bottom: `-${actualOffset}px`, right: `-${actualOffset}px` };
            default:
                return { top: `-${actualOffset}px`, right: `-${actualOffset}px` };
        }
    };

    return (
        <div className={cssClass} style={{ ...styleObj, position: 'relative', display: inline ? 'inline-block' : 'block' }}>
            {/* Indicator dot */}
            <div
                style={{
                    position: 'absolute',
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: radius === 'xl' ? '50%' : '4px',
                    backgroundColor: disabled ? '#ccc' : color,
                    border: withBorder ? '2px solid white' : 'none',
                    zIndex: 1,
                    animation: processing ? 'pulse 2s infinite' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: Math.max(8, size - 4) + 'px',
                    fontWeight: 'bold',
                    ...getPositionStyles()
                }}
            >
                {label && <span>{label}</span>}
            </div>

            {/* Child content */}
            {children.length > 0 ? (
                children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))
            ) : (
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
        </div>
    );
};

export default IndicatorStyle;

