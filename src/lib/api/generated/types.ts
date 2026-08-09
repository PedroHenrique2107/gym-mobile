/**
 * ARQUIVO GERADO — NAO EDITE.
 *
 * Origem: openapi.json do gym-service.
 * Regenere com: npm run api:types
 *
 * Editar este arquivo a mao quebraria a unica garantia que ele oferece: que os
 * tipos usados pelo frontend sao exatamente os que a API publica.
 */

export interface paths {
    "/api/v1/admin/accounts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lista as contas e o uso do limite
         * @description Nao inclui dados corporais nem objetivo de treino. Esses dados sao acessiveis individualmente e cada acesso e registrado em auditoria.
         */
        get: operations["Accounts_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/{id}/invitations/resend": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reenvia o convite de uma conta pendente
         * @description Nao consome vaga nova. Responde 409 se a conta nao estiver aguardando convite.
         */
        post: operations["Accounts_resend"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/{id}/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Le o perfil completo de um membro
         * @description Inclui dados corporais, objetivo e preferencias. Cada leitura e registrada em auditoria com subject_id apontando para o membro — e a leitura falha se o registro nao puder ser gravado, porque a permissao foi concedida na premissa de ser rastreavel.
         */
        get: operations["Accounts_getMemberProfile"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/{id}/role": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Altera o papel de uma conta
         * @description Recusa remover o proprio papel de administrador e o do ultimo administrador ativo.
         */
        patch: operations["Accounts_setRole"];
        trace?: never;
    };
    "/api/v1/admin/accounts/{id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Ativa ou desativa uma conta
         * @description Recusa desativar a propria conta e a ultima conta administrativa ativa — nos dois casos o sistema ficaria sem administrador e irrecuperavel pela interface.
         */
        patch: operations["Accounts_setStatus"];
        trace?: never;
    };
    "/api/v1/admin/accounts/invitations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Convida um novo membro
         * @description Cria a conta no Supabase Auth e envia o e-mail com o link para definir a senha. Respeita o limite de contas de forma transacional: convites simultaneos nao furam o limite. Responde 409 quando o limite foi atingido ou o e-mail ja esta em uso.
         */
        post: operations["Accounts_invite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/usage": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Vagas ocupadas e disponiveis */
        get: operations["Accounts_usage"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consents": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Registra o aceite de um documento
         * @description Idempotente: reaceitar a mesma versao devolve o registro existente. Uma versao que nao esta publicada resulta em 422.
         */
        post: operations["Consents_accept"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consents/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Historico de aceites do proprio usuario
         * @description Ordenado do mais recente para o mais antigo.
         */
        get: operations["Consents_history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/consents/pending": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Documentos em vigor e situacao do aceite
         * @description Lista os documentos publicados e indica quais o usuario ja aceitou. Enquanto nenhum documento estiver publicado, devolve `hasPending: false` e lista vazia — e o aplicativo deve seguir sem bloquear o usuario.
         */
        get: operations["Consents_getPending"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Le o proprio perfil
         * @description Devolve o perfil do usuario autenticado. O cabecalho ETag traz a versao do recurso, que deve ser reenviada em If-Match ao alterar.
         */
        get: operations["Users_getMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Altera o proprio perfil
         * @description Alteracao parcial. Campo ausente mantem o valor atual; `null` limpa o campo. O cabecalho If-Match e obrigatorio e deve conter a versao lida em GET — uma versao desatualizada resulta em 409 com a versao atual, em vez de sobrescrever a alteracao de outro dispositivo.
         */
        patch: operations["Users_updateMe"];
        trace?: never;
    };
    "/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Liveness
         * @description Responde enquanto o processo estiver vivo. Nao consulta banco nem servicos externos.
         */
        get: operations["Health_getHealth"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Readiness
         * @description Verifica as dependencias essenciais. Responde 503 quando o servico nao deve receber trafego.
         */
        get: operations["Health_getReady"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AcceptConsentRequest: {
            type: components["schemas"]["ConsentType"];
            /**
             * @description Versao exata do documento apresentado ao usuario. Aceitar uma versao que nao esta publicada resulta em 422 — sem isso, o registro de aceite poderia apontar para um texto que nunca existiu.
             * @example 2026-08-01
             */
            version: string;
        };
        AccountListResponse: {
            data: components["schemas"]["AccountResponse"][];
            usage: components["schemas"]["AccountUsageResponse"];
        };
        AccountResponse: {
            /** Format: date-time */
            activatedAt?: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            deactivatedAt?: string | null;
            fullName?: string | null;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            invitedAt?: string | null;
            /** Format: uuid */
            invitedById?: string | null;
            /** Format: date-time */
            onboardingCompletedAt?: string | null;
            role: components["schemas"]["ProfileRole"];
            status: components["schemas"]["ProfileStatus"];
        };
        AccountUsageResponse: {
            /** @example 3 */
            available: number;
            /**
             * @description Limite configurado.
             * @example 5
             */
            limit: number;
            /**
             * @description Contas que ocupam vaga: ativas, com convite pendente e em processo de exclusao.
             * @example 2
             */
            occupied: number;
        };
        /** @enum {string} */
        BiologicalSex: "FEMALE" | "MALE" | "INTERSEX" | "UNDISCLOSED";
        ConsentAcceptanceResponse: {
            /** Format: date-time */
            acceptedAt: string;
            /** Format: uuid */
            id: string;
            type: components["schemas"]["ConsentType"];
            /** @example 2026-08-01 */
            version: string;
        };
        ConsentHistoryResponse: {
            data: components["schemas"]["ConsentAcceptanceResponse"][];
        };
        /** @enum {string} */
        ConsentType: "TERMS_OF_SERVICE" | "PRIVACY_POLICY";
        /** @enum {string} */
        ExperienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
        HealthResponse: {
            /**
             * @description Sempre `ok` quando o processo responde.
             * @example ok
             * @enum {string}
             */
            status: "ok";
            /**
             * @description Segundos desde a inicializacao do processo.
             * @example 1284
             */
            uptimeSeconds: number;
            /**
             * @description Versao da aplicacao em execucao.
             * @example 0.0.0
             */
            version: string;
        };
        InviteAccountRequest: {
            /**
             * Format: email
             * @description E-mail do convidado. O convite cria a conta no Supabase Auth e envia o link para definir a senha.
             */
            email: string;
        };
        PendingConsentsResponse: {
            consents: components["schemas"]["RequiredConsentResponse"][];
            /** @description Se ha algum documento aguardando aceite. Quando `false`, o aplicativo pode seguir sem bloquear o usuario. */
            hasPending: boolean;
        };
        ProblemDetails: {
            /**
             * @description Codigo de dominio estavel. Este e o campo que o cliente deve inspecionar para decidir o comportamento.
             * @example VALIDATION_ERROR
             */
            code: string;
            /**
             * @description Explicacao especifica desta ocorrencia, segura para exibicao.
             * @example Revise os campos informados.
             */
            detail?: string;
            /**
             * @description Erros por campo. Presente em 422; nulo nos outros casos.
             * @example {
             *       "name": [
             *         "Informe um nome valido."
             *       ]
             *     }
             */
            errors?: {
                [key: string]: string[];
            } | null;
            /**
             * @description Caminho que originou o erro.
             * @example /api/v1/workouts
             */
            instance: string;
            /**
             * @description Identificador da requisicao, util para correlacionar com o log do servidor.
             * @example 3f1c6b1e-9c1e-4a55-9b1f-1c2d3e4f5a6b
             */
            requestId: string;
            /**
             * @description Status HTTP repetido no corpo.
             * @example 422
             */
            status: number;
            /**
             * @description Resumo legivel e estavel para este tipo de problema.
             * @example Dados invalidos
             */
            title: string;
            /**
             * @description Identificador do tipo de problema. Referencia relativa enquanto o dominio de producao nao esta definido.
             * @example /problems/validation-error
             */
            type: string;
        };
        ProfileResponse: {
            /**
             * @description Idade em anos, derivada de birthDate no momento da leitura. Nao e persistida: uma coluna de idade ficaria errada no dia seguinte ao aniversario.
             * @example 30
             */
            age?: number | null;
            /**
             * @description Dias disponiveis em ISO-8601: 1 = segunda, 7 = domingo. Sem repeticao.
             * @example [
             *       1,
             *       3,
             *       5
             *     ]
             */
            availableWeekdays: number[];
            biologicalSex?: components["schemas"]["BiologicalSex"] | null;
            /**
             * Format: date
             * @description Data civil, sem fuso.
             * @example 1995-03-21
             */
            birthDate?: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date */
            deadline?: string | null;
            /**
             * @example [
             *       "barbell",
             *       "dumbbell"
             *     ]
             */
            equipment: string[];
            experience: components["schemas"]["ExperienceLevel"];
            fullName?: string | null;
            goal: components["schemas"]["TrainingGoal"];
            /**
             * @description Altura em centimetros.
             * @example 178.00
             */
            heightCm?: string | null;
            /**
             * Format: uuid
             * @description Mesmo identificador do usuario no Supabase Auth.
             */
            id: string;
            limitations?: string | null;
            /** Format: date-time */
            onboardingCompletedAt?: string | null;
            /**
             * @description Incremento preferido de carga, em quilogramas.
             * @example 2.50
             */
            progressionIncrementKg: string;
            /** @example 90 */
            restSecondsDefault: number;
            role: components["schemas"]["ProfileRole"];
            /** @example 60 */
            sessionMinutes: number;
            /** Format: date */
            startDate?: string | null;
            status: components["schemas"]["ProfileStatus"];
            /** @example 78.00 */
            targetWeightKg?: string | null;
            /**
             * @description Timezone IANA.
             * @example America/Sao_Paulo
             */
            timezone: string;
            /** @example Academia do bairro */
            trainingPlace?: string | null;
            /** Format: date-time */
            updatedAt: string;
            /**
             * @description Versao do recurso. Envie em If-Match ao alterar; uma versao desatualizada resulta em 409.
             * @example 3
             */
            version: number;
            /** @example 4 */
            weeklyFrequency: number;
            /**
             * @description Peso em quilogramas.
             * @example 82.40
             */
            weightKg?: string | null;
        };
        /** @enum {string} */
        ProfileRole: "ADMIN" | "MEMBER";
        /** @enum {string} */
        ProfileStatus: "PENDING_INVITE" | "ACTIVE" | "INACTIVE" | "PENDING_DELETION";
        ReadinessCheckResponse: {
            /**
             * @description Explicacao curta, sem host, credencial ou mensagem de driver.
             * @example DATABASE_URL nao configurada neste ambiente.
             */
            detail?: string;
            /**
             * @description Identificador da dependencia.
             * @example database
             */
            name: string;
            /**
             * @description `up` responde normalmente, `down` falhou a verificacao, `unconfigured` nao tem credencial neste ambiente.
             * @example up
             * @enum {string}
             */
            status: "up" | "down" | "unconfigured";
        };
        ReadinessResponse: {
            /** @description Resultado por dependencia. */
            checks: components["schemas"]["ReadinessCheckResponse"][];
            /**
             * @description `ready` aceita trafego, `degraded` responde com dependencia opcional ausente, `not_ready` nao deve receber trafego.
             * @example ready
             * @enum {string}
             */
            status: "ready" | "degraded" | "not_ready";
        };
        RequiredConsentResponse: {
            /** @description Se o usuario autenticado ja aceitou esta versao. */
            accepted: boolean;
            /** Format: date-time */
            acceptedAt?: string | null;
            /**
             * Format: date
             * @example 2026-08-01
             */
            publishedAt: string;
            type: components["schemas"]["ConsentType"];
            /**
             * @description Versao em vigor que precisa ser aceita.
             * @example 2026-08-01
             */
            version: string;
        };
        /** @enum {string} */
        TrainingGoal: "HYPERTROPHY" | "STRENGTH" | "WEIGHT_LOSS" | "RECOMPOSITION" | "CONDITIONING" | "HEALTH";
        UpdateAccountRoleRequest: {
            role: components["schemas"]["ProfileRole"];
        };
        UpdateAccountStatusRequest: {
            /** @enum {string} */
            status: "ACTIVE" | "INACTIVE";
        };
        UpdateProfileRequest: {
            /**
             * @description 1 = segunda, 7 = domingo. Sem repeticao.
             * @example [
             *       1,
             *       3,
             *       5
             *     ]
             */
            availableWeekdays?: number[];
            biologicalSex?: components["schemas"]["BiologicalSex"] | null;
            /**
             * Format: date
             * @example 1995-03-21
             */
            birthDate?: string | null;
            /** Format: date */
            deadline?: string | null;
            /**
             * @example [
             *       "barbell",
             *       "dumbbell"
             *     ]
             */
            equipment?: string[];
            experience?: components["schemas"]["ExperienceLevel"];
            fullName?: string | null;
            goal?: components["schemas"]["TrainingGoal"];
            /** @example 178.00 */
            heightCm?: string | null;
            limitations?: string | null;
            /** @description Marca o onboarding como concluido. Somente `true` e aceito: desmarcar exigiria refazer o fluxo, o que nao e uma acao do usuario. */
            onboardingCompleted?: boolean;
            /** @example 2.50 */
            progressionIncrementKg?: string;
            restSecondsDefault?: number;
            sessionMinutes?: number;
            /** Format: date */
            startDate?: string | null;
            /** @example 78.00 */
            targetWeightKg?: string | null;
            /**
             * @example America/Sao_Paulo
             * @enum {string}
             */
            timezone?: "America/Sao_Paulo" | "America/Manaus" | "America/Belem" | "America/Fortaleza" | "America/Recife" | "America/Bahia" | "America/Cuiaba" | "America/Campo_Grande" | "America/Porto_Velho" | "America/Rio_Branco" | "America/Boa_Vista" | "America/Noronha" | "UTC";
            trainingPlace?: string | null;
            weeklyFrequency?: number;
            /** @example 82.40 */
            weightKg?: string | null;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    Accounts_list: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountListResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Accounts_resend: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Recurso inexistente dentro do escopo permitido. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Conflito de estado, versao divergente ou chave de idempotencia incompativel. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Accounts_getMemberProfile: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Recurso inexistente dentro do escopo permitido. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Accounts_setRole: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateAccountRoleRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Recurso inexistente dentro do escopo permitido. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Conflito de estado, versao divergente ou chave de idempotencia incompativel. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description JSON valido, porem com dados que as regras rejeitam. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Accounts_setStatus: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateAccountStatusRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Recurso inexistente dentro do escopo permitido. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Conflito de estado, versao divergente ou chave de idempotencia incompativel. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description JSON valido, porem com dados que as regras rejeitam. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Accounts_invite: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["InviteAccountRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Conflito de estado, versao divergente ou chave de idempotencia incompativel. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description JSON valido, porem com dados que as regras rejeitam. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Accounts_usage: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountUsageResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Consents_accept: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptConsentRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsentAcceptanceResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description JSON valido, porem com dados que as regras rejeitam. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Consents_history: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ConsentHistoryResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Consents_getPending: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PendingConsentsResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Users_getMe: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    /** @description Versao atual do recurso, entre aspas. Reenvie em If-Match ao alterar. */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Recurso inexistente dentro do escopo permitido. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Users_updateMe: {
        parameters: {
            query?: never;
            header: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. */
                "If-Match": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProfileRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Nova versao do recurso apos a alteracao. */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProfileResponse"];
                };
            };
            /** @description Autenticacao ausente, invalida ou expirada. */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Autenticado, mas sem permissao para esta acao. */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Recurso inexistente dentro do escopo permitido. */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Conflito de estado, versao divergente ou chave de idempotencia incompativel. */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description JSON valido, porem com dados que as regras rejeitam. */
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Alteracao enviada sem informar a versao conhecida do recurso em If-Match. */
            428: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Limite de requisicoes excedido. */
            429: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Falha interna sanitizada. */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Dependencia essencial indisponivel. */
            503: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
        };
    };
    Health_getHealth: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HealthResponse"];
                };
            };
        };
    };
    Health_getReady: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ReadinessResponse"];
                };
            };
        };
    };
}
