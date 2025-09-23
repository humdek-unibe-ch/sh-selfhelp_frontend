import React from 'react';
import { Avatar, Text, ThemeIcon, Timeline } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import IconComponent from '../../../shared/common/IconComponent';
import { ITimelineStyle } from '../../../../../types/common/styles.types';
import { IconSun, IconVideo } from '@tabler/icons-react';

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
    const bulletSize = parseInt((style as any).mantine_timeline_bullet_size?.content || '24');
    const lineWidth = parseInt((style as any).mantine_timeline_line_width?.content || '2');
    const active = parseInt((style as any).mantine_timeline_active?.content || '0');
    const color = style.mantine_color?.content || 'blue';

    // Use the validated color from CMS
    const align = style.mantine_timeline_align?.content || 'left';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <Timeline
            active={active}
            bulletSize={bulletSize}
            lineWidth={lineWidth}
            color={color}
            align={align as 'left' | 'right'}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child: any, childIndex: number) => {
                if (!child) return null;

                // Extract timeline item fields
                const title = (child as any).title?.content;
                const bulletIconName = (child as any).mantine_timeline_item_bullet?.content;
                const lineVariant = (child as any).mantine_timeline_item_line_variant?.content || 'solid';
                const itemColor = (child as any).mantine_color?.content;

                // Determine if this item should inherit parent's color or use its own
                // If the item index is within the parent's active range, use parent color
                const shouldInheritParentColor = childIndex <= active;
                // For active items, explicitly use parent color if available
                // For inactive items, use their own color if specified
                const effectiveColor = shouldInheritParentColor && color ? color : itemColor;

                // Handle CSS field - use direct property from API response
                const itemCssClass = "section-" + child.id + " " + (child.css ?? '');

                // Build style object
                const itemStyleObj: React.CSSProperties = {};

                // Get bullet icon
                const bullet = bulletIconName ? <IconComponent iconName={bulletIconName} size={16} /> : undefined;

                // Build props object conditionally
                const itemProps: any = {
                    title,
                    bullet,
                    lineVariant: lineVariant as 'solid' | 'dashed' | 'dotted',
                    className: itemCssClass,
                    style: itemStyleObj
                };

                // Only add color if it's defined (to avoid overriding parent Timeline color)
                if (effectiveColor) {
                    itemProps.color = effectiveColor;
                }

                // Ensure item children is an array before mapping
                const itemChildren = Array.isArray(child.children) ? child.children : [];

                return (
                    <Timeline.Item 
                    key={childIndex}
                    color={effectiveColor}
                    title={title}
                    bullet={bullet}
                    lineVariant={lineVariant as 'solid' | 'dashed' | 'dotted'}
                    className={itemCssClass}
                    style={itemStyleObj}
                    >
                        {itemChildren.map((grandChild: any, grandChildIndex: number) => (
                            grandChild ? <BasicStyle key={grandChildIndex} style={grandChild} /> : null
                        ))}
                    </Timeline.Item>
                );
            })}
        </Timeline>
    );
};

export default TimelineStyle;

