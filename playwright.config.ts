import { defineConfig, devices } from '@playwright/test';

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

/**
 * Configuracao de E2E.
 *
 * Os viewports refletem a decisao do plano: suporte primario a 360, 390 e
 * 430 px. Testar em desktop primeiro esconderia justamente os problemas de
 * uma interface pensada para uso com uma mao.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  /**
   * Paralelismo limitado.
   *
   * O padrao do Playwright (metade dos nucleos) derrubava **todos** os testes do
   * WebKit no Windows, enquanto os mesmos testes passavam com um worker — ou
   * seja, contencao de recurso no lancamento do navegador, nao falha da
   * aplicacao. Tres workers mantem a suite rapida e estavel; aumentar este
   * numero exige verificar o WebKit especificamente, porque ele e o que quebra
   * primeiro.
   */
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  projects: [
    {
      name: 'android-390',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'ios-390',
      use: { ...devices['iPhone 13'] },
    },
    {
      // Menor largura suportada: onde alvos de toque e textos longos quebram.
      name: 'small-360',
      use: {
        ...devices['Galaxy S9+'],
        viewport: { width: 360, height: 740 },
      },
    },
  ],

  webServer: {
    // `build` + `start` em vez de `dev`: o E2E precisa validar o que vai ao ar.
    command: 'npm run build && npm run start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
