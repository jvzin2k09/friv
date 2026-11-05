# Playroom

Uma arcade estática para navegar e testar jogos enviados pela comunidade.

## Como usar

Abra `index.html` em um navegador moderno ou sirva a pasta localmente. Para enviar um jogo, use a área “Enviar jogo” e escolha um arquivo HTML, um ZIP, arraste o arquivo para a área ou compartilhe uma URL HTTP/HTTPS.

- **HTML:** jogo em uma página, com CSS e JavaScript incorporados.
- **ZIP:** inclua um `index.html` (na raiz ou em uma subpasta) e os recursos usados pelo jogo. O site localiza imagens, scripts e folhas de estilo referenciados por caminhos relativos no HTML.
- **Link:** abre no player incorporado. Alguns sites impedem incorporação em iframe; o botão “Abrir em nova aba” fica disponível para esses casos.

O player permite tela cheia. A biblioteca é mantida na memória da página: recarregar o site limpa os jogos adicionados. O processamento de arquivos acontece no navegador; não há envio para um servidor.

## Dependências externas

O leitor de ZIP (JSZip) e as fontes são carregados por CDN, então precisam de conexão com a internet. Arquivos HTML independentes podem ser usados sem o leitor ZIP.

## Iniciar o projeto

Instale o [Node.js](https://nodejs.org/) se ainda não estiver instalado. Não é necessário baixar módulos ou executar `npm install`.

Na pasta do projeto, execute:

```bash
npm start
```

Depois acesse `http://127.0.0.1:8000`. Para usar outra porta, defina a variável de ambiente `PORT` antes de iniciar.
