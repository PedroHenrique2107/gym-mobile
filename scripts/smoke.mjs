const baseUrlInput = process.argv[2] ?? process.env.SMOKE_BASE_URL;

if (!baseUrlInput) {
  fail('Informe a URL: npm run smoke -- https://preview.example.com');
}

/** @type {URL} */
let baseUrl;

try {
  baseUrl = new URL(baseUrlInput);
} catch {
  fail('SMOKE_BASE_URL precisa ser uma URL valida.');
}

if (!['http:', 'https:'].includes(baseUrl.protocol)) {
  fail('SMOKE_BASE_URL precisa usar http ou https.');
}

baseUrl.pathname = '/';
baseUrl.search = '';
baseUrl.hash = '';

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const commonHeaders = bypassSecret ? { 'x-vercel-protection-bypass': bypassSecret } : {};

const home = await request('/');
assert(home.status === 200, `/ respondeu ${home.status}`);
assert(home.headers.get('x-content-type-options') === 'nosniff', 'nosniff ausente');
assert(home.headers.get('x-frame-options') === 'DENY', 'protecao contra iframe ausente');
assert(
  home.headers.get('referrer-policy') === 'strict-origin-when-cross-origin',
  'Referrer-Policy inesperada',
);
assert(home.headers.get('x-powered-by') === null, 'a resposta revelou a stack');

if (baseUrl.protocol === 'https:') {
  assert(
    home.headers.get('strict-transport-security')?.includes('max-age=63072000'),
    'HSTS ausente no deploy HTTPS',
  );
}

for (const path of ['/entrar', '/offline']) {
  const response = await request(path);
  assert(response.status === 200, `${path} respondeu ${response.status}`);
}

const manifestResponse = await request('/manifest.webmanifest', 'application/manifest+json');
assert(
  manifestResponse.status === 200,
  `/manifest.webmanifest respondeu ${manifestResponse.status}`,
);
const manifest = await manifestResponse.json().catch(() => null);
assert(manifest?.name === 'GymFlow', 'manifesto nao confirmou o nome GymFlow');
assert(manifest?.display === 'standalone', 'manifesto nao confirmou display standalone');
assert(manifest?.start_url === '/inicio', 'manifesto nao confirmou start_url /inicio');
assert(
  Array.isArray(manifest?.icons) && manifest.icons.length > 0,
  'manifesto nao publicou icones',
);

for (const icon of manifest.icons) {
  const iconUrl = new URL(icon.src, baseUrl);
  assert(iconUrl.origin === baseUrl.origin, `icone externo nao permitido: ${icon.src}`);
  const response = await request(iconUrl.pathname);
  assert(response.status === 200, `${icon.src} respondeu ${response.status}`);
  assert(response.headers.get('content-type')?.startsWith('image/'), `${icon.src} nao e imagem`);
}

const worker = await request('/sw.js', 'application/javascript');
assert(worker.status === 200, `/sw.js respondeu ${worker.status}`);
assert(
  worker.headers.get('content-type')?.includes('javascript'),
  '/sw.js nao foi servido como JavaScript',
);

process.stdout.write(`Smoke aprovado em ${baseUrl.origin}: paginas, PWA e headers prontos.\n`);

/**
 * @param {string} path
 * @param {string} [accept]
 */
async function request(path, accept = 'text/html') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    return await fetch(new URL(path, baseUrl), {
      headers: { ...commonHeaders, accept },
      redirect: 'follow',
      signal: controller.signal,
    });
  } catch (error) {
    fail(`${path} falhou: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function fail(message) {
  process.stderr.write(`Smoke reprovado: ${message}\n`);
  process.exit(1);
}
