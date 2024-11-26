import React from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import { IFormUserInputLogStyle } from '@/types/api/styles.types';

interface FormUserInputLogStyleProps {
    style: IFormUserInputLogStyle;
}

const FormUserInputLogStyle: React.FC<FormUserInputLogStyleProps> = ({ style }) => {
    const initialValues = style.children.reduce((acc, child) => ({
        ...acc,
        [child.name.content]: child.value.content || ''
    }), {});

    const handleSubmit = (values: any) => {
        console.log('Form submitted:', values);
        // Handle form submission logic here
    };

    return (
        <Box className={style.css}>
            <Formik
                initialValues={initialValues}
                onSubmit={handleSubmit}
            >
                {({ isSubmitting }) => (
                    <Form>
                        {style.children.map((child) => (
                            <Box key={child.id.content} sx={{ mb: 2 }}>
                                <Field
                                    name={child.name.content}
                                    as={TextField}
                                    label={child.label.content}
                                    fullWidth
                                    required={child.is_required.content === '1'}
                                    placeholder={child.placeholder.content}
                                    multiline={child.style_name === 'textarea'}
                                    rows={child.style_name === 'textarea' ? 4 : 1}
                                    inputProps={{
                                        minLength: parseInt(child.min.content),
                                        maxLength: parseInt(child.max.content)
                                    }}
                                />
                            </Box>
                        ))}
                        
                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button
                                type="submit"
                                variant="contained"
                                color="primary"
                                disabled={isSubmitting}
                            >
                                {style.label.content}
                            </Button>
                            {style.label_cancel.content && (
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    href={style.url_cancel.content}
                                >
                                    {style.label_cancel.content}
                                </Button>
                            )}
                        </Box>
                    </Form>
                )}
            </Formik>
        </Box>
    );
};

export default FormUserInputLogStyle;