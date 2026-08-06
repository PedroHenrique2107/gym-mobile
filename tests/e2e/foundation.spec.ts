import { expect, test } from '@playwright/test';

/**
 * Verifica os critérios de saida da fase M1.
 *
 * Roda contra o build de producao, e nao contra o servidor de desenvolvimento:
 * o objetivo e validar o que vai ao ar. Nada aqui depende do `gym-service`
 * estar rodando, exceto o teste que verifica o comportamento quando ele **nao**
 * esta.
 */

test.describe('Fundacao', () => {
  test('a pagina inicial carrega e declara o estado real do projeto', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'GymFlow' })).toBeVisible();
    // O plano proibe anunciar funcionalidade indisponivel.
    await expect(page.getByText('Em desenvolvimento')).toBeVisible();
  });

  test('o documento esta em pt-BR', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });

  test('o zoom do navegador nao esta bloqueado', async ({ page }) => {
    // Correcao explicita de uma limitacao do prototipo: bloquear zoom impede
    // quem precisa ampliar para ler de usar o aplicativo.
    await page.goto('/');

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');

    expect(viewport).not.toContain('user-scalable=no');
    expect(viewport).not.toContain('maximum-scale=1');
    expect(viewport).toContain('viewport-fit=cover');
  });

  test('a aplicacao nao e indexavel', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  });
});

test.describe('Navegacao', () => {
  test('as cinco areas principais sao alcancaveis', async ({ page }) => {
    await page.goto('/inicio');

    const areas = [
      { link: 'Treinar', heading: 'Treinar' },
      { link: 'Agenda', heading: 'Agenda' },
      { link: 'Progresso', heading: 'Progresso' },
      { link: 'Perfil', heading: 'Perfil' },
      { link: 'Inicio', heading: 'Inicio' },
    ];

    for (const area of areas) {
      await page
        .getByRole('navigation', { name: 'Navegacao principal' })
        .getByRole('link', { name: area.link })
        .click();
      await expect(page.getByRole('heading', { level: 1, name: area.heading })).toBeVisible();
    }
  });

  test('cada alvo da navegacao tem no minimo 44 px', async ({ page }) => {
    await page.goto('/inicio');

    const links = page.getByRole('navigation', { name: 'Navegacao principal' }).getByRole('link');
    const count = await links.count();

    expect(count).toBe(5);

    for (let index = 0; index < count; index += 1) {
      const box = await links.nth(index).boundingBox();
      expect(box, `item ${index} deveria ter caixa`).not.toBeNull();
      expect(box?.height ?? 0, `altura do item ${index}`).toBeGreaterThanOrEqual(44);
    }
  });

  test('nenhuma tela exibe dado de treino inventado', async ({ page }) => {
    // A regra e explicita: nada de dado simulado para dar aparencia de pronto.
    for (const path of ['/inicio', '/treinar', '/agenda', '/progresso', '/perfil']) {
      await page.goto(path);
      await expect(page.getByText(/ainda nao foi implementado/i)).toBeVisible();
    }
  });

  test('a pagina nao rola horizontalmente na menor largura suportada', async ({ page }) => {
    await page.goto('/inicio');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(overflow).toBe(false);
  });
});

test.describe('Erros', () => {
  test('endereco inexistente mostra pagina de nao encontrado', async ({ page }) => {
    const response = await page.goto('/rota-que-nao-existe');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Pagina nao encontrada')).toBeVisible();
  });
});

test.describe('Cabecalhos de seguranca', () => {
  test('a resposta traz os cabecalhos configurados', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() ?? {};

    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
    // O header revelaria a stack sem beneficio.
    expect(headers['x-powered-by']).toBeUndefined();
  });
});

test.describe('Status da API', () => {
  test('informa a falha de verdade quando a API nao responde', async ({ page }) => {
    // Sem simulacao de sucesso: se o gym-service nao estiver no ar, a tela deve
    // dizer isso, e nao mostrar um estado "online" de mentira.
    await page.route('**/health', (route) => route.abort('connectionrefused'));
    await page.route('**/ready', (route) => route.abort('connectionrefused'));

    await page.goto('/status');

    await expect(page.getByText('A API nao respondeu')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible();
  });

  test('mostra versao e dependencias quando a API responde', async ({ page }) => {
    await page.route('**/health', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', version: '0.0.0', uptimeSeconds: 120 }),
      }),
    );
    await page.route('**/ready', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'degraded',
          checks: [{ name: 'database', status: 'unconfigured', detail: 'Nao configurada.' }],
        }),
      }),
    );

    await page.goto('/status');

    await expect(page.getByText('Respondendo')).toBeVisible();
    await expect(page.getByText('0.0.0')).toBeVisible();
    await expect(page.getByText('database', { exact: true })).toBeVisible();
    // `exact` importa: "Nao configurada" tambem aparece no detalhe da
    // dependencia e no texto explicativo do rodape do card.
    await expect(page.getByText('Nao configurada', { exact: true })).toBeVisible();
  });
});
