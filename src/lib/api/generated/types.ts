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
    "/api/v1/admin/accounts/{accountId}/measurements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lista medidas corporais de um membro
         * @description Cada leitura de dados fisicos de outra pessoa exige um registro de auditoria; se a auditoria falhar, nenhum dado e devolvido.
         */
        get: operations["AdminMeasurements_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/{accountId}/measurements/{measurementId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Le uma avaliacao corporal de um membro */
        get: operations["AdminMeasurements_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/{accountId}/photos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista fotos de progresso de um membro com auditoria obrigatoria */
        get: operations["AdminPhotos_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/{accountId}/photos/{photoId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Le os metadados de uma foto de membro com auditoria obrigatoria */
        get: operations["AdminPhotos_findOne"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/{accountId}/photos/{photoId}/read-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cria URL privada de leitura para o admin com auditoria obrigatoria */
        post: operations["AdminPhotos_createReadUrl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/accounts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /**
         * Exclui uma conta ou convite pendente
         * @description Apenas administradores. Remove fotos privadas, usuário do Supabase Auth e perfil com todos os dados dependentes. Recusa a própria conta e o último administrador ativo.
         */
        delete: operations["Accounts_remove"];
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
         * @description Cria a conta no Supabase Auth e envia o e-mail com o link para definir a senha. Respeita o limite de contas de forma transacional: convites simultaneos nao furam o limite. Responde 409 `ACCOUNT_LIMIT_REACHED` quando o limite foi atingido e 409 `CONFLICT` quando o e-mail ja esta em uso. Responde 429 `EMAIL_QUOTA_EXCEEDED` quando o provedor de e-mail recusou o envio por cota — nesse caso o pedido esta correto e o que falta e tempo, entao a acao e aguardar, nao trocar o endereco.
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
    "/api/v1/exercises": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lista a biblioteca de exercicios
         * @description Traz o catalogo global em ordem alfabetica. Exercicios arquivados ficam de fora por padrao e so aparecem para ADMIN quando `includeArchived=true`. `total` conta o filtro inteiro, nao a pagina.
         */
        get: operations["Exercises_list"];
        put?: never;
        /**
         * Cria um exercicio global
         * @description Somente ADMIN. O exercicio entra no catalogo compartilhado e o nome precisa ser unico sem diferenciar maiusculas e minusculas, inclusive entre arquivados.
         */
        post: operations["Exercises_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exercises/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Le um exercicio
         * @description Inclui instrucoes, cuidados e alternativas do catalogo global. O ETag traz a versao do recurso, que deve ser reenviada em If-Match ao alterar.
         */
        get: operations["Exercises_findOne"];
        put?: never;
        post?: never;
        /**
         * Exclui definitivamente um exercicio global
         * @description Somente ADMIN. Remove o exercicio do catalogo e de todas as fichas. O historico e as series permanecem por snapshot. A operacao e bloqueada enquanto uma sessao ativa usar o exercicio.
         */
        delete: operations["Exercises_remove"];
        options?: never;
        head?: never;
        /**
         * Altera um exercicio global
         * @description Somente ADMIN. Alteracao parcial: campo ausente mantem o valor atual e `null` limpa o campo. `alternativeIds`, quando enviado, substitui a lista inteira. If-Match e obrigatorio.
         */
        patch: operations["Exercises_update"];
        trace?: never;
    };
    "/api/v1/exercises/{id}/archive": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Arquiva um exercicio global
         * @description Somente ADMIN. Remove o exercicio das novas selecoes, preservando fichas e historico. Repetir a operacao e seguro.
         */
        post: operations["Exercises_archive"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exercises/{id}/deletion-impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Consulta o impacto da exclusao definitiva
         * @description Somente ADMIN. Informa fichas, usuarios, sessoes e series afetadas. Sessoes ativas bloqueiam a exclusao.
         */
        get: operations["Exercises_deletionImpact"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/exercises/{id}/restore": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Restaura um exercicio global
         * @description Somente ADMIN. Devolve o exercicio arquivado para as novas selecoes. Um nome conflitante, inclusive arquivado, responde 409.
         */
        post: operations["Exercises_restore"];
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
    "/api/v1/me/export": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Exporta os dados da propria conta
         * @description Devolve um JSON estruturado com perfil, consentimentos, treinos, medidas e fotos. Fotos confirmadas incluem URLs privadas validas por cinco minutos; o campo interno storagePath nao faz parte da resposta.
         */
        get: operations["Users_exportMe"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/config": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Informa se Web Push esta disponivel */
        get: operations["Notifications_config"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/preferences": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista preferencias de notificacao */
        get: operations["Notifications_preferences"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/preferences/{type}": {
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
        /** Altera uma preferencia de notificacao */
        patch: operations["Notifications_updatePreference"];
        trace?: never;
    };
    "/api/v1/notifications/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista dispositivos inscritos em Web Push */
        get: operations["Notifications_subscriptions"];
        put?: never;
        /**
         * Registra ou renova a subscription deste navegador
         * @description Repetir o mesmo endpoint atualiza o registro existente. Se o navegador mudou de conta, a subscription e transferida e os envios pendentes da conta anterior sao removidos.
         */
        post: operations["Notifications_register"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/subscriptions/{subscriptionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove um dispositivo das notificacoes */
        delete: operations["Notifications_remove"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/exercises/{exerciseId}/history": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Historico de um exercicio
         * @description Um ponto por sessao, da mais antiga para a mais recente, com carga maxima, volume, esforco e dor daquele dia. Sessao em que o exercicio foi aberto e nao executado nao gera ponto: um volume zero desenharia uma queda que nao aconteceu.
         */
        get: operations["Progress_history"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/exercises/{exerciseId}/load-suggestion": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Carga da ultima vez, para pre-preencher
         * @description Devolve a carga e as repeticoes da ultima serie de trabalho e o incremento preferido do perfil. `mode` e sempre `MANUAL`: nao existe regra de progressao automatica no servidor, porque ela depende de aprovacao como regra de produto. O que a interface faz e pre-preencher com a ultima carga e deixar o ajuste com o usuario.
         */
        get: operations["Progress_loadSuggestion"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/measurements": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Historico de medidas corporais
         * @description Devolve os pontos selecionados em ordem cronologica para os graficos. Valores decimais saem como string e campos nao medidos ficam nulos.
         */
        get: operations["Measurements_list"];
        put?: never;
        /**
         * Registra medidas corporais
         * @description Aceita uma avaliacao parcial, mas exige ao menos uma metrica. Existe no maximo uma avaliacao por data; complete ou corrija a existente por PATCH.
         */
        post: operations["Measurements_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/measurements/{measurementId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Le uma avaliacao corporal */
        get: operations["Measurements_findOne"];
        put?: never;
        post?: never;
        /** Exclui uma avaliacao corporal */
        delete: operations["Measurements_remove"];
        options?: never;
        head?: never;
        /**
         * Corrige ou completa uma avaliacao corporal
         * @description Campo ausente preserva o valor e nulo remove a metrica. If-Match evita sobrescrever uma correcao feita em outro dispositivo.
         */
        patch: operations["Measurements_update"];
        trace?: never;
    };
    "/api/v1/progress/photos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Lista as proprias fotos de progresso */
        get: operations["Photos_list"];
        put?: never;
        /**
         * Reserva uma foto e cria a URL temporaria de upload
         * @description O caminho e gerado pela API e os metadados sao persistidos antes de a URL ser criada. A URL de upload expira em duas horas.
         */
        post: operations["Photos_reserve"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/photos/{photoId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Le os metadados de uma foto de progresso */
        get: operations["Photos_findOne"];
        put?: never;
        post?: never;
        /**
         * Exclui uma foto de progresso
         * @description Remove primeiro o objeto privado e somente depois os metadados, para que uma falha temporaria possa ser repetida sem criar arquivo orfao.
         */
        delete: operations["Photos_remove"];
        options?: never;
        head?: never;
        /** Corrige a data de uma foto de progresso */
        patch: operations["Photos_update"];
        trace?: never;
    };
    "/api/v1/progress/photos/{photoId}/confirm": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Confirma e valida o upload
         * @description Confere no Storage o tamanho, o MIME e a assinatura binaria antes de liberar a leitura da foto.
         */
        post: operations["Photos_confirm"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/photos/{photoId}/read-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Cria uma URL privada de leitura por cinco minutos */
        post: operations["Photos_createReadUrl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/photos/{photoId}/upload-url": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Renova a URL de upload de uma reserva pendente */
        post: operations["Photos_refreshUploadUrl"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/records": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Recordes por exercicio
         * @description Maior carga realmente levantada em uma serie, repeticoes feitas nessa serie e maior numero de repeticoes. Nao soma series nem repeticoes para definir recorde. Series de aquecimento ficam de fora.
         */
        get: operations["Progress_records"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/progress/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Indicadores de um periodo
         * @description Sessoes, series de trabalho, volume e minutos treinados no periodo, mais a sequencia diaria no fuso do perfil. Periodo maximo de 366 dias. A sequencia nao depende do periodo consultado, e o dia atual vazio ainda nao a interrompe.
         */
        get: operations["Progress_summary"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/schedule": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Resolve a agenda de um periodo
         * @description Combina a recorrencia semanal com as excecoes e devolve um item por data. Um dia pode ter mais de um treino, quando outra data foi remarcada para ele, e nenhum, quando esta livre ou marcado como descanso. Periodo maximo de 92 dias.
         */
        get: operations["Schedule_resolve"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/schedule/overrides/{date}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Registra a excecao de uma data
         * @description `REST` marca descanso, `REPLACED` troca a ficha do dia e `RESCHEDULED` move o treino para outra data. Uma excecao por data: registrar de novo substitui a anterior, e nesse caso If-Match e obrigatorio.
         */
        put: operations["Schedule_setOverride"];
        post?: never;
        /**
         * Remove a excecao de uma data
         * @description O dia volta a seguir a recorrencia semanal. Repetir a chamada em uma data sem excecao e seguro.
         */
        delete: operations["Schedule_removeOverride"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/schedule/weekly": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Le a recorrencia semanal
         * @description Sempre os sete dias, inclusive os livres. Cada dia preenchido traz sua propria versao, que deve ser reenviada em If-Match ao substituir a ficha daquele dia.
         */
        get: operations["Schedule_getWeekly"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/schedule/weekly/{weekday}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Define a ficha recorrente de um dia
         * @description If-Match e obrigatorio quando o dia ja tem ficha, e deve ser omitido quando esta livre — nesse caso nao existe versao a informar, e uma corrida entre dois dispositivos responde 409 em vez de sobrescrever. Ficha arquivada e recusada com 422.
         */
        put: operations["Schedule_setWeeklyDay"];
        post?: never;
        /**
         * Libera um dia da semana
         * @description Nao usa If-Match: a intencao de nao treinar no dia nao muda porque outro dispositivo trocou a ficha. Repetir a chamada em um dia ja livre e seguro.
         */
        delete: operations["Schedule_clearWeeklyDay"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Historico de sessoes
         * @description Da mais recente para a mais antiga, filtrando por periodo, estado e ficha. Cada item traz volume total e series de trabalho ja calculados, para a lista nao precisar de uma chamada por sessao.
         */
        get: operations["Sessions_list"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Detalhe de uma sessao, com exercicios e series */
        get: operations["Sessions_findOne"];
        /**
         * Inicia ou retoma uma sessao
         * @description O identificador e escolhido pelo cliente, o que torna a operacao segura de repetir: reenviar apos falha de rede atinge a mesma sessao em vez de criar outra. Se a sessao ja existe, e devolvida sem alteracao — retomar nao sobrescreve o que ja foi registrado. Com `templateId` e sem `exercises`, o servidor copia os exercicios da ficha para o snapshot. Responde 409 quando ja existe outro treino em andamento, trazendo `activeSessionId`.
         */
        put: operations["Sessions_startOrResume"];
        post?: never;
        /**
         * Exclui um treino encerrado
         * @description Remove definitivamente a sessão do próprio usuário. Exercícios e séries da sessão são apagados pelo cascade do banco; sessões ativas precisam ser encerradas ou abandonadas primeiro.
         */
        delete: operations["Sessions_removeCompleted"];
        options?: never;
        head?: never;
        /**
         * Corrige data planejada ou observações de uma sessão concluída
         * @description Permite corrigir o histórico do próprio usuário sem reabrir o treino. Sessões ativas ou abandonadas continuam protegidas contra esta operação.
         */
        patch: operations["Sessions_updateCompleted"];
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/abandon": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Abandona a sessao
         * @description Distinto de concluir: entra de outra forma na sequencia semanal e nas estatisticas. O que foi registrado continua no historico.
         */
        post: operations["Sessions_abandon"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Conclui a sessao
         * @description Aceita conclusao parcial: exercicios que ficaram pendentes passam a `SKIPPED`, e o que foi registrado permanece. Correcoes posteriores ficam restritas aos endpoints explicitos de edicao do historico, que recalculam volume e recordes derivados.
         */
        post: operations["Sessions_complete"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/exercises/{sessionExerciseId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Acrescenta ou altera um exercicio da sessao
         * @description Serve para o que acontece no meio do treino: incluir um exercicio fora da ficha, marcar como pulado, ou trocar por outro. O snapshot do nome e do grupo muscular e tirado no momento da gravacao. Aceita apenas sessao em andamento.
         */
        put: operations["Sessions_upsertExercise"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/exercises/{sessionExerciseId}/sets": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Salva todas as séries de um exercício de uma vez
         * @description Substitui atomicamente as séries do exercício. Em sessão ativa conclui o exercício; em sessão concluída corrige o histórico e recalcula volume e recordes derivados.
         */
        put: operations["Sessions_replaceExerciseSets"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/{sessionId}/sets/{setId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /**
         * Registra ou corrige uma serie
         * @description O identificador vem do cliente: a serie e registrada durante o treino, possivelmente sem rede, e enviada depois sem duplicar. Reenviar com o mesmo id atualiza a mesma serie. Registrar a primeira serie marca o exercicio como feito. Aceita apenas sessao em andamento.
         */
        put: operations["Sessions_upsertSet"];
        post?: never;
        /**
         * Remove uma serie
         * @description Para a serie registrada por engano. Repetir a chamada e seguro: apagar o que nao existe mais devolve a sessao sem erro.
         */
        delete: operations["Sessions_removeSet"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/sessions/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Sessao em andamento
         * @description Devolve a sessao aberta do usuario, ou 404 quando nao ha nenhuma. Existe no maximo uma por usuario, garantida por indice no banco.
         */
        get: operations["Sessions_findActive"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Inicia uma Jam e gera um codigo temporario de uso unico
         * @description Somente ADMIN. O codigo puro aparece apenas nesta resposta; o banco guarda exclusivamente seu SHA-256. O anfitriao e sua sessao ativa tornam-se o primeiro participante.
         */
        post: operations["WorkoutJams_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams/{jamId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Snapshot oficial dos dois treinos para entrada ou reconexao */
        get: operations["WorkoutJams_snapshot"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams/{jamId}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Reproduz eventos posteriores a uma sequencia
         * @description Outbox de reconexao. Eventos nao carregam peso ou repeticoes; apos recebe-los, recarregue o snapshot REST.
         */
        get: operations["WorkoutJams_events"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams/{jamId}/leave": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Sai da Jam sem encerrar ou apagar as sessoes individuais
         * @description Quando o ADMIN anfitriao sai, a Jam termina imediatamente.
         */
        post: operations["WorkoutJams_leave"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams/{jamId}/presence": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Heartbeat REST alternativo para atualizar presenca */
        post: operations["WorkoutJams_heartbeat"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams/active": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Snapshot da Jam atual do usuario */
        get: operations["WorkoutJams_active"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams/invitations/accept": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Aceita explicitamente o convite e vincula a sessao do convidado */
        post: operations["WorkoutJams_acceptInvite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams/invitations/decline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Recusa e consome definitivamente o convite */
        post: operations["WorkoutJams_declineInvite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workout-jams/invitations/preview": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Consulta com seguranca quem enviou o convite antes do aceite */
        post: operations["WorkoutJams_previewInvite"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workouts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Lista as fichas do usuario
         * @description Na ordem definida pelo usuario. Fichas arquivadas ficam de fora por padrao. Traz `exerciseCount` em vez da lista de exercicios: a tela de listagem nao os mostra, e carregar tudo pesaria em rede movel.
         */
        get: operations["Workouts_list"];
        put?: never;
        /**
         * Cria uma ficha
         * @description A ficha entra no fim da lista. A posicao de cada exercicio vem da ordem do array. Nome repetido responde 409; exercicio de outro usuario responde 422.
         */
        post: operations["Workouts_create"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workouts/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Le uma ficha com os exercicios
         * @description Exercicios em ordem de execucao, com os dados de cada um embutidos. O ETag traz a versao, que deve ser reenviada em If-Match ao alterar.
         */
        get: operations["Workouts_findOne"];
        put?: never;
        post?: never;
        /**
         * Exclui uma ficha
         * @description Remove a ficha, seus exercicios e os dias da agenda que a usavam. Para manter a ficha sem ve-la na lista, use `PATCH { archived: true }`.
         */
        delete: operations["Workouts_remove"];
        options?: never;
        head?: never;
        /**
         * Altera uma ficha
         * @description Alteracao parcial do nome e da observacao. `exercises`, quando enviado, substitui a lista inteira na ordem recebida — e um campo omitido em um item volta ao padrao, porque a lista representa o estado final. `archived: true` tira a ficha da lista e tambem dos dias da agenda semanal que a usavam, porque um dia recorrente continuaria propondo a ficha toda semana; excecoes de data ja registradas sao preservadas, e a ficha aparece nelas marcada como arquivada. `false` desarquiva, sem repor os dias.
         */
        patch: operations["Workouts_update"];
        trace?: never;
    };
    "/api/v1/workouts/{id}/duplicate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Duplica uma ficha
         * @description Copia nome, observacao e todos os exercicios em uma unica transacao. Sem `name`, a copia recebe um sufixo numerico livre. A copia entra no fim da lista.
         */
        post: operations["Workouts_duplicate"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/workouts/reorder": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Reordena as fichas
         * @description Recebe todas as fichas nao arquivadas na ordem desejada. Nao usa If-Match: a propria lista completa serve de verificacao — se outro dispositivo criou ou arquivou uma ficha, os conjuntos divergem e a operacao responde 422 em vez de gravar uma ordem que ignora a ficha nova.
         */
        post: operations["Workouts_reorder"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
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
        AcceptWorkoutJamInviteRequest: {
            /** @description Codigo temporario recebido no fragmento do link. Ele e enviado somente no corpo e nunca aparece em URL ou log do servidor. */
            inviteCode: string;
            /**
             * Format: uuid
             * @description Sessao ativa do usuario convidado.
             */
            sessionId: string;
        };
        AccountExportResponse: {
            /** Format: email */
            accountEmail?: string | null;
            consents: components["schemas"]["ConsentAcceptanceResponse"][];
            customExercises: components["schemas"]["ExerciseDetailResponse"][];
            dataAccessLog: components["schemas"]["DataAccessEventResponse"][];
            /** @example 2 */
            formatVersion: string;
            /** Format: date-time */
            generatedAt: string;
            measurements: components["schemas"]["BodyMeasurementResponse"][];
            notificationPreferences: components["schemas"]["NotificationPreferenceResponse"][];
            photos: components["schemas"]["ExportProgressPhotoResponse"][];
            profile: components["schemas"]["ProfileResponse"];
            pushSubscriptions: components["schemas"]["PushSubscriptionResponse"][];
            scheduleOverrides: components["schemas"]["ExportScheduleOverrideResponse"][];
            sessions: components["schemas"]["SessionDetailResponse"][];
            weeklySchedule: components["schemas"]["ExportWeeklyScheduleResponse"][];
            workouts: components["schemas"]["WorkoutDetailResponse"][];
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
        BodyMeasurementListResponse: {
            data: components["schemas"]["BodyMeasurementResponse"][];
            /** @description Quantidade devolvida nesta consulta. */
            total: number;
        };
        BodyMeasurementResponse: {
            bodyFatPercentage?: string | null;
            chestCm?: string | null;
            /** Format: date-time */
            createdAt: string;
            hipsCm?: string | null;
            /** Format: uuid */
            id: string;
            leftArmCm?: string | null;
            leftCalfCm?: string | null;
            leftThighCm?: string | null;
            /** Format: date */
            measuredOn: string;
            neckCm?: string | null;
            notes?: string | null;
            rightArmCm?: string | null;
            rightCalfCm?: string | null;
            rightThighCm?: string | null;
            /** Format: date-time */
            updatedAt: string;
            version: number;
            waistCm?: string | null;
            weightKg?: string | null;
        };
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
        CreateBodyMeasurementRequest: {
            /** @example 18.50 */
            bodyFatPercentage?: string | null;
            /** @example 102.00 */
            chestCm?: string | null;
            /** @example 99.00 */
            hipsCm?: string | null;
            /** @example 36.20 */
            leftArmCm?: string | null;
            /** @example 38.00 */
            leftCalfCm?: string | null;
            /** @example 58.00 */
            leftThighCm?: string | null;
            /**
             * Format: date
             * @example 2026-08-09
             */
            measuredOn: string;
            /** @example 38.20 */
            neckCm?: string | null;
            notes?: string | null;
            /** @example 36.40 */
            rightArmCm?: string | null;
            /** @example 38.10 */
            rightCalfCm?: string | null;
            /** @example 58.20 */
            rightThighCm?: string | null;
            /** @example 88.50 */
            waistCm?: string | null;
            /** @example 82.40 */
            weightKg?: string | null;
        };
        CreateExerciseRequest: {
            /** @description Exercicios equivalentes. Precisam ser visiveis para voce. */
            alternativeIds?: string[];
            cautions?: string | null;
            /** @default MEDIUM */
            difficulty: components["schemas"]["Difficulty"];
            equipment: components["schemas"]["Equipment"];
            instructions?: string | null;
            name: string;
            primaryMuscle: components["schemas"]["MuscleGroup"];
            secondaryMuscles?: components["schemas"]["MuscleGroup"][];
        };
        CreateWorkoutJamRequest: {
            /**
             * Format: uuid
             * @description Sessao ativa do ADMIN anfitriao.
             */
            sessionId: string;
        };
        CreateWorkoutJamResponse: {
            /** @description Segredo exibido uma unica vez. O frontend deve coloca-lo no fragmento #codigo= do link, nunca na query string. */
            inviteCode: string;
            jam: components["schemas"]["WorkoutJamResponse"];
        };
        CreateWorkoutRequest: {
            /** @description Exercicios em ordem de execucao. A posicao vem da ordem do array, nao de um campo: enviar `position` a mao permitiria lacunas e empates. */
            exercises?: components["schemas"]["WorkoutExerciseInput"][];
            name: string;
            notes?: string | null;
        };
        DataAccessEventResponse: {
            /** Format: date-time */
            accessedAt: string;
            /** @enum {string|null} */
            actorRole: "ADMIN" | "MEMBER" | null;
            /** Format: uuid */
            entityId?: string | null;
            entityType: string;
        };
        DeleteExerciseRequest: {
            /** @description Nome atual do exercicio. A comparacao ignora espacos externos e diferenca entre maiusculas e minusculas. */
            confirmationName: string;
        };
        /** @enum {string} */
        Difficulty: "EASY" | "MEDIUM" | "HARD";
        DuplicateWorkoutRequest: {
            /** @description Nome da copia. Omitido, recebe um sufixo numerico que nao colide. */
            name?: string;
        };
        /** @enum {string} */
        Equipment: "BARBELL" | "DUMBBELL" | "MACHINE" | "CABLE" | "BODYWEIGHT" | "KETTLEBELL" | "BAND" | "BENCH" | "OTHER";
        ExerciseDeletionImpactResponse: {
            /** @description Sessoes ativas que bloqueiam a exclusao definitiva. */
            activeSessionCount: number;
            /** @description Quantidade de usuarios com alguma ficha afetada. */
            affectedUserCount: number;
            /** @description Verdadeiro quando a exclusao definitiva pode ser executada agora. */
            canDelete: boolean;
            /** Format: uuid */
            exerciseId: string;
            exerciseName: string;
            /** @description Sessoes encerradas que preservarao o snapshot do exercicio. */
            historicalSessionCount: number;
            /** @description Series historicas que permanecerao no banco como snapshot. */
            historicalSetCount: number;
            /** @description Quantidade de fichas das quais o exercicio sera removido. */
            templateCount: number;
        };
        ExerciseDetailResponse: {
            /** @description Exercicios equivalentes, para substituir quando faltar equipamento. */
            alternatives: components["schemas"]["ExerciseSummaryResponse"][];
            cautions?: string | null;
            /** Format: date-time */
            createdAt: string;
            difficulty: components["schemas"]["Difficulty"];
            equipment: components["schemas"]["Equipment"];
            /** Format: uuid */
            id: string;
            instructions?: string | null;
            /** @description Se o exercicio foi arquivado e nao deve aparecer em novas fichas. */
            isArchived: boolean;
            /** @description Sempre verdadeiro nesta versao: todo exercicio pertence ao catalogo global. */
            isGlobal: boolean;
            /** @description Midia autorizada. Fica vazia enquanto origem e licenca de imagens forem decisao pendente. */
            media: components["schemas"]["ExerciseMediaResponse"][];
            name: string;
            primaryMuscle: components["schemas"]["MuscleGroup"];
            secondaryMuscles: components["schemas"]["MuscleGroup"][];
            /** Format: date-time */
            updatedAt: string;
            /** @description Versao do recurso. Envie em If-Match ao alterar. */
            version: number;
        };
        ExerciseHistoryPointResponse: {
            /** @description Maior dor relatada no dia. Dado bruto, sem interpretacao clinica. */
            maxPain?: number | null;
            /** @description Maior esforco percebido informado no dia. */
            maxRpe?: number | null;
            /** Format: date-time */
            performedAt: string;
            /** Format: uuid */
            sessionId: string;
            /**
             * @description Maior carga do dia.
             * @example 62.50
             */
            topWeightKg: string;
            /** @description Repeticoes na serie de maior carga. */
            topWeightReps: number;
            /**
             * @description Volume do exercicio no dia.
             * @example 1250.00
             */
            volumeKg: string;
            /** @description Series de trabalho daquele dia. */
            workingSets: number;
        };
        ExerciseHistoryResponse: {
            /** Format: uuid */
            exerciseId: string;
            exerciseName: string;
            /** @description Ultima execucao. E daqui que a interface tira a carga sugerida para a proxima sessao. */
            lastPerformance?: components["schemas"]["ExerciseHistoryPointResponse"] | null;
            /** @description Um ponto por sessao, da mais antiga para a mais recente. */
            points: components["schemas"]["ExerciseHistoryPointResponse"][];
        };
        ExerciseListResponse: {
            data: components["schemas"]["ExerciseSummaryResponse"][];
            /** @description Total que atende ao filtro, para paginacao na interface. */
            total: number;
        };
        ExerciseMediaResponse: {
            /** @description Texto alternativo, para leitores de tela. */
            alt: string;
            /** @description Credito exigido pela licenca da imagem. */
            attribution: string;
            /** Format: uuid */
            id: string;
            /** Format: uri */
            url: string;
        };
        ExerciseRecordResponse: {
            /**
             * Format: date-time
             * @description Quando a maior carga foi atingida.
             */
            achievedAt: string;
            /** Format: uuid */
            exerciseId: string;
            exerciseName: string;
            /** @description Maior numero de repeticoes em uma serie. */
            maxReps: number;
            /**
             * @description Maior carga levantada.
             * @example 80.00
             */
            maxWeightKg: string;
            /** @description Repeticoes na serie de maior carga. */
            maxWeightReps: number;
        };
        ExerciseSetInput: {
            /** Format: date-time */
            clientCompletedAt?: string;
            /**
             * Format: uuid
             * @description Identificador estável escolhido pelo cliente.
             */
            id: string;
            /** @default false */
            isWarmup: boolean;
            notes?: string | null;
            reps: number;
            setNumber: number;
            /** @example 62.50 */
            weightKg: string;
        };
        ExerciseSummaryResponse: {
            difficulty: components["schemas"]["Difficulty"];
            equipment: components["schemas"]["Equipment"];
            /** Format: uuid */
            id: string;
            /** @description Se o exercicio foi arquivado e nao deve aparecer em novas fichas. */
            isArchived: boolean;
            /** @description Sempre verdadeiro nesta versao: todo exercicio pertence ao catalogo global. */
            isGlobal: boolean;
            name: string;
            primaryMuscle: components["schemas"]["MuscleGroup"];
            secondaryMuscles: components["schemas"]["MuscleGroup"][];
        };
        /** @enum {string} */
        ExperienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
        ExportProgressPhotoResponse: {
            /** Format: date */
            capturedOn: string;
            /** Format: date-time */
            createdAt: string;
            download?: components["schemas"]["SignedPhotoUrlResponse"] | null;
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            mimeType: "image/jpeg" | "image/png" | "image/webp";
            sizeBytes: number;
            /** @enum {string} */
            status: "PENDING" | "READY";
            /** Format: date-time */
            updatedAt: string;
            /** Format: date-time */
            uploadedAt?: string | null;
            /** Format: date-time */
            uploadExpiresAt: string;
            version: number;
        };
        ExportScheduleOverrideResponse: {
            /** Format: date */
            date: string;
            /** @enum {string} */
            kind: "REPLACED" | "REST" | "RESCHEDULED";
            /** Format: date */
            movedToDate?: string | null;
            notes?: string | null;
            /** Format: uuid */
            templateId?: string | null;
            version: number;
        };
        ExportWeeklyScheduleResponse: {
            /** Format: uuid */
            templateId: string;
            version: number;
            weekday: number;
        };
        FinishSessionRequest: {
            /**
             * Format: date-time
             * @description Guardado para diagnostico.
             */
            clientEndedAt?: string;
            notes?: string | null;
        };
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
        LoadSuggestionResponse: {
            /** Format: uuid */
            exerciseId: string;
            /** Format: date-time */
            lastPerformedAt?: string | null;
            /** @description Repeticoes na ultima serie. */
            lastReps?: number | null;
            /**
             * @description Carga da ultima serie de trabalho. Nulo quando o exercicio nunca foi treinado.
             * @example 62.50
             */
            lastWeightKg?: string | null;
            /**
             * @description Sempre `MANUAL` nesta versao: a regra de progressao automatica depende de aprovacao como regra de produto e nao existe no servidor.
             * @enum {string}
             */
            mode: "MANUAL";
            /**
             * @description Incremento preferido do usuario, do perfil. Oferecido para a interface montar os botoes de mais e menos; nao e uma recomendacao de subir a carga.
             * @example 2.50
             */
            preferredIncrementKg: string;
        };
        /** @enum {string} */
        MuscleGroup: "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "FOREARMS" | "CORE" | "GLUTES" | "QUADS" | "HAMSTRINGS" | "CALVES" | "FULL_BODY";
        NotificationConfigResponse: {
            /** @description Se o backend possui o par VAPID necessario para enviar. */
            enabled: boolean;
            publicKey?: string | null;
        };
        NotificationPreferenceListResponse: {
            data: components["schemas"]["NotificationPreferenceResponse"][];
        };
        NotificationPreferenceResponse: {
            enabled: boolean;
            /**
             * @description Horario local HH:mm, interpretado no timezone do perfil.
             * @example 18:30
             */
            reminderTime?: string | null;
            type: components["schemas"]["NotificationType"];
            /** @description Nulo enquanto a preferencia ainda usa o padrao desabilitado. */
            version?: number | null;
        };
        /** @enum {string} */
        NotificationType: "WORKOUT_REMINDER";
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
        ProgressPhotoListResponse: {
            data: components["schemas"]["ProgressPhotoResponse"][];
            total: number;
        };
        ProgressPhotoReadUrlResponse: {
            download: components["schemas"]["SignedPhotoUrlResponse"];
            photo: components["schemas"]["ProgressPhotoResponse"];
        };
        ProgressPhotoReservationResponse: {
            photo: components["schemas"]["ProgressPhotoResponse"];
            upload: components["schemas"]["SignedPhotoUrlResponse"];
        };
        ProgressPhotoResponse: {
            /** Format: date */
            capturedOn: string;
            /** Format: date-time */
            createdAt: string;
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            mimeType: "image/jpeg" | "image/png" | "image/webp";
            sizeBytes: number;
            /** @enum {string} */
            status: "PENDING" | "READY";
            /** Format: date-time */
            updatedAt: string;
            /** Format: date-time */
            uploadedAt?: string | null;
            /** Format: date-time */
            uploadExpiresAt: string;
            version: number;
        };
        ProgressSummaryResponse: {
            /** @description Sessoes abandonadas no periodo. */
            abandonedSessions: number;
            /** @description Sessoes concluidas no periodo. */
            completedSessions: number;
            /** @description Dias consecutivos com ao menos um treino concluido no fuso do perfil. O dia atual vazio ainda não interrompe a sequência. */
            dailyStreak: number;
            /** Format: date */
            from: string;
            /** Format: date */
            to: string;
            /** @description Minutos treinados, pelos instantes do servidor. */
            totalMinutes: number;
            /**
             * @description Volume total do periodo.
             * @example 48250.00
             */
            totalVolumeKg: string;
            /** @description Series de trabalho, sem contar aquecimento. */
            workingSets: number;
        };
        PushSubscriptionKeysRequest: {
            auth: string;
            p256dh: string;
        };
        PushSubscriptionListResponse: {
            data: components["schemas"]["PushSubscriptionResponse"][];
        };
        PushSubscriptionResponse: {
            /** Format: date-time */
            createdAt: string;
            deviceName?: string | null;
            /** Format: date-time */
            expirationAt?: string | null;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            lastUsedAt: string;
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
        RecordsResponse: {
            /** @description Um recorde por exercicio treinado. */
            data: components["schemas"]["ExerciseRecordResponse"][];
        };
        RegisterPushSubscriptionRequest: {
            deviceName?: string | null;
            /** @description Endpoint HTTPS devolvido pela Push API do navegador. */
            endpoint: string;
            /**
             * Format: int64
             * @description Instante em milissegundos desde Unix, quando informado pelo navegador.
             */
            expirationTime?: number | null;
            keys: components["schemas"]["PushSubscriptionKeysRequest"];
        };
        ReorderWorkoutsRequest: {
            /** @description Todas as fichas nao arquivadas, na ordem desejada. */
            workoutIds: string[];
        };
        ReplaceExerciseSetsRequest: {
            sets: components["schemas"]["ExerciseSetInput"][];
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
        ReserveProgressPhotoRequest: {
            /**
             * Format: date
             * @example 2026-08-09
             */
            capturedOn: string;
            /**
             * @example image/jpeg
             * @enum {string}
             */
            mimeType: "image/jpeg" | "image/png" | "image/webp";
            /** @example 2457600 */
            sizeBytes: number;
        };
        ResolvedScheduleResponse: {
            /** @description Um item por data do periodo. */
            days: components["schemas"]["ScheduleDayResponse"][];
            /** Format: date */
            from: string;
            /** Format: date */
            to: string;
        };
        ScheduleDayResponse: {
            /**
             * Format: date
             * @example 2026-08-12
             */
            date: string;
            /** @description Verdadeiro quando existe excecao de descanso na data. O dia ainda pode ter itens vindos de remarcacao de outra data. */
            isRest: boolean;
            /** @description Treinos planejados para o dia. Pode ter mais de um quando outra data foi remarcada para ca, e nenhum em dia livre. */
            items: components["schemas"]["ScheduleItemResponse"][];
            /** @description Excecao registrada para esta data, se houver. */
            override?: components["schemas"]["ScheduleOverrideResponse"] | null;
            weekday: number;
        };
        /**
         * @description `RECURRING` vem da semana; `REPLACED` vem de uma excecao no proprio dia; `RESCHEDULED_FROM` chegou de outra data.
         * @enum {string}
         */
        ScheduleItemOrigin: "RECURRING" | "REPLACED" | "RESCHEDULED_FROM";
        ScheduleItemResponse: {
            /**
             * Format: date
             * @description Data de origem, em `RESCHEDULED_FROM`.
             */
            movedFromDate?: string | null;
            /** @description `RECURRING` vem da semana; `REPLACED` vem de uma excecao no proprio dia; `RESCHEDULED_FROM` chegou de outra data. */
            origin: components["schemas"]["ScheduleItemOrigin"];
            workout: components["schemas"]["WorkoutSummaryResponse"];
        };
        /** @enum {string} */
        ScheduleOverrideKind: "REPLACED" | "REST" | "RESCHEDULED";
        ScheduleOverrideResponse: {
            /**
             * Format: date
             * @example 2026-08-12
             */
            date: string;
            kind: components["schemas"]["ScheduleOverrideKind"];
            /**
             * Format: date
             * @description Para onde o treino foi movido, em `RESCHEDULED`.
             */
            movedToDate?: string | null;
            notes?: string | null;
            /** @description Versao do recurso. Envie em If-Match ao alterar. */
            version: number;
            /** @description Ficha que substitui a do dia, em `REPLACED`. */
            workout?: components["schemas"]["WorkoutSummaryResponse"] | null;
        };
        SessionDetailResponse: {
            /** Format: date-time */
            clientEndedAt?: string | null;
            /** Format: date-time */
            clientStartedAt?: string | null;
            /** Format: date-time */
            createdAt: string;
            /** @description Duracao em minutos, calculada com os instantes do servidor. Nula enquanto a sessao esta em andamento. */
            durationMinutes?: number | null;
            /** Format: date-time */
            endedAt?: string | null;
            exercises: components["schemas"]["SessionExerciseResponse"][];
            /** Format: uuid */
            id: string;
            notes?: string | null;
            /** Format: date */
            plannedDate?: string | null;
            /** Format: date-time */
            startedAt: string;
            status: components["schemas"]["SessionStatus"];
            /**
             * Format: uuid
             * @description Ficha de origem. Nulo se ela foi excluida depois.
             */
            templateId?: string | null;
            /** @description Nome da ficha no momento do treino. */
            templateName: string;
            /**
             * @description Volume total: soma de carga x repeticoes das series de trabalho.
             * @example 4250.00
             */
            totalVolumeKg: string;
            version: number;
            /** @description Quantidade de series realizadas, sem contar aquecimento. */
            workingSets: number;
        };
        SessionExerciseInput: {
            /** Format: uuid */
            exerciseId: string;
            /**
             * Format: uuid
             * @description Identificador da entrada, escolhido pelo cliente.
             */
            id: string;
            notes?: string | null;
            /** @description Ordem de execucao. Omitido, usa a posicao no array. */
            position?: number;
            /**
             * Format: uuid
             * @description Obrigatorio em `REPLACED`, recusado nos outros estados.
             */
            replacedByExerciseId?: string;
            repMax?: number;
            repMin?: number;
            restSeconds?: number;
            status?: components["schemas"]["SessionExerciseStatus"];
            targetSets?: number;
        };
        SessionExerciseResponse: {
            equipment: components["schemas"]["Equipment"];
            /**
             * Format: uuid
             * @description Exercicio de origem. Nulo se ele foi excluido do catalogo depois do treino; o nome permanece no snapshot.
             */
            exerciseId?: string | null;
            /** @description Nome do exercicio no momento do treino. */
            exerciseName: string;
            /**
             * Format: uuid
             * @description Identidade da entrada na sessao.
             */
            id: string;
            notes?: string | null;
            position: number;
            primaryMuscle: components["schemas"]["MuscleGroup"];
            /** Format: uuid */
            replacedByExerciseId?: string | null;
            repMax: number;
            repMin: number;
            restSeconds: number;
            /** @description Series realizadas, em ordem. */
            sets: components["schemas"]["SetLogResponse"][];
            status: components["schemas"]["SessionExerciseStatus"];
            /** @description Meta de series no momento do treino. */
            targetSets: number;
        };
        /** @enum {string} */
        SessionExerciseStatus: "PENDING" | "DONE" | "SKIPPED" | "REPLACED";
        SessionListResponse: {
            data: components["schemas"]["SessionSummaryResponse"][];
            total: number;
        };
        /** @enum {string} */
        SessionStatus: "ACTIVE" | "COMPLETED" | "ABANDONED";
        SessionSummaryResponse: {
            /** @description Duracao em minutos, calculada com os instantes do servidor. Nula enquanto a sessao esta em andamento. */
            durationMinutes?: number | null;
            /** Format: date-time */
            endedAt?: string | null;
            /** Format: uuid */
            id: string;
            /** Format: date */
            plannedDate?: string | null;
            /** Format: date-time */
            startedAt: string;
            status: components["schemas"]["SessionStatus"];
            /**
             * Format: uuid
             * @description Ficha de origem. Nulo se ela foi excluida depois.
             */
            templateId?: string | null;
            /** @description Nome da ficha no momento do treino. */
            templateName: string;
            /**
             * @description Volume total: soma de carga x repeticoes das series de trabalho.
             * @example 4250.00
             */
            totalVolumeKg: string;
            version: number;
            /** @description Quantidade de series realizadas, sem contar aquecimento. */
            workingSets: number;
        };
        SetLogResponse: {
            /**
             * Format: date-time
             * @description Instante do servidor.
             */
            completedAt: string;
            /** Format: uuid */
            id: string;
            /** @description Aquecimento nao conta para volume nem para recorde. */
            isWarmup: boolean;
            notes?: string | null;
            /** @description Dor relatada, 0 a 10. */
            painLevel?: number | null;
            reps: number;
            /** @description Esforco percebido, 1 a 10. */
            rpe?: number | null;
            /** Format: uuid */
            sessionExerciseId: string;
            setNumber: number;
            /**
             * @description Carga em quilos, como string decimal. String e nao number de proposito: ponto flutuante binario nao representa 2,5 exatamente, e somar volume acumularia erro visivel no grafico.
             * @example 62.50
             */
            weightKg: string;
        };
        SetScheduleOverrideRequest: {
            /** @description `REST` marca descanso; `REPLACED` troca a ficha do dia e exige `workoutId`; `RESCHEDULED` move o treino e exige `movedToDate`. */
            kind: components["schemas"]["ScheduleOverrideKind"];
            /**
             * Format: date
             * @description Obrigatorio em `RESCHEDULED`, recusado nos outros. Nao pode ser a propria data.
             * @example 2026-08-13
             */
            movedToDate?: string;
            notes?: string | null;
            /**
             * Format: uuid
             * @description Obrigatorio em `REPLACED`. Opcional em `RESCHEDULED`, recusado em `REST`.
             */
            workoutId?: string;
        };
        SetWeeklyScheduleDayRequest: {
            /**
             * Format: uuid
             * @description Ficha que passa a valer neste dia da semana.
             */
            workoutId: string;
        };
        SignedPhotoUrlResponse: {
            /** Format: date-time */
            expiresAt: string;
            /** Format: uri */
            url: string;
        };
        StartSessionRequest: {
            /**
             * Format: date-time
             * @description Instante em que o treino comecou no aparelho. Guardado para diagnostico; a duracao usa o relogio do servidor.
             */
            clientStartedAt?: string;
            /** @description Snapshot completo, para sessao montada offline. Quando enviado, substitui a copia automatica da ficha. */
            exercises?: components["schemas"]["SessionExerciseInput"][];
            /** @description Nome do treino quando nao vem de ficha. Ignorado quando `templateId` e informado, porque o snapshot usa o nome da ficha. */
            name?: string | null;
            notes?: string | null;
            /**
             * Format: date
             * @description Data planejada na agenda, quando a sessao corresponde a um dia agendado.
             */
            plannedDate?: string;
            /**
             * Format: uuid
             * @description Ficha de origem. Sem `exercises`, o servidor copia os exercicios dela para o snapshot da sessao.
             */
            templateId?: string;
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
        UpdateBodyMeasurementRequest: {
            /** @example 18.50 */
            bodyFatPercentage?: string | null;
            /** @example 102.00 */
            chestCm?: string | null;
            /** @example 99.00 */
            hipsCm?: string | null;
            /** @example 36.20 */
            leftArmCm?: string | null;
            /** @example 38.00 */
            leftCalfCm?: string | null;
            /** @example 58.00 */
            leftThighCm?: string | null;
            /**
             * Format: date
             * @example 2026-08-09
             */
            measuredOn?: string;
            /** @example 38.20 */
            neckCm?: string | null;
            notes?: string | null;
            /** @example 36.40 */
            rightArmCm?: string | null;
            /** @example 38.10 */
            rightCalfCm?: string | null;
            /** @example 58.20 */
            rightThighCm?: string | null;
            /** @example 88.50 */
            waistCm?: string | null;
            /** @example 82.40 */
            weightKg?: string | null;
        };
        UpdateCompletedSessionRequest: {
            notes?: string | null;
            /** Format: date */
            plannedDate?: string | null;
        };
        UpdateExerciseRequest: {
            alternativeIds?: string[];
            cautions?: string | null;
            difficulty?: components["schemas"]["Difficulty"];
            equipment?: components["schemas"]["Equipment"];
            instructions?: string | null;
            name?: string;
            primaryMuscle?: components["schemas"]["MuscleGroup"];
            secondaryMuscles?: components["schemas"]["MuscleGroup"][];
        };
        UpdateNotificationPreferenceRequest: {
            enabled?: boolean;
            /** @example 18:30 */
            reminderTime?: string | null;
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
        UpdateProgressPhotoRequest: {
            /**
             * Format: date
             * @example 2026-08-09
             */
            capturedOn: string;
        };
        UpdateWorkoutRequest: {
            /** @description Arquiva ou desarquiva a ficha. Arquivada nao aparece na lista nem pode ser agendada, e o historico continua intacto. */
            archived?: boolean;
            /** @description Substitui a lista inteira, na ordem enviada. */
            exercises?: components["schemas"]["WorkoutExerciseInput"][];
            name?: string;
            notes?: string | null;
        };
        UpsertSessionExerciseRequest: {
            /** Format: uuid */
            exerciseId: string;
            notes?: string | null;
            position?: number;
            /** Format: uuid */
            replacedByExerciseId?: string;
            repMax?: number;
            repMin?: number;
            restSeconds?: number;
            status?: components["schemas"]["SessionExerciseStatus"];
            targetSets?: number;
        };
        UpsertSetRequest: {
            /**
             * Format: date-time
             * @description Guardado para diagnostico.
             */
            clientCompletedAt?: string;
            /** @default false */
            isWarmup: boolean;
            notes?: string | null;
            /** @description Dor relatada. Registrada como dado, sem nenhuma interpretacao clinica. */
            painLevel?: number;
            reps: number;
            rpe?: number;
            /**
             * Format: uuid
             * @description Entrada de exercicio a que a serie pertence.
             */
            sessionExerciseId: string;
            setNumber: number;
            /**
             * @description Carga em quilos, como string decimal. Zero e valido: peso do corpo.
             * @example 62.50
             */
            weightKg: string;
        };
        WeeklyScheduleDayResponse: {
            /** @description Versao do agendamento deste dia. Nulo quando o dia esta livre, porque nao ha recurso a versionar. Envie em If-Match ao substituir um dia ja preenchido. */
            version?: number | null;
            /** @description ISO-8601: 1 = segunda, 7 = domingo. */
            weekday: number;
            /** @description Ficha recorrente do dia. Nulo quando o dia esta livre. */
            workout?: components["schemas"]["WorkoutSummaryResponse"] | null;
        };
        WeeklyScheduleResponse: {
            /** @description Sempre os sete dias, em ordem, inclusive os livres. */
            days: components["schemas"]["WeeklyScheduleDayResponse"][];
        };
        WorkoutDetailResponse: {
            /** Format: date-time */
            createdAt: string;
            /** @description Quantidade de exercicios na ficha. */
            exerciseCount: number;
            /** @description Em ordem de execucao. */
            exercises: components["schemas"]["WorkoutExerciseResponse"][];
            /** Format: uuid */
            id: string;
            isArchived: boolean;
            name: string;
            notes?: string | null;
            position: number;
            /** Format: date-time */
            updatedAt: string;
            /** @description Versao do recurso. Envie em If-Match ao alterar. */
            version: number;
        };
        WorkoutExerciseInput: {
            /** Format: uuid */
            exerciseId: string;
            notes?: string | null;
            /** @default 12 */
            repMax: number;
            /** @default 8 */
            repMin: number;
            /** @default 90 */
            restSeconds: number;
            /** @default 3 */
            targetSets: number;
        };
        WorkoutExerciseResponse: {
            /** @description Dados do exercicio, embutidos para a tela do treino nao precisar de uma chamada por item. */
            exercise: components["schemas"]["ExerciseSummaryResponse"];
            /**
             * Format: uuid
             * @description Identidade da entrada na ficha, nao do exercicio.
             */
            id: string;
            notes?: string | null;
            /** @description Posicao na ficha, comecando em 0 e sem lacunas. */
            position: number;
            repMax: number;
            repMin: number;
            restSeconds: number;
            targetSets: number;
        };
        /** @enum {string} */
        WorkoutJamEndReason: "INVITE_DECLINED" | "INVITE_EXPIRED" | "HOST_LEFT" | "PARTICIPANT_LEFT" | "HOST_SESSION_ENDED";
        WorkoutJamEventListResponse: {
            data: components["schemas"]["WorkoutJamEventResponse"][];
            lastSequence: string;
        };
        WorkoutJamEventResponse: {
            /** Format: uuid */
            actorId?: string | null;
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            jamId: string;
            /** Format: date-time */
            occurredAt: string;
            payload: {
                [key: string]: unknown;
            };
            sequence: string;
            /** Format: uuid */
            sessionId?: string | null;
            /** Format: uuid */
            subjectId?: string | null;
            type: components["schemas"]["WorkoutJamEventType"];
        };
        /** @enum {string} */
        WorkoutJamEventType: "JAM_CREATED" | "INVITE_ACCEPTED" | "INVITE_DECLINED" | "JAM_ACTIVATED" | "PARTICIPANT_LEFT" | "JAM_ENDED" | "SET_UPSERTED" | "SET_DELETED" | "EXERCISE_SETS_REPLACED" | "SESSION_COMPLETED" | "SESSION_ABANDONED";
        WorkoutJamInviteCodeRequest: {
            /** @description Codigo temporario recebido no fragmento do link. Ele e enviado somente no corpo e nunca aparece em URL ou log do servidor. */
            inviteCode: string;
        };
        WorkoutJamInvitePreviewResponse: {
            /** Format: date-time */
            expiresAt: string;
            /** Format: uuid */
            hostId: string;
            hostName?: string | null;
            /** Format: uuid */
            jamId: string;
            workoutName: string;
        };
        WorkoutJamParticipantResponse: {
            /** Format: uuid */
            id: string;
            isHost: boolean;
            /** @description Presenca aproximada, derivada do ultimo heartbeat dos 45 segundos anteriores. */
            isOnline: boolean;
            /** Format: date-time */
            lastSeenAt?: string | null;
            name?: string | null;
            /** Format: uuid */
            profileId: string;
            role: components["schemas"]["ProfileRole"];
            session?: components["schemas"]["WorkoutJamSessionResponse"] | null;
            status: components["schemas"]["WorkoutJamParticipantStatus"];
        };
        /** @enum {string} */
        WorkoutJamParticipantStatus: "ACCEPTED" | "DECLINED" | "LEFT";
        WorkoutJamPresenceResponse: {
            /** Format: date-time */
            lastSeenAt: string;
        };
        WorkoutJamResponse: {
            /** Format: date-time */
            endedAt?: string | null;
            endReason?: components["schemas"]["WorkoutJamEndReason"] | null;
            /** Format: uuid */
            hostId: string;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            inviteExpiresAt: string;
            participants: components["schemas"]["WorkoutJamParticipantResponse"][];
            /** Format: date-time */
            startedAt?: string | null;
            status: components["schemas"]["WorkoutJamStatus"];
            version: number;
        };
        WorkoutJamSessionResponse: {
            /** Format: uuid */
            id: string;
            status: components["schemas"]["SessionStatus"];
            templateName: string;
            version: number;
        };
        WorkoutJamSnapshotResponse: {
            /** Format: date-time */
            endedAt?: string | null;
            endReason?: components["schemas"]["WorkoutJamEndReason"] | null;
            /** Format: uuid */
            hostId: string;
            /** Format: uuid */
            id: string;
            /** Format: date-time */
            inviteExpiresAt: string;
            participants: components["schemas"]["WorkoutJamParticipantResponse"][];
            /** @description Estado oficial dos dois treinos. Usado na entrada e na reconexao; eventos apenas sinalizam que este snapshot mudou. */
            sessions: components["schemas"]["SessionDetailResponse"][];
            /** Format: date-time */
            startedAt?: string | null;
            status: components["schemas"]["WorkoutJamStatus"];
            version: number;
        };
        /** @enum {string} */
        WorkoutJamStatus: "PENDING" | "ACTIVE" | "ENDED" | "CANCELLED";
        WorkoutListResponse: {
            data: components["schemas"]["WorkoutSummaryResponse"][];
            total: number;
        };
        WorkoutSummaryResponse: {
            /** @description Quantidade de exercicios na ficha. */
            exerciseCount: number;
            /** Format: uuid */
            id: string;
            isArchived: boolean;
            name: string;
            notes?: string | null;
            position: number;
            /** Format: date-time */
            updatedAt: string;
            /** @description Versao do recurso. Envie em If-Match ao alterar. */
            version: number;
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
    AdminMeasurements_list: {
        parameters: {
            query?: {
                from?: string;
                limit?: number;
                to?: string;
            };
            header?: never;
            path: {
                accountId: string;
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
                    "application/json": components["schemas"]["BodyMeasurementListResponse"];
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
    AdminMeasurements_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: string;
                measurementId: string;
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
                    "application/json": components["schemas"]["BodyMeasurementResponse"];
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
    AdminPhotos_list: {
        parameters: {
            query?: {
                limit?: number;
                status?: "PENDING" | "READY";
            };
            header?: never;
            path: {
                accountId: string;
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
                    "application/json": components["schemas"]["ProgressPhotoListResponse"];
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
    AdminPhotos_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: string;
                photoId: string;
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
                    "application/json": components["schemas"]["ProgressPhotoResponse"];
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
    AdminPhotos_createReadUrl: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                accountId: string;
                photoId: string;
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
                    "application/json": components["schemas"]["ProgressPhotoReadUrlResponse"];
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
    Accounts_remove: {
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
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Exercises_list: {
        parameters: {
            query?: {
                difficulty?: components["schemas"]["Difficulty"];
                equipment?: components["schemas"]["Equipment"];
                /** @description Inclui arquivados. Por padrao eles ficam de fora das listagens. */
                includeArchived?: boolean;
                limit?: number;
                muscle?: components["schemas"]["MuscleGroup"];
                offset?: number;
                /** @description Busca por parte do nome. */
                search?: string;
            };
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
                    "application/json": components["schemas"]["ExerciseListResponse"];
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
    Exercises_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateExerciseRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    /** @description Versao do recurso criado. */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExerciseDetailResponse"];
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
    Exercises_findOne: {
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
                    /** @description Versao atual do recurso, entre aspas. Reenvie em If-Match ao alterar. */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ExerciseDetailResponse"];
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
    Exercises_remove: {
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
                "application/json": components["schemas"]["DeleteExerciseRequest"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Exercises_update: {
        parameters: {
            query?: never;
            header: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateExerciseRequest"];
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
                    "application/json": components["schemas"]["ExerciseDetailResponse"];
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
    Exercises_archive: {
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
                    "application/json": components["schemas"]["ExerciseDetailResponse"];
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
    Exercises_deletionImpact: {
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
                    "application/json": components["schemas"]["ExerciseDeletionImpactResponse"];
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
    Exercises_restore: {
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
                    "application/json": components["schemas"]["ExerciseDetailResponse"];
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
    Users_exportMe: {
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
                    /** @description Sugestao de nome para salvar o arquivo JSON. */
                    "Content-Disposition"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AccountExportResponse"];
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
    Notifications_config: {
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
                    "application/json": components["schemas"]["NotificationConfigResponse"];
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
    Notifications_preferences: {
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
                    "application/json": components["schemas"]["NotificationPreferenceListResponse"];
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
    Notifications_updatePreference: {
        parameters: {
            query?: never;
            header?: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. Omita enquanto a preferencia ainda tiver version nula. */
                "If-Match"?: string;
            };
            path: {
                type: components["schemas"]["NotificationType"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateNotificationPreferenceRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationPreferenceResponse"];
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
    Notifications_subscriptions: {
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
                    "application/json": components["schemas"]["PushSubscriptionListResponse"];
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
    Notifications_register: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RegisterPushSubscriptionRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["PushSubscriptionResponse"];
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
    Notifications_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                subscriptionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Progress_history: {
        parameters: {
            query?: {
                /** @description Quantas execucoes mais recentes devolver. */
                limit?: number;
            };
            header?: never;
            path: {
                exerciseId: string;
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
                    "application/json": components["schemas"]["ExerciseHistoryResponse"];
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
    Progress_loadSuggestion: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                exerciseId: string;
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
                    "application/json": components["schemas"]["LoadSuggestionResponse"];
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
    Measurements_list: {
        parameters: {
            query?: {
                from?: string;
                limit?: number;
                to?: string;
            };
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
                    "application/json": components["schemas"]["BodyMeasurementListResponse"];
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
    Measurements_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateBodyMeasurementRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BodyMeasurementResponse"];
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
    Measurements_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                measurementId: string;
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
                    "application/json": components["schemas"]["BodyMeasurementResponse"];
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
    Measurements_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                measurementId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Measurements_update: {
        parameters: {
            query?: never;
            header: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. */
                "If-Match": string;
            };
            path: {
                measurementId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateBodyMeasurementRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BodyMeasurementResponse"];
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
    Photos_list: {
        parameters: {
            query?: {
                limit?: number;
                status?: "PENDING" | "READY";
            };
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
                    "application/json": components["schemas"]["ProgressPhotoListResponse"];
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
    Photos_reserve: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReserveProgressPhotoRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgressPhotoReservationResponse"];
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
            /** @description Corpo ou arquivo acima do limite permitido. */
            413: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
                };
            };
            /** @description Content-Type nao suportado. */
            415: {
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
    Photos_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                photoId: string;
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
                    "application/json": components["schemas"]["ProgressPhotoResponse"];
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
    Photos_remove: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                photoId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Photos_update: {
        parameters: {
            query?: never;
            header: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. */
                "If-Match": string;
            };
            path: {
                photoId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProgressPhotoRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProgressPhotoResponse"];
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
    Photos_confirm: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                photoId: string;
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
                    "application/json": components["schemas"]["ProgressPhotoResponse"];
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
    Photos_createReadUrl: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                photoId: string;
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
                    "application/json": components["schemas"]["ProgressPhotoReadUrlResponse"];
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
    Photos_refreshUploadUrl: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                photoId: string;
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
                    "application/json": components["schemas"]["ProgressPhotoReservationResponse"];
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
    Progress_records: {
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
                    "application/json": components["schemas"]["RecordsResponse"];
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
    Progress_summary: {
        parameters: {
            query: {
                from: string;
                to: string;
            };
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
                    "application/json": components["schemas"]["ProgressSummaryResponse"];
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
    Schedule_resolve: {
        parameters: {
            query: {
                from: string;
                /** @description No maximo 92 dias depois de `from`. */
                to: string;
            };
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
                    "application/json": components["schemas"]["ResolvedScheduleResponse"];
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
    Schedule_setOverride: {
        parameters: {
            query?: never;
            header?: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. Obrigatorio apenas quando a data ja tem excecao. */
                "If-Match"?: string;
            };
            path: {
                /** @description Data civil AAAA-MM-DD. */
                date: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetScheduleOverrideRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    /** @description Versao da excecao apos a gravacao. */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScheduleOverrideResponse"];
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
    Schedule_removeOverride: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                date: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Excecao removida. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Schedule_getWeekly: {
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
                    "application/json": components["schemas"]["WeeklyScheduleResponse"];
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
    Schedule_setWeeklyDay: {
        parameters: {
            query?: never;
            header?: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. Obrigatorio apenas quando o dia ja esta preenchido. */
                "If-Match"?: string;
            };
            path: {
                /** @description ISO-8601: 1 = segunda, 7 = domingo. */
                weekday: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetWeeklyScheduleDayRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WeeklyScheduleResponse"];
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
    Schedule_clearWeeklyDay: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                weekday: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Dia liberado. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Sessions_list: {
        parameters: {
            query?: {
                /** @description Inicio do periodo, pela data do servidor. */
                from?: string;
                limit?: number;
                offset?: number;
                status?: components["schemas"]["SessionStatus"];
                templateId?: string;
                to?: string;
            };
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
                    "application/json": components["schemas"]["SessionListResponse"];
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
    Sessions_findOne: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
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
                    "application/json": components["schemas"]["SessionDetailResponse"];
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
    Sessions_startOrResume: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description UUID gerado pelo cliente. */
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StartSessionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDetailResponse"];
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
    Sessions_removeCompleted: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Sessions_updateCompleted: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCompletedSessionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDetailResponse"];
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
    Sessions_abandon: {
        parameters: {
            query?: never;
            header: {
                /** @description Identificador unico desta tentativa, escolhido pelo cliente (um UUID serve). Reenviar a mesma chave com o mesmo corpo devolve o resultado da primeira chamada, sem repetir o efeito. Mesma chave com corpo diferente responde 409. */
                "Idempotency-Key": string;
            };
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FinishSessionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDetailResponse"];
                };
            };
            /** @description Requisicao malformada. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
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
    Sessions_complete: {
        parameters: {
            query?: never;
            header: {
                /** @description Identificador unico desta tentativa, escolhido pelo cliente (um UUID serve). Reenviar a mesma chave com o mesmo corpo devolve o resultado da primeira chamada, sem repetir o efeito. Mesma chave com corpo diferente responde 409. */
                "Idempotency-Key": string;
            };
            path: {
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["FinishSessionRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDetailResponse"];
                };
            };
            /** @description Requisicao malformada. */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetails"];
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
    Sessions_upsertExercise: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                sessionExerciseId: string;
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertSessionExerciseRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDetailResponse"];
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
    Sessions_replaceExerciseSets: {
        parameters: {
            query?: never;
            header?: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. Opcional para clientes legados; durante uma Jam, envie a versao capturada ao abrir a edicao. */
                "If-Match"?: string;
            };
            path: {
                sessionExerciseId: string;
                sessionId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReplaceExerciseSetsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDetailResponse"];
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
    Sessions_upsertSet: {
        parameters: {
            query?: never;
            header?: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. Opcional para clientes legados; durante uma Jam, envie a versao capturada ao abrir a edicao. */
                "If-Match"?: string;
            };
            path: {
                sessionId: string;
                setId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpsertSetRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SessionDetailResponse"];
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
    Sessions_removeSet: {
        parameters: {
            query?: never;
            header?: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. Opcional para clientes legados; durante uma Jam, envie a versao capturada ao abrir a edicao. */
                "If-Match"?: string;
            };
            path: {
                sessionId: string;
                setId: string;
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
                    "application/json": components["schemas"]["SessionDetailResponse"];
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
    Sessions_findActive: {
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
                    "application/json": components["schemas"]["SessionDetailResponse"];
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
    WorkoutJams_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWorkoutJamRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CreateWorkoutJamResponse"];
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
    WorkoutJams_snapshot: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jamId: string;
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
                    "application/json": components["schemas"]["WorkoutJamSnapshotResponse"];
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
    WorkoutJams_events: {
        parameters: {
            query?: {
                /** @description Ultima sequencia recebida. A resposta traz somente eventos posteriores. */
                afterSequence?: string;
            };
            header?: never;
            path: {
                jamId: string;
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
                    "application/json": components["schemas"]["WorkoutJamEventListResponse"];
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
    WorkoutJams_leave: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jamId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    WorkoutJams_heartbeat: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                jamId: string;
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
                    "application/json": components["schemas"]["WorkoutJamPresenceResponse"];
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
    WorkoutJams_active: {
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
                    "application/json": components["schemas"]["WorkoutJamSnapshotResponse"];
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
    WorkoutJams_acceptInvite: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AcceptWorkoutJamInviteRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkoutJamSnapshotResponse"];
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
    WorkoutJams_declineInvite: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkoutJamInviteCodeRequest"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    WorkoutJams_previewInvite: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkoutJamInviteCodeRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkoutJamInvitePreviewResponse"];
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
    Workouts_list: {
        parameters: {
            query?: {
                /** @description Inclui fichas arquivadas. Por padrao elas ficam de fora. */
                includeArchived?: boolean;
            };
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
                    "application/json": components["schemas"]["WorkoutListResponse"];
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
    Workouts_create: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateWorkoutRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkoutDetailResponse"];
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
    Workouts_findOne: {
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
                    /** @description Versao atual do recurso, entre aspas. */
                    ETag?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkoutDetailResponse"];
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
    Workouts_remove: {
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
            /** @description Ficha excluida. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
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
    Workouts_update: {
        parameters: {
            query?: never;
            header: {
                /** @description Versao conhecida do recurso, como devolvida no ETag do GET. Aceita `"3"`, `3` ou `W/"3"`. Curinga `*` e recusado, porque significaria aceitar sobrescrever qualquer versao. */
                "If-Match": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateWorkoutRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkoutDetailResponse"];
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
    Workouts_duplicate: {
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
                "application/json": components["schemas"]["DuplicateWorkoutRequest"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkoutDetailResponse"];
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
    Workouts_reorder: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReorderWorkoutsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["WorkoutListResponse"];
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
