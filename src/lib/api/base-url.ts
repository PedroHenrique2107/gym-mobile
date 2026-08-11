import { env } from '@/lib/config/env';

/**
 * No celular, `localhost` aponta para o próprio aparelho. Em desenvolvimento,
 * quando o Next foi aberto pelo IP da máquina, reutilizamos esse hostname para
 * alcançar o gym-service na porta configurada. Preview e produção nunca entram
 * nesta regra.
 */
export function resolveApiBaseUrl(
  configuredUrl = env.apiUrl,
  appEnvironment = env.appEnv,
  browserLocation = typeof window === 'undefined' ? undefined : window.location,
): string {
  if (appEnvironment !== 'development' || !browserLocation) return configuredUrl;

  const configured = new URL(configuredUrl);
  const configuredIsLoopback =
    configured.hostname === 'localhost' || configured.hostname === '127.0.0.1';
  const browserIsLoopback =
    browserLocation.hostname === 'localhost' || browserLocation.hostname === '127.0.0.1';

  if (!configuredIsLoopback || browserIsLoopback) return configuredUrl;

  configured.hostname = browserLocation.hostname;
  return configured.toString().replace(/\/$/, '');
}
