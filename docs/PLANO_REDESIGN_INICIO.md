# Plano de redesenho da página Início

## Objetivo

Transformar `/inicio` de um resumo estático do perfil em um painel diário útil, pessoal e acionável. A tela deve responder rapidamente:

1. O que eu treino hoje?
2. Como está minha consistência?
3. Como estou evoluindo?
4. O que falta configurar no meu perfil?
5. Qual é a próxima ação mais importante?

Este documento é um plano. O redesenho não deve começar sem aprovação visual e funcional.

## Estrutura proposta

```text
┌ Saudação + avatar/iniciais + nível do perfil ┐
│ mensagem contextual e atalho para Perfil     │
├───────────────────────────────────────────────┤
│ TREINO DE HOJE                                │
│ ficha, duração, exercícios e CTA principal   │
│ [Iniciar treino] ou [Retomar treino]         │
├───────────────────────────────────────────────┤
│ OFENSIVA  │ TREINOS │ MELHOR CARGA │ TEMPO   │
├───────────────────────────────────────────────┤
│ Semana atual: S T Q Q S S D                  │
│ estados: concluído, hoje, planejado, descanso│
├───────────────────────────────────────────────┤
│ EVOLUÇÃO                                      │
│ peso, volume e recorde recente               │
├───────────────────────────────────────────────┤
│ PERFIL E META                                 │
│ objetivo, frequência, peso atual/meta e prazo│
│ barra de completude + ação recomendada       │
└───────────────────────────────────────────────┘
```

## Dados reais e contratos

Não serão usados números fictícios. A primeira versão deve compor, em paralelo e com cache do TanStack Query:

- perfil: `GET /api/v1/users/me`;
- treino ativo: `GET /api/v1/sessions/active`;
- agenda do dia e da semana visível: `GET /api/v1/schedule?from=...&to=...`;
- resumo e ofensiva diária: `GET /api/v1/progress/summary`;
- recordes: `GET /api/v1/progress/records`;
- medidas recentes: contrato atual de medidas em `/api/v1/progress/measurements`.

Se a quantidade de chamadas prejudicar o primeiro carregamento depois da medição real, criar no `gym-service` um agregador somente de leitura `GET /api/v1/dashboard`. Não duplicar regras de sequência, agenda ou recordes no frontend.

## Comportamento por estado

- Treino ativo: o CTA principal será **Retomar treino**, acima de qualquer outra ação.
- Treino planejado hoje: mostrar ficha e **Iniciar treino**.
- Dia de descanso: comunicar descanso e mostrar o próximo treino.
- Sem agenda: oferecer **Montar agenda**, sem deixar um card vazio.
- Perfil incompleto: mostrar uma ação específica para o primeiro campo pendente.
- Sem histórico: substituir gráficos vazios por orientação para concluir o primeiro treino.
- Offline: usar o snapshot local do treino ativo e identificar dados que aguardam sincronização.

## Interação e aparência

- Hierarquia visual baseada em uma ação principal por vez.
- Cards com contexto, comparação e destino; nenhum card deve existir apenas como decoração.
- Ofensiva diária com sete marcadores e feedback de continuidade, sem punição visual antes do fim do dia.
- Microinterações curtas apenas para conclusão, novo recorde e avanço da ofensiva.
- `prefers-reduced-motion`, contraste AA, foco visível, alvos mínimos de 44 px e safe areas do iPhone obrigatórios.
- Conteúdo essencial primeiro; gráficos e detalhes podem carregar progressivamente.

## Fases verificáveis

### Fase 1 — Contrato e wireframe

- validar o wireframe em 360, 390 e 430 px;
- definir exatamente os dados de cada card;
- decidir se as chamadas atuais bastam ou se o agregador `/dashboard` é necessário;
- aprovação do usuário antes de alterar `/inicio`.

### Fase 2 — Fundação funcional

- criar `features/home/home-dashboard.tsx` e hooks por domínio;
- implementar saudação, treino de hoje/ativo, ofensiva e semana;
- estados de loading, vazio, offline e erro independentes por bloco.

### Fase 3 — Perfil e evolução

- resumo corporal e objetivo com privacidade adequada;
- melhor carga recente, evolução de peso e comparação com período anterior;
- atalhos para editar perfil, progresso, agenda e treino.

### Fase 4 — Interação e desempenho

- animações progressivas e fallback para movimento reduzido;
- medir LCP, INP, quantidade de requests e mudanças de layout;
- evitar que gráficos entrem no bundle inicial se não estiverem visíveis.

### Fase 5 — Validação

- testes unitários dos estados e regras de apresentação;
- E2E em Pixel 7, iPhone 13/WebKit e 360 px;
- teste em iPhone real como PWA instalada;
- lint, tipos, testes, build, Preview e CI antes de qualquer merge.

## Critérios de aceite

- o usuário inicia ou retoma o treino do dia com um toque;
- a ofensiva representa dias consecutivos, respeitando o fuso do perfil;
- todos os números vêm da API ou do snapshot offline identificado;
- nenhum conteúdo vaza horizontalmente em 360 px;
- a tela continua útil com perfil incompleto, sem agenda, sem histórico, offline ou com uma seção indisponível;
- o carregamento de uma seção não bloqueia as demais;
- acessibilidade automatizada sem violações A/AA detectáveis e navegação completa por teclado.

## Fora do escopo inicial

- ranking social, comparação entre usuários ou gamificação competitiva;
- recomendação automática de carga ou orientação clínica;
- criação de novas métricas sem contrato e regra de produto aprovados;
- redesenho das demais páginas além dos componentes compartilhados necessários.
