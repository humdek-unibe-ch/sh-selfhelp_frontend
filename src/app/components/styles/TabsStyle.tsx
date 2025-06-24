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
    // Find the default active tab
    const defaultTab = style.children?.find(
        child => child?.style_name === 'tab' && (child as ITabStyle).is_active?.content === '1'
    )?.id.content.toString() || style.children?.[0]?.id.content.toString();

    return (
        <Tabs defaultValue={defaultTab} className={style.css || ''}>
            <Tabs.List>
                {style.children?.map((child) => {
                    if (!child || child.style_name !== 'tab') return null;
                    const tabStyle = child as ITabStyle;
                    const tabId = tabStyle.id.content.toString();
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
                if (!child || child.style_name !== 'tab') return null;
                const tabStyle = child as ITabStyle;
                const tabId = tabStyle.id.content.toString();

                return (
                    <Tabs.Panel key={tabId} value={tabId}>
                        {tabStyle.children?.map((childStyle, index) => (
                            childStyle ? <BasicStyle key={`${childStyle.id.content}-${index}`} style={childStyle} /> : null
                        ))}
                    </Tabs.Panel>
                );
            })}
        </Tabs>
    );
};

export default TabsStyle; 