import { describe, expect, it } from 'vitest';

import { AFTER_LOGIN_ROUTE, isAuthFlowRoute, isPublicRoute, safeRedirectTarget } from './routes';

describe('isPublicRoute', () => {
  it('reconhece as rotas publicas', () => {
    for (const rota of [
      '/',
      '/entrar',
      '/convite',
      '/recuperar-senha',
      '/redefinir-senha',
      '/status',
    ]) {
      expect(isPublicRoute(rota), rota).toBe(true);
    }
  });

  it('trata rotas nao listadas como protegidas', () => {
    // A lista é de públicas, e não de protegidas, de propósito: esquecer de
    // classificar uma rota nova a torna inacessível — o que aparece no primeiro
    // teste — em vez de deixá-la aberta em silêncio.
    for (const rota of ['/inicio', '/treinar', '/agenda', '/progresso', '/perfil', '/rota-nova']) {
      expect(isPublicRoute(rota), rota).toBe(false);
    }
  });

  it('cobre subcaminhos de rota publica', () => {
    expect(isPublicRoute('/status/detalhes')).toBe(true);
  });

  it('nao confunde prefixo parcial com rota publica', () => {
    // `/entrarei` não é `/entrar`. Um `startsWith` ingênuo liberaria.
    expect(isPublicRoute('/entrarei')).toBe(false);
    expect(isPublicRoute('/conviteX')).toBe(false);
  });
});

describe('isAuthFlowRoute', () => {
  it('reconhece as rotas onde uma sessao existente nao deve redirecionar', () => {
    // Quem chega em `/redefinir-senha` tem sessão de recuperação válida e
    // precisa concluir a troca. Mandá-lo para `/inicio` interromperia o fluxo.
    expect(isAuthFlowRoute('/convite')).toBe(true);
    expect(isAuthFlowRoute('/redefinir-senha')).toBe(true);
    expect(isAuthFlowRoute('/entrar')).toBe(false);
  });
});

describe('safeRedirectTarget', () => {
  it('aceita caminho interno', () => {
    expect(safeRedirectTarget('/progresso')).toBe('/progresso');
    expect(safeRedirectTarget('/treinos/abc?aba=series')).toBe('/treinos/abc?aba=series');
  });

  it('aceita caminho codificado', () => {
    expect(safeRedirectTarget('%2Fprogresso')).toBe('/progresso');
  });

  describe('protecao contra open redirect', () => {
    it('recusa URL absoluta', () => {
      // Sem esta checagem, `?destino=https://atacante.com` levaria o usuário
      // recém-autenticado para fora do domínio — técnica usada para dar
      // aparência legítima a páginas de phishing.
      expect(safeRedirectTarget('https://atacante.example.com')).toBe(AFTER_LOGIN_ROUTE);
      expect(safeRedirectTarget('http://atacante.example.com')).toBe(AFTER_LOGIN_ROUTE);
    });

    it('recusa URL protocol-relative', () => {
      // O navegador interpreta `//host` como URL completa, herdando o esquema.
      expect(safeRedirectTarget('//atacante.example.com')).toBe(AFTER_LOGIN_ROUTE);
      expect(safeRedirectTarget('%2F%2Fatacante.example.com')).toBe(AFTER_LOGIN_ROUTE);
    });

    it('recusa barra invertida', () => {
      // Alguns navegadores normalizam `\` para `/`, o que faria `/\atacante.com`
      // virar `//atacante.com`.
      expect(safeRedirectTarget('/\\atacante.example.com')).toBe(AFTER_LOGIN_ROUTE);
      expect(safeRedirectTarget('\\\\atacante.example.com')).toBe(AFTER_LOGIN_ROUTE);
    });

    it('recusa esquema javascript', () => {
      expect(safeRedirectTarget('javascript:alert(1)')).toBe(AFTER_LOGIN_ROUTE);
    });

    it('recusa sequencia percentual malformada', () => {
      // `decodeURIComponent` lança nesse caso; tratar como destino inválido é
      // mais seguro que tentar adivinhar a intenção.
      expect(safeRedirectTarget('%E0%A4%A')).toBe(AFTER_LOGIN_ROUTE);
    });
  });

  it('recusa rota publica como destino', () => {
    // Voltar ao login logo após entrar seria um laço para o usuário.
    expect(safeRedirectTarget('/entrar')).toBe(AFTER_LOGIN_ROUTE);
    expect(safeRedirectTarget('/')).toBe(AFTER_LOGIN_ROUTE);
  });

  it('usa o padrao quando nao ha destino', () => {
    expect(safeRedirectTarget(null)).toBe(AFTER_LOGIN_ROUTE);
    expect(safeRedirectTarget(undefined)).toBe(AFTER_LOGIN_ROUTE);
    expect(safeRedirectTarget('')).toBe(AFTER_LOGIN_ROUTE);
  });
});
