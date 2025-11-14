import React from 'react';
import { TextInput } from '@mantine/core';
import type { ValueEditorProps } from 'react-querybuilder';

/**
 * Custom creatable select value editor for dynamic field names
 */
export const CreatableFieldNameEditor: React.FC<ValueEditorProps> = (props) => {
    const { value, handleOnChange, fieldData } = props;

    // Simple test - just return a text input
    return (
        <div style={{ backgroundColor: 'yellow', padding: '4px' }}>
            <TextInput
                value={(value as string) || ''}
                onChange={(event) => handleOnChange(event.currentTarget.value)}
                placeholder="CUSTOM EDITOR WORKING!"
                size="xs"
            />
        </div>
    );
};
