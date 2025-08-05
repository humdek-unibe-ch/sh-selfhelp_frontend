import type { Config } from "tailwindcss";
import { breakpoints, colors } from "./src/theme";

const config: Config = {
    darkMode: 'class',
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/utils/**/*.{js,ts,jsx,tsx}",
        "./docs/**/*.{json,md}",
        "./src/**/*.{json}",
    ],
    theme: {
        extend: {
            // Mantine breakpoints integration
            screens: {
                'xs': breakpoints.xs,
                'sm': breakpoints.sm,
                'md': breakpoints.md,
                'lg': breakpoints.lg,
                'xl': breakpoints.xl,
            },
            // Mantine colors integration
            colors: {
                // Map Mantine colors to Tailwind format
                ...Object.entries(colors).reduce((acc, [colorName, colorShades]) => {
                    if (Array.isArray(colorShades)) {
                        acc[colorName] = {
                            50: colorShades[0],
                            100: colorShades[1],
                            200: colorShades[2],
                            300: colorShades[3],
                            400: colorShades[4],
                            500: colorShades[5],
                            600: colorShades[6],
                            700: colorShades[7],
                            800: colorShades[8],
                            900: colorShades[9],
                        };
                    }
                    return acc;
                }, {} as Record<string, Record<string, string>>),
            },
        },
    },
    plugins: [],
};

export default config;