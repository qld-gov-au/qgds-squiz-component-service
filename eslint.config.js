import eslintRecommended from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
    eslintRecommended.configs.recommended,
    {
        files: ['dxp/component-service/**/*.js', 'src/scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        settings: {
            'import/resolver': {
                alias: {
                    map: [
                        ['@global_components', './src/global_components'],
                        ['@dxp', './dxp'],
                        ['@components', './dxp/component-service'],
                        ['@styles', './src/styles'],
                    ],
                    extensions: ['.js', '.scss'],
                },
            },
        },
        plugins: {
            import: importPlugin,
        },
        rules: {
            'no-console': 'off',
            'no-unused-vars': 'warn',
            semi: ['warn', 'always'],
            'import/no-unresolved': 'warn',
            'no-multiple-empty-lines': ['warn', {max: 1}],
        },
    },
    ...tseslint.configs.recommended.map((config) => ({...config, files: ['dxp/component-service/**/*.ts', 'dxp/utils/**/*.ts']})),
    {
        files: ['dxp/component-service/**/*.ts', 'dxp/utils/**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        rules: {
            'no-console': 'off',
            semi: ['warn', 'always'],
            'no-multiple-empty-lines': ['warn', {max: 1}],
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    },
    {
        ignores: ['node_modules/', 'dist/', '**/*.test.js', '**/*.test.ts', 'vite.config.js', '*.js', 'dxp/01_compilers/*.js', 'src/entry-server.js'],
    },
];
