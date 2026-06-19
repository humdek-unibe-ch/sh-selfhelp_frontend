/*
SPDX-FileCopyrightText: 2026 Humdek, University of Bern
SPDX-License-Identifier: MPL-2.0
*/
import React from 'react';
import { Tabs } from '@mantine/core';
import { type ITabsStyle, type ITabStyle } from '../../../../../../types/common/styles.types';
import TabStyle from './TabStyle';
import BasicStyle, { getCssClass, getSpacingProps } from '../../BasicStyle';

/**
 * Props interface for TabsStyle component
 */
/**
 * Props interface for ITabsStyle component
 */
interface ITabsStyleProps {
    style: ITabsStyle;
    styleProps: Record<string, string>;
    cssClass: string;
}

/**
 * TabsStyle component renders a tabbed interface
 * Children must be TabStyle components
 * Uses Mantine UI Tabs component with new database fields
 */
const TabsStyle: React.FC<ITabsStyleProps> = ({ style, cssClass }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values with defaults
    const variant = style.web_tabs_variant?.content || 'default';
    const orientation = style.web_tabs_orientation?.content || 'horizontal';
    const radius = style.web_tabs_radius?.content || 'sm';
    const color = style.shared_color?.content || 'blue';
    const width = style.web_width?.content;
    const height = style.web_height?.content;

    // Handle CSS field - use direct property from API response
    

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    // Find the first available tab as default (web_tab_value field was removed)
    const firstTab = children.find(child => child?.style_name === 'tab');

    // Calculate default tab value using section ID
    const defaultTab = firstTab?.id?.toString() || 'default-tab';

    const tabsProps = {
        defaultValue: defaultTab,
        variant,
        orientation: orientation as 'horizontal' | 'vertical',
        radius,
        color,
        style: styleObj,
        className: cssClass
    };

    return (
        <Tabs {...(tabsProps as React.ComponentProps<typeof Tabs>)}>
            <Tabs.List>
                {children.map((child, index: number) => {
                    if (!child || child.style_name !== 'tab' || !child.id) return null;

                    const tabStyle = child as ITabStyle;
                    const _tabValue = tabStyle.id.toString();
                    const tabStyleProps = getSpacingProps(tabStyle);
                    const tabCssClass = getCssClass(tabStyle);


                    return (
                        <TabStyle
                            key={`${child.id}-${index}`}
                            style={tabStyle}
                            styleProps={tabStyleProps}
                            cssClass={tabCssClass}
                        />
                    );
                })}
            </Tabs.List>

            {children.map((child, index: number) => {
                if (!child || child.style_name !== 'tab' || !child.id) return null;

                const tabStyle = child as ITabStyle;
                const tabValue = tabStyle.id.toString();

                return (
                    <Tabs.Panel key={`${child.id}-${index}-panel`} value={tabValue}>
                        {Array.isArray(tabStyle.children)
                            ? tabStyle.children.map((childStyle, childIndex: number) => (
                                childStyle && childStyle.id
                                    ? <BasicStyle key={`${childStyle.id}-${childIndex}`} style={childStyle} />
                                    : null
                            ))
                            : null
                        }
                    </Tabs.Panel>
                );
            })}
        </Tabs>
    );
};

export default TabsStyle;
