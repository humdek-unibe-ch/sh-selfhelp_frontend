import { Text } from '@mantine/core';
import { ComponentPropsWithoutRef } from 'react';

interface CustomFormLabelProps extends ComponentPropsWithoutRef<'label'> {
  children: React.ReactNode;
}

const CustomFormLabel = ({ children, ...props }: CustomFormLabelProps) => (
  <Text
    component="label"
    size="sm"
    fw={500}
    style={{
      marginBottom: '5px',
      marginTop: '25px',
      display: 'block',
    }}
    {...props}
  >
    {children}
  </Text>
);

export default CustomFormLabel;
