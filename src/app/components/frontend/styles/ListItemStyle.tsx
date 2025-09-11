import React from 'react';
import { List } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { IListItemStyle } from '../../../../types/common/styles.types';
import { getFieldContent } from '../../../../utils/style-field-extractor';
import IconComponent from '../../shared/common/IconComponent';

/**
 * Props interface for ListItemStyle component
 */
interface IListItemStyleProps {
    style: IListItemStyle;
}

/**
 * ListItemStyle component renders a Mantine List.Item component.
 * Can contain child components and supports optional icons.
 *
 * @component
 * @param {IListItemStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine List.Item with child content
 */
const ListItemStyle: React.FC<IListItemStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const iconName = getFieldContent(style, 'mantine_list_item_icon');
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Get icon section using IconComponent
    const icon = iconName ? <IconComponent iconName={iconName} size={16} /> : undefined;

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    if (use_mantine_style) {
        return (
            <List.Item
                icon={icon}
                className={cssClass}
                style={styleObj}
            >
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </List.Item>
        );
    }

    // Fallback to basic list item when Mantine styling is disabled
    return (
        <div
            className={cssClass}
            style={{
                ...styleObj,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: '8px'
            }}
        >
            {icon && (
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    {icon}
                </div>
            )}
            <div style={{ flex: 1 }}>
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </div>
        </div>
    );
};

export default ListItemStyle;
