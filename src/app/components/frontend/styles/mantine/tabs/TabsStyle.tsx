import React from 'react';
import { Tabs } from '@mantine/core';
import { ITabsStyle, ITabStyle } from '../../../../../../types/common/styles.types';
import TabStyle from './TabStyle';
import BasicStyle from '../../BasicStyle';

/**
 * Props interface for TabsStyle component
 */
interface ITabsStyleProps {
    style: ITabsStyle;
}

/**
 * TabsStyle component renders a tabbed interface
 * Children must be TabStyle components
 * Uses Mantine UI Tabs component with new database fields
 */
const TabsStyle: React.FC<ITabsStyleProps> = ({ style }) => {
    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    // Extract field values with defaults
    const variant = style.mantine_tabs_variant?.content || 'default';
    const orientation = style.mantine_tabs_orientation?.content || 'horizontal';
    const radius = style.mantine_tabs_radius?.content || 'sm';
    const color = style.mantine_color?.content || 'blue';
    const width = style.mantine_width?.content;
    const height = style.mantine_height?.content;

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};
    if (width) styleObj.width = width;
    if (height) styleObj.height = height;

    // Find the first available tab as default (mantine_tab_value field was removed)
    const firstTab = children.find(child => child?.style_name === 'tab');

    // Calculate default tab value using section ID
    const defaultTab = firstTab?.id?.toString() || 'default-tab';

    const tabsProps: any = {
        defaultValue: defaultTab,
        variant,
        orientation: orientation as 'horizontal' | 'vertical',
        radius,
        color,
        style: styleObj,
        className: cssClass
    };

    return (
        <Tabs {...tabsProps}>
            <Tabs.List>
                {children.map((child: any, index: number) => {
                    if (!child || child.style_name !== 'tab' || !child.id) return null;

                    const tabStyle = child as ITabStyle;
                    const tabValue = tabStyle.id.toString();

                    return (
                        <TabStyle
                            key={`${child.id}-${index}`}
                            style={tabStyle}
                        />
                    );
                })}
            </Tabs.List>

            {children.map((child: any, index: number) => {
                if (!child || child.style_name !== 'tab' || !child.id) return null;

                const tabStyle = child as ITabStyle;
                const tabValue = tabStyle.id.toString();

                return (
                    <Tabs.Panel key={`${child.id}-${index}-panel`} value={tabValue}>
                        {Array.isArray(tabStyle.children)
                            ? tabStyle.children.map((childStyle: any, childIndex: number) => (
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
