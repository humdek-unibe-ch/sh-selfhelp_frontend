import React from 'react';
import { Card, Title, Collapse, ActionIcon, Group } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconEdit } from '@tabler/icons-react';
import { useState } from 'react';
import BasicStyle from './BasicStyle';
import styles from './CardStyle.module.css';
import { ICardStyle } from '../../../types/common/styles.types';
import { getFieldContent, hasFieldValue } from '../../../utils/style-field-extractor';

/**
 * Props interface for CardStyle component
 * @interface ICardStyleProps
 * @property {ICardStyle} style - The card style configuration object
 */
interface ICardStyleProps {
    style: ICardStyle;
}

/**
 * CardStyle component renders a Mantine Card container with optional child elements.
 * Supports collapsible cards, different card types, and edit functionality.
 * Uses Mantine UI Card component for consistent theming.
 *
 * @component
 * @param {ICardStyleProps} props - Component props
 * @returns {JSX.Element} Rendered card with styled children
 */
const CardStyle: React.FC<ICardStyleProps> = ({ style }) => {
    const title = getFieldContent(style, 'title');
    const type = getFieldContent(style, 'type') || 'light';
    const isExpandedDefault = hasFieldValue(style, 'is_expanded');
    const isCollapsible = hasFieldValue(style, 'is_collapsible');
    const editUrl = getFieldContent(style, 'url_edit');
    const cssClass = getFieldContent(style, 'css');

    const [isExpanded, setIsExpanded] = useState(isExpandedDefault);

    // Map legacy Bootstrap-style types to Mantine theme colors
    const typeColorMap: Record<string, string> = {
        'primary': 'blue',
        'secondary': 'gray',
        'success': 'green',
        'danger': 'red',
        'warning': 'yellow',
        'info': 'cyan',
        'light': 'gray.1',
        'dark': 'dark'
    };

    const cardColor = typeColorMap[type] || 'gray.1';

    return (
        <Card 
            shadow="sm" 
            padding="lg" 
            radius="md" 
            withBorder
            className={`${cssClass} ${styles.card}`}
            bg={cardColor}
        >
            {title && (
                <Card.Section 
                    withBorder 
                    inheritPadding 
                    py="xs"
                    className={styles.cardHeader}
                >
                    <Group justify="space-between" align="center">
                        <Title order={4} className={styles.cardTitle}>
                            {title}
                        </Title>
                        <Group gap="xs">
                            {editUrl && (
                                <ActionIcon
                                    variant="subtle"
                                    size="sm"
                                    component="a"
                                    href={editUrl}
                                    title="Edit"
                                >
                                    <IconEdit size={16} />
                                </ActionIcon>
                            )}
                            {isCollapsible && (
                                <ActionIcon
                                    variant="subtle"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    title={isExpanded ? "Collapse" : "Expand"}
                                >
                                    {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                </ActionIcon>
                            )}
                        </Group>
                    </Group>
                </Card.Section>
            )}

            <Collapse in={!isCollapsible || isExpanded}>
                <div className={styles.cardBody}>
                    <Card.Section>
                        {Array.isArray(style.children) 
                            ? style.children.map((childStyle, index) => (
                                childStyle ? <BasicStyle key={`${childStyle.id}-${index}`} style={childStyle} /> : null
                            ))
                            : null
                        }
                    </Card.Section>
                </div>
            </Collapse>
        </Card>
    );
};

export default CardStyle;