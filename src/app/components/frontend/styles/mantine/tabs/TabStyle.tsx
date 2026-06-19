/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Tabs } from '@mantine/core';
import { type ITabStyle } from '../../../../../../types/common/styles.types';
import { IconComponent } from '../../../../shared';

/**
 * Props interface for TabStyle component
 */
interface ITabStyleProps {
    style: ITabStyle;
    styleProps: Record<string, string>;
    cssClass: string;
    isActive?: boolean;
}

/**
 * TabStyle component renders an individual tab item
 * Can be used standalone or within a TabsStyle container
 * Uses Mantine UI Tabs.Tab component
 */
const TabStyle: React.FC<ITabStyleProps> = ({ style, styleProps, cssClass }) => {
    // Extract field values - web_tab_value field was removed, use section ID
    const value = style.id?.toString() || 'tab';
    const label = style.label?.content || 'Tab';
    const leftIconName = style.web_left_icon?.content;
    const rightIconName = style.web_right_icon?.content;
    const disabled = style.web_tab_disabled?.content === '1';
    const width = style.web_width?.content;
    const height = style.web_height?.content;

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    // Create icon sections using IconComponent
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : null;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : null;

    return (
        <Tabs.Tab
            {...styleProps}
            value={value}
            disabled={disabled}
            style={styleObj}
            className={cssClass}
            leftSection={leftSection}
            rightSection={rightSection}
        >
            {label}
        </Tabs.Tab>
    );
};

export default TabStyle;
