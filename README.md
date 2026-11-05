# Playroom

Arcade com catálogo de jogos em destaque, páginas de detalhes e envio de jogos pela comunidade.

## Como usar

Inicie o projeto com `npm start` e acesse `http://localhost:8000`. A página inicial mostra jogos em destaque; clique em uma capa para ver os detalhes e abrir o jogo na plataforma correspondente. Use “Enviar jogo” para adicionar um HTML ou ZIP, escolha opcionalmente uma logo PNG/JPG/WEBP/SVG/GIF de até 5 MB, arraste o arquivo para a área ou compartilhe uma URL HTTP/HTTPS. A logo aparece na capa do card e nos detalhes.

- **HTML:** jogo em uma página, com CSS e JavaScript incorporados.
- **ZIP:** inclua um `index.html` (na raiz ou em uma subpasta) e os recursos usados pelo jogo. O site localiza imagens, scripts e folhas de estilo referenciados por caminhos relativos no HTML.
- **Link:** abre no player incorporado. Alguns sites impedem incorporação em iframe; o botão “Abrir em nova aba” fica disponível para esses casos.

Os jogos de exemplo abrem as páginas das plataformas correspondentes; PAC-MAN abre o Doodle jogável do Google. Jogos HTML, ZIP e links enviados ficam salvos no banco local `data/games.json`; os arquivos e logos ficam em `data/uploads/` e continuam na biblioteca depois de fechar e abrir o site. Faça uma cópia da pasta `data/` para backup. O servidor local recebe os arquivos para armazená-los.

## Dependências externas

O leitor de ZIP (JSZip) e as fontes são carregados por CDN, então precisam de conexão com a internet. Arquivos HTML independentes podem ser usados sem o leitor ZIP.

## Iniciar o projeto

Instale o [Node.js](https://nodejs.org/) se ainda não estiver instalado. Não é necessário baixar módulos ou executar `npm install`.

Na pasta do projeto, execute:

```bash
npm start
```

Depois acesse `http://localhost:8000`. Para usar outra porta, defina a variável de ambiente `PORT` antes de iniciar.

As imagens de capa usadas nos exemplos ficam na pasta `games/`. Os envios ficam na pasta `data/`, ignorada pelo Git para não publicar arquivos pessoais junto com o código.

## Créditos das capas

- Mario Kart: [Walmart product image](https://www.walmart.com/c/kp/nintendo-switch-mario-kart-deluxe-super-mario-odyssey)
- PAC-MAN: [Bandai Namco Europe](https://en.bandainamcoent.eu/films/pac-man-snack-breaks-animated-shorts-series)
- Freddy Fazbear: [Icons8](https://icons8.com.br/icon/XmIJv9XF69jw/cinco-noites-no-freddy)
- Minecraft: [Iconbird](https://iconbird.com/view/40714_iconki_minecraft_game_igra)
- Prison Life: arte vetorial original do projeto em `games/prison-life.svg`.

Depois de enviar um HTML, ZIP ou link, o jogo é inserido no topo da biblioteca “Explorar”. A busca e os filtros são limpos para que o novo item fique visível imediatamente.
