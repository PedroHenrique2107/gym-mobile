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
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
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
