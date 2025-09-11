import React from 'react';
import { AspectRatio } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IAspectRatioStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for AspectRatioStyle component
 */
interface IAspectRatioStyleProps {
    style: IAspectRatioStyle;
}

/**
 * AspectRatioStyle component renders a Mantine AspectRatio component for maintaining aspect ratios.
 * Commonly used for videos, images, and other media content.
 *
 * @component
 * @param {IAspectRatioStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine AspectRatio with child content
 */
const AspectRatioStyle: React.FC<IAspectRatioStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const ratio = getFieldContent(style, 'mantine_aspect_ratio') || '16/9';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Parse ratio (e.g., "16/9" -> 16/9)
    const parseRatio = (ratioStr: string): number => {
        const parts = ratioStr.split('/');
        if (parts.length === 2) {
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);
            return num / den;
        }
        return 16/9; // Default aspect ratio
    };

    const aspectRatio = parseRatio(ratio);

    if (use_mantine_style) {
        return (
            <AspectRatio
                ratio={aspectRatio}
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
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        fontSize: '1.2rem'
                    }}>
                        {ratio} Aspect Ratio Content
                    </div>
                )}
            </AspectRatio>
        );
    }

    // Fallback to basic styled div when Mantine styling is disabled
    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                position: 'relative',
                width: '100%',
                paddingBottom: `${(1 / aspectRatio) * 100}%`,
                overflow: 'hidden'
            }}
        >
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
            }}>
                {children.length > 0 ? (
                    children.map((child: any, index: number) => (
                        child ? <BasicStyle key={index} style={child} /> : null
                    ))
                ) : (
                    // Default content if no children
                    <div style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#666',
                        fontSize: '1.2rem'
                    }}>
                        {ratio} Aspect Ratio Content
                    </div>
                )}
            </div>
        </div>
    );
};

export default AspectRatioStyle;

