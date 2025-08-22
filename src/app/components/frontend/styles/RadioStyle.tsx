import React from 'react';
import { Box, Radio, Group, Text } from '@mantine/core';
import { IRadioStyle } from '../../../../types/common/styles.types';

interface IRadioStyleProps {
    style: IRadioStyle;
}

const RadioStyle: React.FC<IRadioStyleProps> = ({ style }) => {
    const label = style.label?.content;
    const name = style.name?.content;
    const value = style.value?.content;
    const isRequired = style.is_required?.content === '1';
    const isInline = style.is_inline?.content === '1';
    const isLocked = style.locked_after_submit?.content === '1';

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

    return (
        <Box className={style.css}>
            {label && (
                <Text size="sm" fw={500} mb="xs">
                    {label}
                    {isRequired && <Text component="span" c="red"> *</Text>}
                </Text>
            )}
            <Radio.Group
                name={name}
                value={value}
                required={isRequired}
            >
                <Group mt="xs" gap={isInline ? 'md' : 'xs'} align={isInline ? 'flex-start' : 'stretch'} style={{ flexDirection: isInline ? 'row' : 'column' }}>
                    {items.map((item: any, index: number) => (
                        <Radio
                            key={index}
                            value={item.value}
                            label={item.text || item.label}
                            disabled={isLocked}
                        />
                    ))}
                </Group>
            </Radio.Group>
        </Box>
    );
};

export default RadioStyle; 