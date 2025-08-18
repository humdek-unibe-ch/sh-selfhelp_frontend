import React from 'react';
import type { IAccordionListStyle } from '../../../types/common/styles.types';
import { Box, Accordion, Text } from '@mantine/core';

interface IAccordionListStyleProps {
    style: IAccordionListStyle;
}

const AccordionListStyle: React.FC<IAccordionListStyleProps> = ({ style }) => {
    const titlePrefix = style.title_prefix?.content || '';
    const labelRoot = style.label_root?.content || 'Root';
    const idPrefix = style.id_prefix?.content || 'accordion';
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

    // Convert items to accordion format
    const accordionItems = items.map((item: any, index: number) => ({
        value: `${idPrefix}-${index}`,
        title: `${titlePrefix}${item.title || item.text || item.label || `Item ${index + 1}`}`,
        content: item.content || item.description || item.text || ''
    }));

    return (
        <Box className={style.css}>
            <Accordion 
                defaultValue={idActive ? `${idPrefix}-${idActive}` : accordionItems[0]?.value}
                variant="separated"
                radius="md"
            >
                {accordionItems.map((item) => (
                    <Accordion.Item key={item.value} value={item.value}>
                        <Accordion.Control>
                            <Text fw={500}>{item.title}</Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Text size="sm">{item.content}</Text>
                        </Accordion.Panel>
                    </Accordion.Item>
                ))}
            </Accordion>
        </Box>
    );
};

export default AccordionListStyle; 