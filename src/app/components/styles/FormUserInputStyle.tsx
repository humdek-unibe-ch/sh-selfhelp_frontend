import React from 'react';
import { Form } from 'formik';
import { IFormUserInputLogStyle } from '@/types/api/styles.types';
import BasicStyle from './BasicStyle';

interface FormUserInputLogStyleProps {
    style: IFormUserInputLogStyle;
}

const FormUserInputLogStyle: React.FC<FormUserInputLogStyleProps> = ({ style }) => {

    return (
        <form>
            <div className={style.css}>
                {style.children?.map((child, index) => (
                    child ? <BasicStyle key={index} style={child} /> : null
                ))}
            </div>
        </form>
    );
};

export default FormUserInputLogStyle;