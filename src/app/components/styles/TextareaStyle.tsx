import React from 'react';
import { Textarea } from '@mantine/core';
import { ITextareaStyle } from '../../../types/common/styles.types';

interface TextareaStyleProps {
    style: ITextareaStyle;
}

const TextareaStyle: React.FC<TextareaStyleProps> = ({ style }) => {
    return (
        <Textarea
            name={style.name?.content || ''}
            label={style.label?.content || ''}
            required={style.is_required?.content === '1'}
            placeholder={style.placeholder?.content || ''}
            rows={4}
            defaultValue={style.value?.content || ''}
            className={style.css || ''}
            disabled={style.locked_after_submit?.content === '1'}
            minLength={style.min?.content ? parseInt(style.min.content) : undefined}
            maxLength={style.max?.content ? parseInt(style.max.content) : undefined}
        />
    );
};

export default TextareaStyle;