import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)'],
            },
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "var(--primary)",
                    hover: "var(--primary-hover)",
                },
                'thistle': 'var(--thistle)',
                'pastel-petal': 'var(--pastel-petal)',
                'baby-pink': 'var(--baby-pink)',
                'icy-blue': 'var(--icy-blue)',
                'sky-blue': 'var(--sky-blue)',
                secondary: {
                    DEFAULT: "var(--secondary)",
                    hover: "var(--secondary-hover)",
                },
                text: {
                    primary: "var(--text-primary)",
                    secondary: "var(--text-secondary)",
                }
            },
        },
    },
    plugins: [],
};
export default config;
