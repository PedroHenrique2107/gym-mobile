# Matriz de criação, edição e exclusão

Esta matriz registra quais recursos o usuário consegue manter pela interface e quais exceções são intencionais.

| Recurso | Criar | Editar | Excluir | Regra |
| --- | --- | --- | --- | --- |
| Fichas de treino | Sim | Sim | Sim | Histórico concluído preserva snapshot da ficha. |
| Exercícios próprios | Sim | Sim | Sim/arquivar | Se estiver referenciado, arquiva para preservar histórico. |
| Exercícios globais | Não | Não | Não | Catálogo administrado pelo sistema, somente leitura para membros. |
| Agenda semanal | Sim | Sim | Sim | Remover libera o dia. |
| Exceções da agenda | Sim | Sim | Sim | A data volta a seguir a recorrência semanal. |
| Sessões concluídas | Criadas pelo treino | Data, observações e séries | Sim | Exclusão remove a sessão, exercícios e séries do banco. |
| Medidas corporais | Sim | Sim | Sim | Edição usa controle de versão. |
| Fotos de progresso | Sim | Data da foto | Sim | O arquivo binário não é editado; para trocar a imagem, excluir e enviar outra. |
| Contas e convites | Admin convida | Admin altera acesso e papel | Somente admin | Exclui Auth, perfil, dados dependentes e fotos privadas; a própria conta e o último admin são protegidos. |
| Perfil pessoal | Criado com a conta | Sim | Pela exclusão da conta | É um recurso único, portanto não existe “criar outro perfil”. |
| Preferências de notificação | Criadas sob demanda | Sim | Inscrições podem ser removidas | Preferência volta a ser atualizada, não duplicada. |

## Exceções que não devem ganhar CRUD comum

- auditoria é append-only;
- aceitações de termos são registros históricos e não podem ser editadas;
- séries de um exercício são substituídas atomicamente pelo modal, evitando gravação parcial;
- recursos globais e dados pertencentes a outra pessoa continuam protegidos pelo backend.
