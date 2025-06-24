import React, { useState } from 'react';
import { IFormUserInputLogStyle } from '../../../types/common/styles.types';
import BasicStyle from './BasicStyle';
import { PageApi } from '../../../api/page.api';
import { Button } from '@mantine/core';
import { useResource } from '@refinedev/core';
import { usePageContentContext } from '../../contexts/PageContentContext';

interface FormUserInputStyleProps {
    style: IFormUserInputLogStyle;
}

const FormUserInputStyle: React.FC<FormUserInputStyleProps> = ({ style }) => {
    const { updatePageContent } = usePageContentContext();
    const [formKey, setFormKey] = useState(0);
    const { resource } = useResource();
    const keyword = resource?.name || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const formDataObject = Object.fromEntries(formData.entries());

        try {
            const response = await PageApi.updatePageContent(keyword, formDataObject);
            if (response.error) {
                alert(response.error);
            } else {
                // Update the React Query cache with the new content
                updatePageContent(keyword, response.data);
                // Force form re-render
                setFormKey(prev => prev + 1);
                
                if (style.alert_success?.content) {
                    // alert(style.alert_success.content);
                    // if (style.redirect_at_end?.content) {
                    //     window.location.href = style.redirect_at_end.content;
                    // }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            // if (style.alert_error?.content) {
            //     alert(style.alert_error.content);
            // }
        }
    };

    return (
        <form key={formKey} onSubmit={handleSubmit}>
            {style.id?.content && (
                <input type="hidden" name="__id_sections" value={style.id.content} />
            )}
            <div className={style.css || ''}>
                {style.children?.map((child, index) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
                <Button type="submit" variant="contained" style={{ mt: 2 }}>
                    {style.label?.content || 'Submit'}
                </Button>
            </div>
        </form>
    );
};

export default FormUserInputStyle;