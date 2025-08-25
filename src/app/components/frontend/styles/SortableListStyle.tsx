import React, { useState } from 'react';
import { Box, List, Text, ActionIcon, Group, Button } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { ISortableListStyle } from '../../../../types/common/styles.types';
import { IconGripVertical, IconTrash, IconPlus } from '@tabler/icons-react';

interface ISortableListStyleProps {
    style: ISortableListStyle;
}

const SortableListStyle: React.FC<ISortableListStyleProps> = ({ style }) => {
    const router = useRouter();
    
    // Parse items - handle both array and JSON string formats
    let initialItems: any[] = [];
    try {
        const itemsContent = style.items?.content;
        if (Array.isArray(itemsContent)) {
            initialItems = itemsContent;
        } else if (itemsContent && typeof itemsContent === 'string') {
            const stringContent = itemsContent as string;
            if (stringContent.trim()) {
                initialItems = JSON.parse(stringContent);
            }
        }
    } catch (error) {

        initialItems = [];
    }

    const [items, setItems] = useState(initialItems);
    
    const isSortable = style.is_sortable?.content === '1';
    const isEditable = style.is_editable?.content === '1';
    const urlDelete = style.url_delete?.content;
    const labelAdd = style.label_add?.content || 'Add Item';
    const urlAdd = style.url_add?.content;

    const handleDelete = (index: number) => {
        if (urlDelete) {
            const deleteUrl = urlDelete.replace('{id}', items[index]?.id || index.toString());
            
            // Check if URL is internal (relative or same origin)
            const isInternal = deleteUrl.startsWith('/') || 
                              (typeof window !== 'undefined' && deleteUrl.startsWith(window.location.origin));
            
            if (isInternal) {
                // Use Next.js router for internal navigation
                const path = deleteUrl.replace(window.location.origin, '');
                router.push(path);
            } else {
                // Use window.location for external URLs
                window.location.href = deleteUrl;
            }
        } else {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    const handleAdd = () => {
        if (urlAdd) {
            // Check if URL is internal (relative or same origin)
            const isInternal = urlAdd.startsWith('/') || 
                              (typeof window !== 'undefined' && urlAdd.startsWith(window.location.origin));
            
            if (isInternal) {
                // Use Next.js router for internal navigation
                const path = urlAdd.replace(window.location.origin, '');
                router.push(path);
            } else {
                // Use window.location for external URLs
                window.location.href = urlAdd;
            }
        } else {
            const newItem = {
                id: Date.now(),
                title: `New Item ${items.length + 1}`,
                text: `Item ${items.length + 1}`
            };
            setItems([...items, newItem]);
        }
    };

    const moveItem = (fromIndex: number, toIndex: number) => {
        const newItems = [...items];
        const [movedItem] = newItems.splice(fromIndex, 1);
        newItems.splice(toIndex, 0, movedItem);
        setItems(newItems);
    };

    return (
        <Box className={style.css}>
            <List spacing="xs" size="sm">
                {items.map((item: any, index: number) => (
                    <List.Item key={item.id || index}>
                        <Group justify="space-between" align="center">
                            <Group gap="xs" align="center">
                                {isSortable && (
                                    <ActionIcon
                                        size="sm"
                                        variant="subtle"
                                        style={{ cursor: 'grab' }}
                                    >
                                        <IconGripVertical size={14} />
                                    </ActionIcon>
                                )}
                                <Text size="sm">
                                    {item.title || item.text || item.label || `Item ${index + 1}`}
                                </Text>
                            </Group>
                            
                            {isEditable && (
                                <ActionIcon
                                    size="sm"
                                    color="red"
                                    variant="subtle"
                                    onClick={() => handleDelete(index)}
                                >
                                    <IconTrash size={14} />
                                </ActionIcon>
                            )}
                        </Group>
                    </List.Item>
                ))}
            </List>
            
            {isEditable && (
                <Button
                    leftSection={<IconPlus size={16} />}
                    variant="outline"
                    size="sm"
                    mt="md"
                    onClick={handleAdd}
                >
                    {labelAdd}
                </Button>
            )}
        </Box>
    );
};

export default SortableListStyle; 