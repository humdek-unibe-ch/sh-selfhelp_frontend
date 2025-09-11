import React from 'react';
import { Timeline } from '@mantine/core';
import IconComponent from '../../../shared/common/IconComponent';
import BasicStyle from '../BasicStyle';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import { ITimelineItemStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TimelineItemStyle component
 */
interface ITimelineItemStyleProps {
    style: ITimelineItemStyle;
}

/**
 * TimelineItemStyle component renders a Mantine Timeline.Item component for individual timeline entries.
 * Can contain child components and supports custom bullets and colors.
 *
 * @component
 * @param {ITimelineItemStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Timeline.Item with child content
 */
const TimelineItemStyle: React.FC<ITimelineItemStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const title = getFieldContent(style, 'title');
    const bulletIconName = getFieldContent(style, 'mantine_timeline_item_bullet');
    const lineVariant = getFieldContent(style, 'mantine_timeline_item_line_variant') || 'solid';
    const color = getFieldContent(style, 'mantine_color') || 'blue';
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get bullet icon
    const bullet = bulletIconName ? <IconComponent iconName={bulletIconName} size={16} /> : undefined;

    if (use_mantine_style) {
        return (
            <Timeline.Item
                title={title}
                bullet={bullet}
                lineVariant={lineVariant as 'solid' | 'dashed' | 'dotted'}
                color={color}
                className={cssClass}
                style={styleObj}
            >
                {children.map((child: any, index: number) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </Timeline.Item>
        );
    }

    // Fallback to basic timeline item structure when Mantine styling is disabled
    return (
        <div className={cssClass} style={{ ...styleObj, position: 'relative', paddingLeft: '40px', marginBottom: '24px' }}>
            {/* Timeline line */}
            <div
                style={{
                    position: 'absolute',
                    left: '15px',
                    top: '0',
                    bottom: '-24px',
                    width: '2px',
                    backgroundColor: color,
                    borderStyle: lineVariant,
                    borderWidth: lineVariant === 'dashed' ? '0 0 4px 0' : lineVariant === 'dotted' ? '0 0 2px 0' : 'none',
                    borderColor: color
                }}
            />

            {/* Timeline bullet */}
            <div
                style={{
                    position: 'absolute',
                    left: '8px',
                    top: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    zIndex: 1
                }}
            >
                {bullet || '●'}
            </div>

            {/* Content */}
            <div>
                {title && (
                    <h4 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#333'
                    }}>
                        {title}
                    </h4>
                )}
                <div>
                    {children.map((child: any, index: number) => (
                        child ? <BasicStyle key={index} style={child} /> : null
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TimelineItemStyle;

