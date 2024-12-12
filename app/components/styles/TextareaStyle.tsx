import React from 'react';
import { ITextareaStyle } from '@/types/api/styles.types';
import { TextField } from '@refinedev/mantine';
import { Textarea } from '@mantine/core';

interface TextareaStyleProps {
    style: ITextareaStyle;
}

const TextareaStyle: React.FC<TextareaStyleProps> = ({ style }) => {
    return (
        <Textarea
            name={style.name.content}
            label={style.label.content}
            required={style.is_required.content === '1'}
            placeholder={style.placeholder.content}
            rows={4}
            defaultValue={style.value.content}
            className={style.css}
            disabled={style.locked_after_submit?.content === '1'}
        />
    );
};

export default TextareaStyle;