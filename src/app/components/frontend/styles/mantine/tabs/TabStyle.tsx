import React from 'react';
import { Tabs } from '@mantine/core';
import { getFieldContent } from '../../../../../../utils/style-field-extractor';
import { ITabStyle } from '../../../../../../types/common/styles.types';
import { IconComponent } from '../../../../shared';

/**
 * Props interface for TabStyle component
 */
interface ITabStyleProps {
    style: ITabStyle;
    isActive?: boolean;
}

/**
 * TabStyle component renders an individual tab item
 * Can be used standalone or within a TabsStyle container
 * Uses Mantine UI Tabs.Tab component
 */
const TabStyle: React.FC<ITabStyleProps> = ({ style, isActive = false }) => {
    // Extract field values - mantine_tab_value field was removed, use section ID
    const value = style.id?.toString() || 'tab';
    const label = getFieldContent(style, 'label') || 'Tab';
    const leftIconName = getFieldContent(style, 'mantine_left_icon');
    const rightIconName = getFieldContent(style, 'mantine_right_icon');
    const disabled = getFieldContent(style, 'mantine_tab_disabled') === '1';
    const width = getFieldContent(style, 'mantine_width');
    const height = getFieldContent(style, 'mantine_height');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    // Create icon sections using IconComponent
    const leftSection = leftIconName ? <IconComponent iconName={leftIconName} size={16} /> : null;
    const rightSection = rightIconName ? <IconComponent iconName={rightIconName} size={16} /> : null;

    const tabProps: any = {
        value,
        disabled,
        style: styleObj,
        className: cssClass,
        leftSection,
        rightSection
    };

    return (
        <Tabs.Tab {...tabProps}>
            {label}
        </Tabs.Tab>
    );
};

export default TabStyle;
