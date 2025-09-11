import React from 'react';
import { List } from '@mantine/core';
import BasicStyle from './BasicStyle';
import { IListStyle } from '../../../../types/common/styles.types';
import { getFieldContent, castMantineSize } from '../../../../utils/style-field-extractor';

/**
 * Props interface for ListStyle component
 */
interface IListStyleProps {
    style: IListStyle;
}

/**
 * ListStyle component renders a Mantine List component.
 * Supports ordered/unordered lists and can contain ListItem children.
 *
 * @component
 * @param {IListStyleProps} props - Component props
 * @returns {JSX.Element} Rendered Mantine List with child content
 */
const ListStyle: React.FC<IListStyleProps> = ({ style }) => {
    // Extract field values using the new unified field structure
    const type = getFieldContent(style, 'mantine_list_type') || 'unordered';
    const spacing = getFieldContent(style, 'mantine_list_spacing') || 'md';
    const size = castMantineSize(getFieldContent(style, 'mantine_size'));
    const use_mantine_style = getFieldContent(style, 'use_mantine_style') === '1';

    // Handle CSS field - use direct property from API response
    const cssClass = "section-" + style.id + " " + (style.css ?? '');

    // Build style object
    const styleObj: React.CSSProperties = {};

    // Ensure children is an array before mapping
    const children = Array.isArray(style.children) ? style.children : [];

    if (use_mantine_style) {
        return (
            <List
                type={type as 'unordered' | 'ordered'}
                size={size}
                spacing={spacing as 'xs' | 'sm' | 'md' | 'lg' | 'xl'}
                className={cssClass}
                style={styleObj}
            >
                {children.map((childStyle, index) => (
                    childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                ))}
            </List>
        );
    }

    // Fallback to basic HTML list when Mantine styling is disabled
    const ListTag = type === 'ordered' ? 'ol' : 'ul';

    const getSpacingStyle = (spacing: string) => {
        const spacings = {
            'xs': '4px',
            'sm': '8px',
            'md': '12px',
            'lg': '16px',
            'xl': '20px'
        };
        return spacings[spacing as keyof typeof spacings] || spacings.md;
    };

    return (
        <ListTag
            className={cssClass}
            style={{
                ...styleObj,
                margin: 0,
                paddingLeft: type === 'unordered' ? '20px' : '16px',
                listStyleType: type === 'ordered' ? 'decimal' : 'disc',
                fontSize: size === 'xs' ? '12px' :
                         size === 'sm' ? '14px' :
                         size === 'md' ? '16px' :
                         size === 'lg' ? '18px' :
                         size === 'xl' ? '20px' : '16px'
            }}
        >
            {children.map((childStyle, index) => (
                <li
                    key={`${childStyle.id}-${index}`}
                    style={{
                        marginBottom: getSpacingStyle(spacing)
                    }}
                >
                    {childStyle ? <BasicStyle style={childStyle} /> : null}
                </li>
            ))}
        </ListTag>
    );
};

export default ListStyle;
