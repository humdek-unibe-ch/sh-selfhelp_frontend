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
 * Supports processing animation and can wrap child components.
 *
 * @component
 * @param {IIndicatorStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Indicator with child content
 */
const IndicatorStyle: React.FC<IIndicatorStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const processing = getFieldContent(style, 'mantine_indicator_processing') === '1';
    const disabled = getFieldContent(style, 'mantine_indicator_disabled') === '1';
    const size = getFieldContent(style, 'mantine_size') || 'md';
    const color = getFieldContent(style, 'mantine_color') || 'red';
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
                size={parseInt(size.replace('px', '')) || 10}
                color={color}
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
    return (
        <div className={cssClass} style={{ ...styleObj, position: 'relative', display: 'inline-block' }}>
            {/* Indicator dot */}
            <div
                style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: processing ? '12px' : '8px',
                    height: processing ? '12px' : '8px',
                    borderRadius: '50%',
                    backgroundColor: disabled ? '#ccc' : color,
                    border: '2px solid white',
                    zIndex: 1,
                    animation: processing ? 'pulse 2s infinite' : 'none'
                }}
            />

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

