import React from 'react';
import { Timeline } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ITimelineStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TimelineStyle component
 */
interface ITimelineStyleProps {
    style: ITimelineStyle;
}

/**
 * TimelineStyle component renders a Mantine Timeline component for chronological displays.
 * Supports custom bullet sizes, line widths, and colors.
 *
 * @component
 * @param {ITimelineStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Timeline with child timeline items
 */
const TimelineStyle: React.FC<ITimelineStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const bulletSize = parseInt(getFieldContent(style, 'mantine_size') || '16') as any;
    const lineWidth = parseInt(getFieldContent(style, 'mantine_timeline_line_width') || '2');
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    if (use_mantine_style) {
        return (
            <Timeline
                bulletSize={bulletSize}
                lineWidth={lineWidth}
                color={color}
                className={cssClass}
                style={styleObj}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Timeline>
        );
    }

    // Fallback to basic timeline structure when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj, position: 'relative' }}>
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}

            {/* If no children, show a sample timeline */}
            {children.length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Timeline</h3>
                    <p>Add Timeline.Item components as children to display timeline entries.</p>
                </div>
            )}
        </div>
    );
};

export default TimelineStyle;

