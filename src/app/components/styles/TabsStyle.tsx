import React from 'react';
import { Tabs } from '@mantine/core';
import { ITabsStyle, ITabStyle } from '../../../types/common/styles.types';
import BasicStyle from './BasicStyle';

/**
 * Props interface for TabsStyle component
 */
interface ITabsStyleProps {
    style: ITabsStyle;
}

/**
 * TabsStyle component renders a tabbed interface
 * Children must be TabStyle components
 * Uses Mantine UI Tabs component
 */
const TabsStyle: React.FC<ITabsStyleProps> = ({ style }) => {
    // Find the default active tab with proper null checks
    const activeTab = style.children?.find(
        child => child?.style_name === 'tab' && (child as ITabStyle).is_active?.content === '1'
    );
    
    // Get the first available tab as fallback
    const firstTab = style.children?.find(child => child?.style_name === 'tab');
    
        // Calculate default tab value with proper fallbacks
    const defaultTab = activeTab?.id?.toString() ||
                      firstTab?.id?.toString() ||
                      'default-tab';

    return (
        <Tabs defaultValue={defaultTab} className={style.css || ''}>
            <Tabs.List>
                {style.children?.map((child) => {
                    if (!child || child.style_name !== 'tab' || !child.id) return null;
                    const tabStyle = child as ITabStyle;
                    const tabId = tabStyle.id.toString();
                    const label = tabStyle.label?.content || 'Tab';
                    const icon = tabStyle.icon?.content;

                    return (
                        <Tabs.Tab key={tabId} value={tabId}>
                            {icon && <span className={`icon ${icon}`} />}
                            {label}
                        </Tabs.Tab>
                    );
                })}
            </Tabs.List>

            {style.children?.map((child) => {
                if (!child || child.style_name !== 'tab' || !child.id) return null;
                const tabStyle = child as ITabStyle;
                const tabId = tabStyle.id.toString();

                return (
                    <Tabs.Panel key={tabId} value={tabId}>
                        {Array.isArray(tabStyle.children) 
                            ? tabStyle.children.map((childStyle, index) => (
                                childStyle && childStyle.id 
                                    ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> 
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