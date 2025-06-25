import tailwindPresetMantine from "tailwind-preset-mantine";
import type { Config } from "tailwindcss";
import { breakpoints, colors } from "./src/theme";
import { ALL_CSS_CLASSES } from "./src/utils/css-safelist";

const config: Config = {
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/utils/**/*.{js,ts,jsx,tsx}",
        "./docs/**/*.{json,md}",
        "./src/**/*.{json}",
    ],
    safelist: [
        // Import all classes from our comprehensive safelist
        ...ALL_CSS_CLASSES,
        
        // Add any additional dynamic classes that might be generated
        {
            pattern: /^(bg|text|border)-(red|green|blue|yellow|gray|indigo|purple|pink)-(50|100|200|300|400|500|600|700|800|900)$/,
            variants: ['hover', 'focus'],
        },
        {
            pattern: /^(p|m|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-(0|1|2|3|4|5|6|8|10|12|16|20|24)$/,
            variants: ['sm', 'md', 'lg', 'xl'],
        },
        {
            pattern: /^(w|h)-(1|2|3|4|5|6|8|10|12|16|20|24|32|40|48|56|64|72|80|96)$/,
            variants: ['sm', 'md', 'lg', 'xl'],
        },
        {
            pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl)$/,
            variants: ['sm', 'md', 'lg', 'xl'],
        },
        {
            pattern: /^rounded(-t|-r|-b|-l)?(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?$/,
        },
        {
            pattern: /^grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12)$/,
            variants: ['sm', 'md', 'lg', 'xl'],
        },
        {
            pattern: /^gap-(0|1|2|3|4|5|6|8|10|12|16|20|24)$/,
        },
    ],
    presets: [
        tailwindPresetMantine({
            mantineBreakpoints: breakpoints,
            mantineColors: colors,
        }),
    ],
    plugins: [],
};
export default config;