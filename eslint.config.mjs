// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

/**
 * As configuracoes sao escopadas por extensao de proposito.
 *
 * O `eslint-config-next` instala o proprio parser, que nao repassa
 * `parserOptions.project`. Aplicado a arquivos `.mjs`, ele faz as regras que
 * dependem de tipo — `await-thenable`, `no-floating-promises` — falharem ao
 * carregar. Restringir cada bloco ao que ele realmente cobre resolve a raiz, em
 * vez de desligar as regras.
 */
export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'out/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
      // Arquivo gerado a partir do OpenAPI do gym-service. Editar a mao
      // quebraria a garantia de que os tipos vem do contrato.
      'src/lib/api/generated/**',
    ],
  },

  eslint.configs.recommended,

  // --- TypeScript da aplicacao ---------------------------------------------
  {
    files: ['**/*.ts', '**/*.tsx'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...compat.extends('next/core-web-vitals'),
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      eqeqeq: ['error', 'always'],

      // O plano proibe JWT, e-mail, fotos, medidas e conteudo de treino em log
      // do navegador. `console.warn`/`error` seguem permitidos para falhas.
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // `dangerouslySetInnerHTML` renderizaria conteudo do usuario como HTML.
      'react/no-danger': 'error',

      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message:
            'Leia configuracao por `@/lib/config/env`, nao por process.env direto. Excecao: src/lib/config e arquivos de configuracao.',
        },
      ],

      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message: 'Use o alias `@/` em vez de subir mais de um nivel.',
            },
          ],
        },
      ],
    },
  },

  // --- Leitura de ambiente e ferramentas -----------------------------------
  {
    // A leitura e validacao do ambiente precisa de process.env por definicao.
    files: ['src/lib/config/**/*.ts', '*.config.ts', 'vitest.setup.ts'],
    rules: {
      'no-restricted-syntax': 'off',
      'no-console': 'off',
    },
  },

  // --- Testes ---------------------------------------------------------------
  {
    files: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // --- Scripts em JavaScript ------------------------------------------------
  {
    files: ['**/*.mjs', '**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', fetch: 'readonly' },
    },
    rules: {
      'no-console': 'off',
      'no-restricted-syntax': 'off',
    },
  },

  // Prettier no fim: desliga as regras de estilo que conflitariam.
  prettierRecommended,
);
