// @ts-check
const { serwist } = require('@serwist/next/config');

/**
 * Build externo e independente do bundler.
 *
 * O Next termina primeiro; depois o Serwist enxerga as rotas prerenderizadas e
 * injeta o manifesto de precache no worker. Isso funciona tanto com Turbopack
 * quanto com Webpack e evita acoplar a PWA ao ciclo interno do bundler.
 */
module.exports = serwist({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  precachePrerendered: true,
});
