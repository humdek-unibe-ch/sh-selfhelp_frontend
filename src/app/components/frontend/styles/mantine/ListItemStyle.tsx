import React from 'react';
import { List } from '@mantine/core';
import BasicStyle from '../BasicStyle';
import { IListItemStyle } from '../../../../../types/common/styles.types';
import { getFieldContent } from '../../../../../utils/style-field-extractor';
import IconComponent from '../../../shared/common/IconComponent';

/**
 * Props interface for ListItemStyle component
 */
interface IListItemStyleProps {
    style: IListItemStyle;
}

/**
 * ListItemStyle component renders a Mantine List.Item component.
 * Displays content from the content field and supports optional icons and child components.
 *
 * @component
 * @param {IListItemStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine List.Item with content and children
 */
const ListItemStyle: React.FC<IListItemStyleProps> = ({ style }) => {
    // Extract Mantine-specific props
    const content = getFieldContent(style, 'mantine_list_item_content');
    const iconName = getFieldContent(style, 'mantine_list_item_icon');

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Get icon component using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    return (
        <List.Item
            icon={icon}
            className={cssClass}
        >
            {content}
            {children.map((childStyle, index) => (
                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
            ))}
        </List.Item>
    );

};

export default ListItemStyle;
