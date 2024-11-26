import React from 'react';
import { TextField } from '@mui/material';
import { ITextareaStyle } from '@/types/api/styles.types';

interface TextareaStyleProps {
    style: ITextareaStyle;
}

const TextareaStyle: React.FC<TextareaStyleProps> = ({ style }) => {
    return (
        <TextField
            name={style.name.content}
            label={style.label.content}
            fullWidth
            required={style.is_required.content === '1'}
            placeholder={style.placeholder.content}
            multiline
            rows={4}
            defaultValue={style.value.content}
            className={style.css}
            disabled={style.locked_after_submit?.content === '1'}
            inputProps={{
                minLength: parseInt(style.min.content),
                maxLength: parseInt(style.max.content)
            }}
        />
    );
};

export default TextareaStyle;