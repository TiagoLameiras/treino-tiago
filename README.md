# Treino Tiago

App pessoal de treino, pensado para celular e publicado no GitHub Pages. Tudo fica no `localStorage` do navegador. Sem conta, banco remoto, analytics ou serviços de sincronização.

## Uso

- **Hoje:** próxima ficha da sequência ou agenda semanal, iniciar/pausar/continuar sessão, marcar séries, copiar resultados anteriores e finalizar.
- **Histórico:** calendário, filtros por ciclo, sessão completa, edição e registro retroativo. Os registros guardam uma cópia do treino realizado.
- **Evolução:** exercícios atuais e antigos, carga máxima, volume, repetições, duração ou distância, conforme o tipo da atividade.
- **Fichas:** editar e ordenar exercícios, criar/duplicar/arquivar treinos, baixar modelo, importar TXT ou DOCX com prévia, consultar ciclos antigos.
- **Ajustes:** timer opcional (desativado por padrão para uso com Garmin), rotina semanal, meta e backup.

## Cardio fora da ficha

Em **Hoje → Registrar cardio**, abaixo de Iniciar treino, registre uma atividade já concluída. Informe o tipo (corrida, caminhada rápida/leve, boxe, bicicleta, elíptico, escada, natação ou outro), a duração em minutos e a data. Distância em km e observações são opcionais e ficam recolhidas.

Pode salvar várias atividades no mesmo dia, inclusive repetidas. O registro não muda a ficha, a sequência, o timer ou a sessão em andamento. Também há um acesso no resumo do treino em andamento. Cada cardio aparece no Histórico, com filtro Cardio avulso, edição pelo mesmo formulário e exclusão com desfazer. Em Evolução, escolha a atividade para consultar duração/distância. Os dias com cardio contam para a frequência semanal uma única vez por dia.

Cardios avulsos ficam em `sessions` com `kind: "cardio"`, separados dos ciclos de fichas e incluídos no backup completo. Os registros anteriores seguem compatíveis.

## Resumo de 30 dias e evolução geral

A home mantém a meta semanal e mostra os últimos 30 dias: dias ativos, treinos e cardios, comparando dias ativos com os 30 dias anteriores. O histórico completo continua disponível. O período inclui hoje e os 29 dias anteriores; as janelas não se sobrepõem.

Evolução abre em **Geral**. O botão **Por exercício** mantém os filtros, gráficos e registros individuais. A visão geral mostra volume total de força (soma de carga × repetições), média por treino com séries de força válidas, dias ativos, treinos e minutos de cardio. Um gráfico compara seis períodos consecutivos de 30 dias, por volume total, volume médio, dias ativos ou cardio.

Vários registros no mesmo dia contam uma vez em dias ativos. Descansos sem exercícios e sessões ainda em andamento não entram. Treinos contam sessões com exercícios de força ou tempo; cardios contam atividades de cardio, incluindo as da ficha. Séries legadas incompletas não entram no volume/média; séries válidas com carga zero continuam válidas. Sem base no período anterior, não é inventado percentual de melhora. Volume descreve trabalho registrado e depende da ficha e da quantidade de séries; não é uma medida global de ganho de força.

## Trocar a ficha a cada ciclo

1. Em Fichas, baixe `modelo-treino.txt` ou a ficha atual.
2. Edite os valores depois dos dois-pontos. Duplique os blocos de Treino e Exercício. Linhas com `#` são comentários.
3. Salve em TXT UTF-8. Se editar no Word, pode salvar em DOCX. PDF, DOC antigo, imagens e documentos sem o padrão não são aceitos.
4. Importe e confira a prévia antes de ativar. A ficha atual passa a ser um ciclo anterior; sessões antigas não são substituídas.

Tipos: `forca` usa kg e repetições, `tempo` usa segundos e `cardio` usa minutos e distância opcional em km. Treino sem exercícios representa descanso. Mantenha o mesmo nome de um exercício para relacionar sua evolução entre ciclos importados. Modifique o nome quando a variação não for comparável.

O documento é lido no próprio aparelho. A biblioteca fflate 0.8.2 está incluída em `vendor/` com sua licença MIT; não depende de CDN.

## Dados e backup

- A versão 2 lê `treinoTiago.plan.v1`, `treinoTiago.sessions.v1` e `treinoTiago.draft.v1` na primeira abertura e grava `treinoTiago.data.v2`. As chaves antigas não são removidas.
- Histórico legado é mantido com seus valores originais. Séries antigas incompletas são exibidas com campos ausentes; para corrigir, edite o registro.
- Importar uma **ficha** cria um ciclo, preservando todo o histórico. Restaurar um **backup JSON** substitui o conjunto de dados, após prévia, e guarda a versão anterior em `treinoTiago.beforeRestore.v2`.
- Exporte backups regularmente, antes de limpar o navegador ou trocar de aparelho. É possível transferir o JSON por arquivo ao computador e restaurar por lá. Isso não é sincronização e não mescla alterações de dois dispositivos.
- Dados salvos em outro navegador ou instalação podem pertencer a outro armazenamento. Mantenha um backup no aparelho de uso.
- Se a leitura ou a gravação falhar, o app não apaga os dados e informa o problema. Há opção de exportação bruta para recuperação.

## Offline e atualizações

O service worker prepara os arquivos do app após uma abertura com conexão, incluindo o modelo TXT e as dependências locais. Ativos usam rede com fallback para cache. A atualização de versão limpa apenas caches com o prefixo deste app; não toca nos registros. A versão original v1 pode exigir fechar e reabrir o app conectado para carregar a atualização.

O timer usa o horário de término para manter a contagem após suspensão e retorna ao valor correto ao reabrir. Vibração depende do navegador. Não há promessa de alarme com tela bloqueada; para isso, use o relógio.

Os scripts e o CSS usam uma versão na URL para evitar que o worker legado sirva arquivos v1 junto ao HTML v2. A cada versão incompatível, atualize esse identificador tanto no HTML quanto na lista de ativos do worker.

## Desenvolvimento e validação

Arquivos estáticos: `index.html`, `styles.css`, `app.js` (interface), `core.js` (dados, migração, validação e importação), `default-plan.js` (ficha original).

Sirva a pasta por HTTP local; não abra por `file://`. Em Node 22 ou superior, execute:

```sh
node --test --test-isolation=none tests/core.test.js
```

Os testes cobrem migração sem sobrescrita, datas locais, validação, maior carga, pausa, edição sem duplicação, histórico arquivado, novos ciclos, backup e importação do modelo. A interface foi verificada no Chrome em viewport de celular, com dados de teste no ambiente local. O funcionamento em um iPhone/Garmin real ainda deve ser conferido no aparelho de uso.

Antes de publicar, valide o fluxo de atualização e migração. Nunca inclua backups pessoais ou dados reais de treino no repositório.
