# Treino Tiago

App pessoal de treino, pensado para celular e publicado no GitHub Pages. Tudo fica no `localStorage` do navegador. Sem conta, banco remoto, analytics ou serviços de sincronização.

## Uso

- **Hoje:** próxima ficha da sequência ou agenda semanal, iniciar/pausar/continuar sessão, marcar séries, copiar resultados anteriores e finalizar.
- **Histórico:** calendário, filtros por ciclo, sessão completa, edição e registro retroativo. Os registros guardam uma cópia do treino realizado.
- **Evolução:** exercícios atuais e antigos, carga máxima, volume, repetições, duração ou distância, conforme o tipo da atividade.
- **Fichas:** editar e ordenar exercícios, criar/duplicar/arquivar treinos, baixar modelo, importar TXT ou DOCX com prévia, consultar ciclos antigos.
- **Ajustes:** timer opcional (desativado por padrão para uso com Garmin), rotina semanal, meta e backup.

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

## Desenvolvimento e validação

Arquivos estáticos: `index.html`, `styles.css`, `app.js` (interface), `core.js` (dados, migração, validação e importação), `default-plan.js` (ficha original).

Sirva a pasta por HTTP local; não abra por `file://`. Em Node 22 ou superior, execute:

```sh
node --test --test-isolation=none tests/core.test.js
```

Os testes cobrem migração sem sobrescrita, datas locais, validação, maior carga, pausa, edição sem duplicação, histórico arquivado, novos ciclos, backup e importação do modelo. A interface foi verificada no Chrome em viewport de celular, com dados de teste no ambiente local. O funcionamento em um iPhone/Garmin real ainda deve ser conferido no aparelho de uso.

Antes de publicar, valide o fluxo de atualização e migração. Nunca inclua backups pessoais ou dados reais de treino no repositório.
