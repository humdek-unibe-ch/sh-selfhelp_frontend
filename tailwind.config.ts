import tailwindPresetMantine from "tailwind-preset-mantine";
import type { Config } from "tailwindcss";
import { breakpoints, colors } from "./src/theme";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
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