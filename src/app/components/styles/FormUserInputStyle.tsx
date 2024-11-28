import React from 'react';
import { Button } from '@mui/material';
import { IFormUserInputLogStyle } from '@/types/api/styles.types';
import BasicStyle from './BasicStyle';
import { PageService } from '@/services/api.service';
import { pageService } from '@/services/page.service';

interface FormUserInputLogStyleProps {
    style: IFormUserInputLogStyle;
}

const FormUserInputLogStyle: React.FC<FormUserInputLogStyleProps> = ({ style }) => {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const formDataObject = Object.fromEntries(formData.entries());
        const keyword = pageService.getKeyword();

        try {
            PageService.updatePageContent(keyword, formDataObject).then((response) => {
                console.log('Response:', response);
                if (response.error) {
                    alert(response.error);
                }
            });
        } catch (error) {
            console.error('Error:', error);
            // if (style.alert_error?.content) {
            //     alert(style.alert_error.content);
            // }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
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