import React from 'react';
import { ScrollArea } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IScrollAreaStyle } from '../../../../../types/common/styles.types';

/**
 * Props interface for ScrollAreaStyle component
 * @interface IScrollAreaStyleProps
 * @property {IScrollAreaStyle} style - The scroll area style configuration object
 */
interface IScrollAreaStyleProps {
    style: IScrollAreaStyle;
}

/**
 * ScrollAreaStyle component renders a Mantine ScrollArea component for custom scrollbars.
 * Provides custom scrollbar styling and behavior control.
 *
 * @component
 * @param {IScrollAreaStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine ScrollArea with styled children
 */
const ScrollAreaStyle: React.FC<IScrollAreaStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values for Mantine ScrollArea props
    const scrollbarSize = style.mantine_scroll_area_scrollbar_size?.content;
    const scrollbarType = style.mantine_scroll_area_type?.content;
    const offsetScrollbars = style.mantine_scroll_area_offset_scrollbars?.content === '1';
    const scrollHideDelay = style.mantine_scroll_area_scroll_hide_delay?.content;
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object for sizing properties
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    // Convert scrollHideDelay to number if provided
    const scrollHideDelayNumber = scrollHideDelay ? parseInt(scrollHideDelay, 10) : undefined;

    return (
        <ScrollArea
            scrollbarSize={scrollbarSize ? parseInt(scrollbarSize, 10) : 8}
            type={scrollbarType as "auto" | "always" | "scroll" | "hover" | "never"}
            offsetScrollbars={offsetScrollbars}
            scrollHideDelay={scrollHideDelayNumber}
            className={cssClass}
            style={styleObj}
        >
            {children.map((child: any, index: number) => (
                child ? <BasicStyle key={index} style={child} /> : null
            ))}
        </ScrollArea>
    );
};

export default ScrollAreaStyle;
