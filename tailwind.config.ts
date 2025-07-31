import tailwindPresetMantine from "tailwind-preset-mantine";
import type { Config } from "tailwindcss";
import { breakpoints, colors } from "./src/theme";
import { ALL_CSS_CLASSES } from "./src/utils/css-safelist";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/utils/**/*.{js,ts,jsx,tsx}",
        "./docs/**/*.{json,md}",
        "./src/**/*.{json}",
    ],
    safelist: [
        // Static classes from our comprehensive safelist
        ...ALL_CSS_CLASSES,
        
        // Dynamic patterns for user customization
        // Colors - All color variants with states
        {
            pattern: /^(bg|text|border)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
            variants: ['hover', 'focus', 'active', 'dark', 'dark:hover', 'dark:focus'],
        },
        
        // Spacing - Comprehensive spacing system
        {
            pattern: /^(p|m|px|py|pl|pr|pt|pb|mx|my|ml|mr|mt|mb)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96)$/,
            variants: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        
        // Sizing - Width and height with responsive variants
        {
            pattern: /^(w|h|min-w|min-h|max-w|max-h)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full|screen|min|max|fit)$/,
            variants: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        
        // Fractional sizing
        {
            pattern: /^(w|h)-(1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12)$/,
            variants: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        
        // Typography - Font sizes and weights
        {
            pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
            variants: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        {
            pattern: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
        },
        
        // Border radius - All variants
        {
            pattern: /^rounded(-t|-r|-b|-l|-tl|-tr|-br|-bl)?(-none|-sm|-md|-lg|-xl|-2xl|-3xl|-full)?$/,
        },
        
        // Grid system - Comprehensive grid support
        {
            pattern: /^grid-cols-(1|2|3|4|5|6|7|8|9|10|11|12|none)$/,
            variants: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        {
            pattern: /^col-(auto|span-1|span-2|span-3|span-4|span-5|span-6|span-7|span-8|span-9|span-10|span-11|span-12|span-full|start-1|start-2|start-3|start-4|start-5|start-6|start-7|start-8|start-9|start-10|start-11|start-12|start-13|start-auto|end-1|end-2|end-3|end-4|end-5|end-6|end-7|end-8|end-9|end-10|end-11|end-12|end-13|end-auto)$/,
            variants: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        
        // Gap spacing
        {
            pattern: /^gap-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|x-0|x-0\.5|x-1|x-1\.5|x-2|x-2\.5|x-3|x-3\.5|x-4|x-5|x-6|x-7|x-8|x-9|x-10|x-11|x-12|x-14|x-16|x-20|x-24|x-28|x-32|x-36|x-40|x-44|x-48|x-52|x-56|x-60|x-64|x-72|x-80|x-96|y-0|y-0\.5|y-1|y-1\.5|y-2|y-2\.5|y-3|y-3\.5|y-4|y-5|y-6|y-7|y-8|y-9|y-10|y-11|y-12|y-14|y-16|y-20|y-24|y-28|y-32|y-36|y-40|y-44|y-48|y-52|y-56|y-60|y-64|y-72|y-80|y-96)$/,
            variants: ['sm', 'md', 'lg', 'xl', '2xl'],
        },
        
        // Shadows and effects
        {
            pattern: /^shadow-(none|sm|md|lg|xl|2xl|inner)$/,
            variants: ['hover', 'focus', 'dark', 'dark:hover'],
        },
        
        // Opacity and transforms
        {
            pattern: /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)$/,
            variants: ['hover', 'focus', 'group-hover'],
        },
        {
            pattern: /^scale-(0|50|75|90|95|100|105|110|125|150)$/,
            variants: ['hover', 'focus', 'group-hover'],
        },
        
        // Position and z-index
        {
            pattern: /^(top|right|bottom|left|inset)-(0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|auto|full)$/,
        },
        {
            pattern: /^z-(0|10|20|30|40|50|auto)$/,
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