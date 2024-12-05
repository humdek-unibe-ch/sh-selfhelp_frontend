import { TextInput, TextInputProps } from '@mantine/core';

interface CustomTextFieldProps extends TextInputProps {
  children?: React.ReactNode;
}

const CustomTextField = ({ ...props }: CustomTextFieldProps) => (
  <TextInput
    size="md"
    styles={(theme) => ({
      input: {
        '&::placeholder': {
          color: theme.colors.gray[6],
          opacity: 0.8,
        },
        '&:disabled::placeholder': {
          color: theme.colors.gray[6],
          opacity: 1,
        },
        '&:disabled': {
          borderColor: theme.colors.gray[2],
          backgroundColor: theme.colors.gray[0],
        },
      },
    })}
    {...props}
  />
);

export default CustomTextField;
