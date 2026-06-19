/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { AspectRatio } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { type IAspectRatioStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for AspectRatioStyle component
 */
/**
 * Props interface for IAspectRatioStyle component
 */
interface IAspectRatioStyleProps {
    style: IAspectRatioStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * AspectRatioStyle component renders a Mantine AspectRatio component for maintaining aspect ratios.
 * Commonly used for videos, images, and other media content.
 *
 * Features:
 * - Supports custom aspect ratios via creatable select field
 * - Returns null when Mantine styling is disabled (no fallback)
 * - Robust ratio parsing with validation
 * - Default placeholder content with ratio information
 *
 * @component
 * @param {IAspectRatioStyleProps} props - Component props
 * @returns {JSX.Element|null} Rendered Mantine AspectRatio with child content or null
 */
const AspectRatioStyle: React.FC<IAspectRatioStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const ratio = style.web_aspect_ratio?.content || '16/9';
    // Handle CSS field - use direct property from API response
    

    // Parse ratio (e.g., "16/9" -> 16/9)
    const parseRatio = (ratioStr: string): number => {
        if (!ratioStr || typeof ratioStr !== 'string') {
            return 16/9; // Default aspect ratio
        }

        const parts = ratioStr.split('/');
        if (parts.length === 2) {
            const num = parseFloat(parts[0]);
            const den = parseFloat(parts[1]);

            if (!isNaN(num) && !isNaN(den) && den !== 0) {
                return num / den;
            }
        }
        return 16/9; // Default aspect ratio
    };

    const aspectRatio = parseRatio(ratio);

    return (
        <AspectRatio
            ratio={aspectRatio}
            {...styleProps} className={cssClass}
        >
            {children.length > 0 ? (
                children.map((child, index: number) => (
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
                    fontSize: '1.2rem',
                    padding: '1rem',
                    textAlign: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📐</div>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                            Aspect Ratio: {ratio}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            Add child components to display content
                        </div>
                    </div>
                </div>
            )}
        </AspectRatio>
    );
};

export default AspectRatioStyle;

