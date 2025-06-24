import React, { useState } from 'react';
import type { ICheckboxStyle } from '../../../types/common/styles.types';
import { Box, Checkbox, Text } from '@mantine/core';

interface ICheckboxStyleProps {
    style: ICheckboxStyle;
}

const CheckboxStyle: React.FC<ICheckboxStyleProps> = ({ style }) => {
    const label = style.label?.content;
    const name = style.name?.content;
    const value = style.value?.content;
    const checkboxValue = style.checkbox_value?.content;
    const isRequired = style.is_required?.content === '1';
    
    // Convert string value to boolean for checkbox
    const initialChecked = value === checkboxValue || value === '1' || value === 'true';
    const [isChecked, setIsChecked] = useState(initialChecked);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIsChecked(event.currentTarget.checked);
    };

    return (
        <Box className={style.css}>
            <Checkbox
                name={name}
                label={label}
                checked={isChecked}
                onChange={handleChange}
                required={isRequired}
                value={checkboxValue}
            />
            {isRequired && !isChecked && (
                <Text size="xs" c="red" mt="xs">
                    This field is required
                </Text>
            )}
        </Box>
    );
};

export default CheckboxStyle; 