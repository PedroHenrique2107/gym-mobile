#!/usr/bin/env node
/**
 * Gera `src/lib/api/generated/types.ts` a partir do OpenAPI do `gym-service`.
 *
 * O backend e o proprietario do contrato. Nenhum tipo de dominio e escrito a
 * mao neste repositorio: se a API mudar de forma incompativel, o `typecheck`
 * quebra no build em vez de a divergencia aparecer em runtime na mao do
 * usuario.
 *
 * A fonte e resolvida nesta ordem:
 *   1. `--from=<caminho-ou-url>` na linha de comando
 *   2. `GYM_SERVICE_OPENAPI` no ambiente
 *   3. o repositorio irmao `../gym-service/openapi/openapi.json`
 *   4. a API rodando em `NEXT_PUBLIC_API_URL` (nao implementado: o backend
 *      ainda nao publica o documento por HTTP)
 *
 * O repositorio irmao vem antes da rede de proposito: durante o
 * desenvolvimento, o contrato recem-gerado no backend deve valer imediatamente,
 * sem depender de a API estar no ar.
 *
 * Uso:
 *   node scripts/generate-api-types.mjs
 *   node scripts/generate-api-types.mjs --check
 *   node scripts/generate-api-types.mjs --from=../gym-service/openapi/openapi.json
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = resolve(projectRoot, 'src/lib/api/generated/types.ts');
const SIBLING_CONTRACT = resolve(projectRoot, '../gym-service/openapi/openapi.json');

const HEADER = `/**
 * ARQUIVO GERADO — NAO EDITE.
 *
 * Origem: openapi.json do gym-service.
 * Regenere com: npm run api:types
 *
 * Editar este arquivo a mao quebraria a unica garantia que ele oferece: que os
 * tipos usados pelo frontend sao exatamente os que a API publica.
 */

`;

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const fromArg = args.find((arg) => arg.startsWith('--from='))?.slice('--from='.length);

  const source = fromArg ?? process.env.GYM_SERVICE_OPENAPI ?? SIBLING_CONTRACT;
  const document = await loadDocument(source);

  const { default: openapiTS, astToString } = await import('openapi-typescript');
  const ast = await openapiTS(document, {
    // O backend garante `errors: null` em vez de omitir o campo, entao o tipo
    // gerado nao precisa de `| undefined` em cima de `| null`.
    emptyObjectsUnknown: true,
    alphabetize: true,
  });

  const generated = HEADER + astToString(ast);

  if (checkOnly) {
    const current = existsSync(OUTPUT_PATH) ? await readFile(OUTPUT_PATH, 'utf8') : null;

    if (current === null) {
      fail('src/lib/api/generated/types.ts nao existe. Rode `npm run api:types`.');
    }

    if (current !== generated) {
      fail(
        [
          'Os tipos gerados estao defasados em relacao ao contrato do gym-service.',
          '',
          'Rode `npm run api:types` e revise o diff.',
          'Se um campo existente mudou ou desapareceu, a alteracao e incompativel:',
          'o backend compativel precisa estar publicado antes deste frontend.',
        ].join('\n'),
      );
    }

    console.log('Tipos da API sincronizados com o contrato.');
    return;
  }

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, generated, 'utf8');

  const pathCount = Object.keys(document.paths ?? {}).length;
  console.log(
    `src/lib/api/generated/types.ts escrito a partir de ${describeSource(source)} (${pathCount} caminho(s)).`,
  );
}

async function loadDocument(source) {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);

    if (!response.ok) {
      fail(`Nao foi possivel obter o contrato em ${source}: HTTP ${response.status}.`);
    }

    return await response.json();
  }

  const path = isAbsolute(source) ? source : resolve(projectRoot, source);

  if (!existsSync(path)) {
    fail(
      [
        `Contrato nao encontrado em ${path}.`,
        '',
        'Gere o contrato no backend primeiro:',
        '  cd ../gym-service && npm run openapi:emit',
        '',
        'Ou informe outra origem:',
        '  npm run api:types -- --from=<caminho-ou-url>',
      ].join('\n'),
    );
  }

  return JSON.parse(await readFile(path, 'utf8'));
}

function describeSource(source) {
  return /^https?:\/\//.test(source) ? source : source.replace(/\\/g, '/');
}

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

main().catch((error) => {
  console.error(`\nFalha ao gerar os tipos da API.\n${String(error)}\n`);
  process.exit(1);
});
