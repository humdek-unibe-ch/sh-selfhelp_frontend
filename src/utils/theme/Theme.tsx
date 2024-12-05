import { MantineThemeOverride, createTheme } from '@mantine/core';
import { useSelector } from '@/store/hooks';
import { AppState } from '@/store/store';
import components from './Components';

// Numeric values for component breakpoint checks (in em)
export const BREAKPOINT_VALUES = {
  xs: 0,
  sm: 36, // 576/16
  md: 48, // 768/16
  lg: 75, // 1200/16
  xl: 87.5, // 1400/16
} as const;

// Theme breakpoints in em units
export const BREAKPOINTS = {
  xs: '0',
  sm: '36em',
  md: '48em',
  lg: '75em',
  xl: '87.5em',
} as const;

// Base theme configuration
const baseTheme: MantineThemeOverride = {
  ...components,
  defaultRadius: 'md',
  fontFamily: 'Inter, sans-serif',
  headings: {
    fontFamily: 'Inter, sans-serif',
  },
  breakpoints: BREAKPOINTS,
  colors: {
    // Define your color palette here
    blue: [
      '#E7F5FF',
      '#D0EBFF',
      '#A5D8FF',
      '#74C0FC',
      '#4DABF7',
      '#339AF0',
      '#228BE6',
      '#1C7ED6',
      '#1971C2',
      '#1864AB',
    ],
    secondary: [
      '#EDF2F7',
      '#E2E8F0',
      '#CBD5E0',
      '#A0AEC0',
      '#718096',
      '#4A5568',
      '#2D3748',
      '#1A202C',
      '#171923',
      '#0A0B0E',
    ],
  },
};

// Theme builder function
export const BuildTheme = (config: { mode: 'light' | 'dark' } = { mode: 'light' }) => {
  return createTheme({
    ...baseTheme,
  });
};

// Theme settings hook
export const ThemeSettings = () => {
  const customizer = useSelector((state: AppState) => state.customizer);
  return BuildTheme({
    mode: customizer.activeMode as 'light' | 'dark',
  });
};

export { baseTheme };
