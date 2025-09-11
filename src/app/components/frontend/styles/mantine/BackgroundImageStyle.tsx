import React from 'react';
import { BackgroundImage } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IBackgroundImageStyle } from '../../../../../types/common/styles.types';
import { getAssetUrl } from '../../../../../utils/asset-url.utils';

/**
 * Props interface for BackgroundImageStyle component
 */
interface IBackgroundImageStyleProps {
    style: IBackgroundImageStyle;
}

/**
 * BackgroundImageStyle component renders a Mantine BackgroundImage component.
 * Provides background image functionality with child content overlay.
 *
 * @component
 * @param {IBackgroundImageStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine BackgroundImage with child content
 */
const BackgroundImageStyle: React.FC<IBackgroundImageStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const src = getFieldContent(style, 'img_src');
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <BackgroundImage
            src={ getAssetUrl(src)}
            radius={radius === 'none' ? 0 : radius}
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
                    padding: '40px',
                    color: 'white',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: radius
                }}>
                    Background Image Content
                </div>
            )}
        </BackgroundImage>
    );
};

export default BackgroundImageStyle;

