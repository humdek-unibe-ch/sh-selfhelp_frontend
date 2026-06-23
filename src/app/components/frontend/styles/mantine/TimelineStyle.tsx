/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Timeline } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import IconComponent from '../../../shared/common/IconComponent';
import { type ITimelineStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for TimelineStyle component
 */
/**
 * Props interface for ITimelineStyle component
 */
interface ITimelineStyleProps {
    style: ITimelineStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * TimelineStyle component renders a Mantine Timeline component for chronological displays.
 * Supports custom bullet sizes, line widths, and colors.
 *
 * @component
 * @param {ITimelineStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine Timeline with child timeline items
 */
const TimelineStyle: React.FC<ITimelineStyleProps> = ({ style, styleProps, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values using the new unified field structure
    const bulletSize = parseInt(style.web_timeline_bullet_size?.content || '24');
    const lineWidth = parseInt(style.web_timeline_line_width?.content || '2');
    const active = parseInt(style.web_timeline_active?.content || '0');
    const color = style.color?.content || 'blue';

    // Use the validated color from CMS
    const align = style.web_timeline_align?.content || 'left';

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};

    return (
        <Timeline
            active={active}
            bulletSize={bulletSize}
            lineWidth={lineWidth}
            color={color}
            align={align as 'left' | 'right'}
            {...styleProps} className={cssClass}
            style={styleObj}
        >
            {children.map((child, childIndex: number) => {
                if (!child) return null;

                // Timeline item children carry item-specific fields that are not
                // present on every style in the union; read them through a narrow view.
                const item = child as {
                    title?: { content?: string };
                    web_timeline_item_bullet?: { content?: string };
                    web_timeline_item_line_variant?: { content?: string };
                    color?: { content?: string };
                };

                // Extract timeline item fields
                const title = item.title?.content;
                const bulletIconName = item.web_timeline_item_bullet?.content;
                const lineVariant = item.web_timeline_item_line_variant?.content || 'solid';
                const itemColor = item.color?.content;

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
                        {itemChildren.map((grandChild, grandChildIndex: number) => (
                            grandChild ? <BasicStyle key={grandChildIndex} style={grandChild} /> : null
                        ))}
                    </Timeline.Item>
                );
            })}
        </Timeline>
    );
};

export default TimelineStyle;

