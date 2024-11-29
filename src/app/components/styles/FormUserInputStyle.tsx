import React, { useState } from 'react';
import { Button } from '@mui/material';
import { IFormUserInputLogStyle } from '@/types/api/styles.types';
import BasicStyle from './BasicStyle';
import { PageService } from '@/services/page.service';
import { usePageContentContext } from '@/contexts/PageContentContext';

interface FormUserInputLogStyleProps {
    style: IFormUserInputLogStyle;
}

const FormUserInputLogStyle: React.FC<FormUserInputLogStyleProps> = ({ style }) => {
    const { updatePageContent } = usePageContentContext();
    const [formKey, setFormKey] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const formDataObject = Object.fromEntries(formData.entries());
        const keyword = PageService.getKeyword();

        try {
            const response = await PageService.updatePageContent(keyword, formDataObject);
            console.log('Response:', response);
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
            <input type="hidden" name="__id_sections" value={style.id.content} />
            <div className={style.css}>
                {style.children?.map((child, index) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
                <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                    {style.label.content}
                </Button>
            </div>
        </form>
    );
};

export default FormUserInputLogStyle;