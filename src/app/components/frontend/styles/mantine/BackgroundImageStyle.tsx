import React from 'react';
import { BackgroundImage } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { IBackgroundImageStyle } from '../../../../../types/common/styles.types';

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
    const src = getFieldContent(style, 'src');
    const radius = getFieldContent(style, 'mantine_radius') || 'sm';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style && src) {
        return (
            <BackgroundImage
                src={src}
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
    }

    // Fallback to basic styled div when Mantine styling is disabled or no src
    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                backgroundImage: src ? `url(${src})` : 'linear-gradient(45deg, #f0f0f0, #e0e0e0)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: radius === 'xs' ? '2px' : radius === 'sm' ? '4px' : radius === 'lg' ? '8px' : radius === 'xl' ? '12px' : '6px',
                position: 'relative',
                minHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {children.length > 0 ? (
                children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))
            ) : (
                // Default content if no children
                <div style={{
                    padding: '40px',
                    color: src ? 'white' : '#666',
                    textAlign: 'center',
                    background: src ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
                    borderRadius: radius
                }}>
                    {src ? 'Background Image Content' : 'No background image set'}
                </div>
            )}
        </div>
    );
};

export default BackgroundImageStyle;

