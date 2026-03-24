// @ts-check

import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default defineConfig(
    {
        ignores: [
            'dist/**',
            'build/**',
            'node_modules/**',
            '.next/**',
            'data/**',
        ],
    },

    eslint.configs.recommended,
    ...tseslint.configs.recommended,

    {
        files: ['**/*.{js,jsx,mjs,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: tseslint.parser,
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
            globals: {
                ...globals.browser,
                ...globals.es2025,
            },
        },
        plugins: {
            react,
            // @ts-expect-error - React Hooks plugin lacks valid Flat Config types
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            '@typescript-eslint': tseslint.plugin,
        },
        rules: {
            'react/jsx-no-target-blank': 'off',
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },

    // 4. Disable Type-Aware Rules for plain JS files (if you use type-aware linting)
    {
        files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
        extends: [tseslint.configs.disableTypeChecked],
    }
)
