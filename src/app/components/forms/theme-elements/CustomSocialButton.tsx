import { Button, ButtonProps } from '@mantine/core';

interface CustomSocialButtonProps extends ButtonProps {
  children: React.ReactNode;
}

const CustomSocialButton = ({ children, ...props }: CustomSocialButtonProps) => (
  <Button
    variant="default"
    size="lg"
    styles={(theme) => ({
      root: {
        border: `1px solid ${theme.colors.gray[3]}`,
        '&:hover': {
          color: theme.colors.blue[6],
          backgroundColor: theme.colors.gray[0],
        },
      },
    })}
    {...props}
  >
    {children}
  </Button>
);

export default CustomSocialButton;
