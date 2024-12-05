import { MantineThemeOverride, MantineTheme, createTheme } from '@mantine/core';

const components: MantineThemeOverride = {
  primaryColor: 'blue',
  primaryShade: { light: 6, dark: 8 },
  defaultRadius: 'md',
  fontFamily: 'Inter, sans-serif',
  radius: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '32px',
  },
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 1px 3px rgba(0, 0, 0, 0.15)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.15)',
    xl: '0 12px 24px rgba(0, 0, 0, 0.15)',
  },
  other: {
    transition: {
      default: 'all 0.2s ease',
    },
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    Card: {
      styles: {
        root: {
          width: '100%',
          padding: '15px',
        },
      },
    },
    Paper: {
      styles: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    Alert: {
      styles: {
        root: {
          borderRadius: 'var(--mantine-radius-md)',
        },
        message: {
          lineHeight: 1.5,
        },
      },
    },
    TextInput: {
      styles: {
        input: {
          padding: '12px 14px',
          '&:focus': {
            borderColor: 'var(--mantine-color-primary-6)',
          },
        },
      },
    },
  },
};

export const globalCss = {
  '.global-styles': {
    '*': {
      boxSizing: 'border-box',
    },
    html: {
      height: '100%',
      width: '100%',
    },
    body: {
      height: '100%',
      margin: 0,
      padding: 0,
    },
    '#root': {
      height: '100%',
    },
    a: {
      textDecoration: 'none',
      color: 'var(--mantine-color-primary-6)',
    },
    '.border-none': {
      border: '0px',
      td: {
        border: '0px',
      },
    },
    '.btn-xs': {
      minWidth: '30px !important',
      width: '30px',
      height: '30px',
      borderRadius: '6px !important',
      padding: '0px !important',
    },
    '.hoverCard:hover': {
      transform: 'scale(1.01)',
      transition: '0.1s ease-in',
    },
  }
};

export default components;
