import React, { useState } from 'react';
import { Box, List, Text, ActionIcon, Group, TextInput } from '@mantine/core';
import { INestedListStyle } from '../../../../types/common/styles.types';
import { IconChevronDown, IconChevronRight, IconSearch } from '@tabler/icons-react';

interface INestedListStyleProps {
    style: INestedListStyle;
}

const NestedListStyle: React.FC<INestedListStyleProps> = ({ style }) => {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    
    const titlePrefix = style.title_prefix?.content || '';
    const isExpanded = style.is_expanded?.content === '1';
    const isCollapsible = style.is_collapsible?.content === '1';
    const searchText = style.search_text?.content;
    const idPrefix = style.id_prefix?.content || 'nested';
    const idActive = style.id_active?.content;

    // Parse items - handle both array and JSON string formats
    let items: any[] = [];
    try {
        const itemsContent = style.items?.content;
        if (Array.isArray(itemsContent)) {
            items = itemsContent;
        } else if (itemsContent && typeof itemsContent === 'string') {
            const stringContent = itemsContent as string;
            if (stringContent.trim()) {
                items = JSON.parse(stringContent);
            }
        }
    } catch (error) {

        items = [];
    }

    const toggleItem = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    const renderNestedItem = (item: any, index: number, level: number = 0): React.ReactNode => {
        const itemId = `${idPrefix}-${index}-${level}`;
        const hasChildren = item.children && Array.isArray(item.children) && item.children.length > 0;
        const isItemExpanded = expandedItems.has(itemId) || (isExpanded && level === 0);
        const title = `${titlePrefix}${item.title || item.text || item.label || `Item ${index + 1}`}`;

        // Filter based on search term
        if (searchTerm && !title.toLowerCase().includes(searchTerm.toLowerCase())) {
            return null;
        }

        return (
            <List.Item key={itemId} style={{ marginLeft: level * 20 }}>
                <Group gap="xs" align="center">
                    {hasChildren && isCollapsible && (
                        <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => toggleItem(itemId)}
                        >
                            {isItemExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                        </ActionIcon>
                    )}
                    <Text 
                        size="sm" 
                        fw={hasChildren ? 500 : 400}
                        c={itemId === idActive ? 'blue' : undefined}
                    >
                        {title}
                    </Text>
                </Group>
                
                {hasChildren && isItemExpanded && (
                    <List mt="xs" spacing="xs">
                        {item.children.map((child: any, childIndex: number) => 
                            renderNestedItem(child, childIndex, level + 1)
                        )}
                    </List>
                )}
            </List.Item>
        );
    };

    return (
        <Box className={style.css}>
            {searchText && (
                <TextInput
                    placeholder={searchText}
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    mb="md"
                />
            )}
            
            <List spacing="xs" size="sm">
                {items.map((item: any, index: number) => renderNestedItem(item, index))}
            </List>
        </Box>
    );
};

export default NestedListStyle; 