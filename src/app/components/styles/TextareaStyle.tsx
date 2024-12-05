import { Textarea } from '@mantine/core';
import { ITextareaStyle } from '@/types/api/styles.types';

interface TextareaStyleProps {
    style: ITextareaStyle;
}

const TextareaStyle = ({ style }: TextareaStyleProps) => {
    return (
        <Textarea
            name={style.name.content}
            label={style.label.content}
            placeholder={style.placeholder.content}
            required={style.is_required.content === '1'}
            disabled={style.locked_after_submit?.content === '1'}
            minLength={parseInt(style.min.content)}
            maxLength={parseInt(style.max.content)}
            defaultValue={style.value.content}
            className={style.css}
            autosize
            minRows={4}
            styles={{
                input: {
                    width: '100%'
                }
            }}
        />
    );
};

export default TextareaStyle;