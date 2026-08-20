import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Verifica os critérios de saida da fase M1.
 *
 * Roda contra o build de producao, e nao contra o servidor de desenvolvimento:
 * o objetivo e validar o que vai ao ar. Nada aqui depende do `gym-service`
 * estar rodando, exceto o teste que verifica o comportamento quando ele **nao**
 * esta.
 */

test.describe('Fundacao', () => {
  test('a landing carrega e apresenta capacidades reais do aplicativo', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'GymFlow' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Tudo que acompanha o seu treino' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Entrar no aplicativo' }).first()).toBeVisible();
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

  test('somente a landing declara indexacao', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /^index, follow/);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    if (!canonical) throw new Error('A landing não publicou uma URL canônica.');
    expect(new URL(canonical).toString()).toBe('https://gym-mobile-five.vercel.app/');

    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /inicio');

    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain('<loc>https://gym-mobile-five.vercel.app/</loc>');
    expect(sitemap).not.toContain('/inicio');
  });
});

test.describe('Protecao de rotas', () => {
  test('rota privada redireciona para o login', async ({ page }) => {
    // A divida da fase M1 fechada: antes estas rotas eram publicas. O
    // redirecionamento acontece no middleware, antes de qualquer HTML ser
    // enviado — proteger no cliente deixaria o conteudo aparecer por um instante.
    await page.goto('/inicio');

    await expect(page).toHaveURL(/\/entrar/);
    await expect(page.getByRole('heading', { level: 1, name: 'Entrar' })).toBeVisible();
  });

  test('preserva o destino original', async ({ page }) => {
    // Sem isto, quem abre um link direto para uma tela interna cairia em
    // /inicio depois de entrar, perdendo o contexto do link.
    await page.goto('/progresso');

    await expect(page).toHaveURL(/destino=%2Fprogresso/);
  });

  test('todas as areas privadas exigem sessao', async ({ page }) => {
    for (const rota of ['/inicio', '/treinar', '/agenda', '/progresso', '/perfil']) {
      await page.goto(rota);
      await expect(page, rota).toHaveURL(/\/entrar/);
    }
  });

  test('nao vaza conteudo privado no HTML da resposta', async ({ page }) => {
    // O redirecionamento e do middleware, entao o corpo da rota protegida
    // nunca chega ao navegador.
    const response = await page.goto('/perfil');
    const corpo = (await response?.text()) ?? '';

    expect(corpo).not.toContain('Seus dados, objetivo e preferencias');
  });
});

test.describe('Telas de autenticacao', () => {
  test('convite Jam captura o fragmento antes do login sem expor o código', async ({ page }) => {
    const inviteCode = 'abcDEF_1234567890';
    const response = await page.goto(`/jam/entrar#codigo=${inviteCode}`);

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Participar de uma Workout Jam' }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/jam\/entrar$/);
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('gymflow:jam-invite-code')))
      .toBe(inviteCode);

    const loginHref = await page
      .getByRole('link', { name: 'Entrar e revisar convite' })
      .getAttribute('href');
    expect(loginHref).toContain('destino=%2Fjam%2Fentrar');
    expect(loginHref).not.toContain(inviteCode);
  });

  test('login exibe os campos esperados', async ({ page }) => {
    await page.goto('/entrar');

    await expect(page.getByLabel('E-mail')).toBeVisible();
    await expect(page.getByLabel('Senha')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toBeVisible();
  });

  test('valida o e-mail antes de enviar', async ({ page }) => {
    await page.goto('/entrar');

    await page.getByLabel('E-mail').fill('nao-e-email');
    await page.getByLabel('Senha').fill('qualquercoisa');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByText('Informe um e-mail válido.')).toBeVisible();
  });

  test('recuperacao de senha e alcancavel', async ({ page }) => {
    await page.goto('/entrar');
    const recoveryLink = page.getByRole('link', { name: 'Esqueci minha senha' });
    await expect(recoveryLink).toHaveAttribute('href', '/recuperar-senha');

    // Sincroniza explicitamente o clique e a transição. Assim o teste continua
    // exercitando o toque real do Safari sem disputar a asserção do H1 com a
    // navegação assíncrona do Next.
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/recuperar-senha', { timeout: 10_000 }),
      recoveryLink.click(),
    ]);

    await expect(page.getByRole('heading', { level: 1, name: 'Recuperar senha' })).toBeVisible();
  });

  test('convite existe e nao cai em 404', async ({ page }) => {
    // Ate a fase M2 esta rota nao existia, e o link do e-mail caia em uma
    // pagina de nao encontrado.
    const response = await page.goto('/convite');

    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('campos de senha usam o tipo correto', async ({ page }) => {
    await page.goto('/entrar');
    await expect(page.getByLabel('Senha')).toHaveAttribute('type', 'password');
  });

  test('alvos de toque das telas de autenticacao respeitam o minimo', async ({ page }) => {
    await page.goto('/entrar');

    for (const nome of ['E-mail', 'Senha']) {
      const caixa = await page.getByLabel(nome).boundingBox();
      expect(caixa?.height ?? 0, nome).toBeGreaterThanOrEqual(44);
    }

    const botao = await page.getByRole('button', { name: 'Entrar' }).boundingBox();
    expect(botao?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test('a pagina nao rola horizontalmente na menor largura', async ({ page }) => {
    await page.goto('/entrar');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    expect(overflow).toBe(false);
  });
});

test.describe('Erros', () => {
  test('endereco desconhecido leva ao login quando nao ha sessao', async ({ page }) => {
    // Consequencia direta de "protegido por padrao": o middleware roda antes do
    // roteamento e nao sabe se o caminho existe, entao trata desconhecido como
    // privado. O efeito colateral e desejavel — quem nao esta autenticado nao
    // descobre quais rotas existem testando URLs.
    await page.goto('/rota-que-nao-existe');

    await expect(page).toHaveURL(/\/entrar/);
  });

  test('pagina de nao encontrado existe e e alcancavel', async ({ page }) => {
    // Sob um caminho publico, o 404 real aparece.
    const response = await page.goto('/status/caminho-inexistente');

    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeVisible();
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
    expect(headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains');
    // O header revelaria a stack sem beneficio.
    expect(headers['x-powered-by']).toBeUndefined();
  });
});

test.describe('Acessibilidade automatizada', () => {
  for (const [route, heading] of [
    ['/', 'GymFlow'],
    ['/entrar', 'Entrar'],
    ['/offline', 'Você está offline'],
  ] as const) {
    test(`${route} nao possui violacoes WCAG A ou AA detectaveis`, async ({ page }) => {
      // Um gate automatizado nao substitui leitor de tela nem aparelho real,
      // mas impede que regressões objetivas cheguem ao preview sem sinalizacao.
      await page.goto(route);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(results.violations).toEqual([]);
    });
  }
});

test.describe('PWA', () => {
  test('publica manifesto e icones instalaveis', async ({ request }) => {
    // Evita um deploy que parece PWA, mas nao pode ser instalado por falta de metadados ou icones.
    const response = await request.get('/manifest.webmanifest');
    expect(response.ok()).toBe(true);
    const manifest = (await response.json()) as {
      name: string;
      display: string;
      start_url: string;
      icons: { src: string; sizes: string }[];
    };

    expect(manifest).toMatchObject({
      name: 'GymFlow',
      display: 'standalone',
      start_url: '/inicio',
    });
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).ok(), icon.src).toBe(true);
    }
  });

  test('registra o service worker e mantem a tela offline disponivel', async ({
    page,
    context,
    browserName,
  }) => {
    // Evita que a instalacao seja entregue sem worker ativo ou sem uma resposta util ao perder a rede.
    await page.goto('/offline');
    await page.evaluate(async () => navigator.serviceWorker.ready);
    await page.reload();

    await expect
      .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
      .toBe(true);
    await expect
      .poll(() =>
        page.evaluate(async () => Boolean(await caches.match('/offline', { ignoreSearch: true }))),
      )
      .toBe(true);

    // O WebKit do Playwright no Windows encerra a navegacao com erro interno
    // quando o contexto fica offline, mesmo quando o worker devolve a pagina.
    // O cache e o controle do worker continuam verificados acima; os dois
    // projetos Chromium exercitam a navegacao offline completa abaixo.
    if (browserName === 'webkit') return;

    await context.setOffline(true);

    try {
      await page.reload();
      await expect(
        page.getByRole('heading', { level: 1, name: 'Você está offline' }),
      ).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });

  test('nao inclui respostas da API no cache de runtime', async ({ request }) => {
    // Evita que dados privados de um usuario sobrevivam no Cache Storage apos logout ou troca de conta.
    const response = await request.get('/sw.js');
    expect(response.ok()).toBe(true);
    const worker = await response.text();

    expect(worker).toContain('gymflow-static-v1');
    expect(worker).toContain('/offline');
    expect(worker).not.toContain('gymflow-api');
  });
});

test.describe('Status da API', () => {
  test('informa a falha de verdade quando a API nao responde', async ({ page }) => {
    // Sem simulacao de sucesso: se o gym-service nao estiver no ar, a tela deve
    // dizer isso, e nao mostrar um estado "online" de mentira.
    await page.route('**/health', (route) => route.abort('connectionrefused'));
    await page.route('**/ready', (route) => route.abort('connectionrefused'));

    await page.goto('/status');

    await expect(page.getByText('A API não respondeu')).toBeVisible();
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
    // `exact` importa: "Não configurada" tambem aparece no detalhe da
    // dependencia e no texto explicativo do rodape do card.
    await expect(page.getByText('Não configurada', { exact: true })).toBeVisible();
  });
});
