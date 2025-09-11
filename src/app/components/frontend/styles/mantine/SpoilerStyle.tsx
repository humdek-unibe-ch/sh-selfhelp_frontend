import React from 'react';
import { Spoiler } from '@mantine/core';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ISpoilerStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for SpoilerStyle component
 */
interface ISpoilerStyleProps {
    style: ISpoilerStyle;
}

/**
 * SpoilerStyle component renders a Mantine Spoiler component for collapsible text.
 * Supports custom show/hide labels and maximum height configuration.
 *
 * @component
 * @param {ISpoilerStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Spoiler with child content
 */
const SpoilerStyle: React.FC<ISpoilerStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const maxHeight = parseInt(getFieldContent(style, 'mantine_spoiler_max_height') || '100');
    const showLabel = getFieldContent(style, 'mantine_spoiler_show_label') || 'Show more';
    const hideLabel = getFieldContent(style, 'mantine_spoiler_hide_label') || 'Hide';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get child content as text
    const getChildContent = () => {
        if (children.length === 0) {
            return getFieldContent(style, 'content') || 'This is some collapsible content that can be shown or hidden.';
        }

        // For now, return a simple text representation
        // In a real implementation, you might want to render the children and extract text
        return 'Collapsible content from child components';
    };

    const content = getChildContent();

    if (use_mantine_style) {
        return (
            <Spoiler
                maxHeight={maxHeight}
                showLabel={showLabel}
                hideLabel={hideLabel}
                className={cssClass}
                style={styleObj}
            >
                {content}
            </Spoiler>
        );
    }

    // Fallback to basic collapsible div when Mantine styling is disabled
    return (
        <div className={cssClass} style={styleObj}>
            <div
                style={{
                    maxHeight: `${maxHeight}px`,
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {content}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '40px',
                    background: 'linear-gradient(transparent, white)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                }}>
                    <button
                        style={{
                            background: '#1976d2',
                            color: 'white',
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                        onClick={() => {
                            // Simple toggle functionality
                            const contentDiv = document.querySelector(`.section-${style.id} > div`) as HTMLElement;
                            if (contentDiv) {
                                contentDiv.style.maxHeight = contentDiv.style.maxHeight ? '' : `${maxHeight}px`;
                            }
                        }}
                    >
                        {showLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpoilerStyle;

