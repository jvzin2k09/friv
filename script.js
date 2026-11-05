const $ = (selector) => document.querySelector(selector);
const uploadInput = $('#gameUploader');
const gameGrid = $('#gameGrid');
const gameFrame = $('#gameFrame');
const player = $('#player');
const games = [
  { id: 'mario-kart', name: 'Mario Kart 8 Deluxe', category: 'Corrida', description: 'Pise fundo, escolha seu piloto e dispute corridas cheias de curvas e atalhos.', image: './games/mario-kart.jpg', color: '#ee5145', platform: 'Nintendo Switch', url: 'https://www.nintendo.com/us/store/products/mario-kart-8-deluxe-switch/' },
  { id: 'pacman', name: 'PAC-MAN Snack Breaks', category: 'Clássicos', description: 'Entre no labirinto, devore os pontos e fuja dos fantasmas neste clássico de arcade.', image: './games/pacman.jpg', color: '#f3be39', platform: 'Navegador', url: 'https://www.google.com/logos/2010/pacman10-i.html' },
  { id: 'fnaf', name: 'Five Nights at Freddy’s', category: 'Aventura', description: 'Uma noite longa na pizzaria. Fique de olho nas câmeras e sobreviva até de manhã.', image: './games/freddy.jpg', color: '#8b542d', platform: 'PC e consoles', url: 'https://store.steampowered.com/app/319510/Five_Nights_at_Freddys/' },
  { id: 'minecraft', name: 'Minecraft', category: 'Aventura', description: 'Explore, construa e invente suas próprias aventuras em um mundo de blocos.', image: './games/creeper.png', color: '#52a044', platform: 'PC, consoles e celular', url: 'https://www.minecraft.net/' },
  { id: 'prison-life', name: 'Prison Life', category: 'Comunidade', description: 'Escolha seu lado: mantenha a ordem como guarda ou planeje uma fuga da prisão.', image: './games/prison-life.svg', color: '#3175be', platform: 'Roblox', url: 'https://www.roblox.com/games/155615604/Prison-Life' },
];
let currentFilter = 'Todos';
let selectedGame = null;
let objectUrls = [];

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const readableName = (name) => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Jogo sem nome';
const fileSize = (size) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 3400); }
function newId() { return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function showPage(page) {
  $('#explorePage').hidden = page !== 'explore';
  $('#uploadPage').hidden = page !== 'upload';
  $('#detailPage').hidden = page !== 'detail';
  document.querySelectorAll('.nav-btn').forEach((button) => button.classList.toggle('active', button.dataset.page === page || (page === 'detail' && button.dataset.page === 'explore')));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function cardMarkup(game, index) {
  const art = game.image
    ? `<img class="card-art" src="${escapeHtml(game.image)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=\'card-art card-art-fallback\'>${escapeHtml(game.name.slice(0, 1))}</span>'">`
    : `<span class="card-art card-art-fallback">${escapeHtml(game.name.slice(0, 1).toUpperCase())}</span>`;
  return `<button class="game-card" data-game-id="${escapeHtml(game.id)}" style="--cover:${escapeHtml(game.color || '#e96b4d')}" aria-label="Ver ${escapeHtml(game.name)}"><span class="card-number">${String(index + 1).padStart(2, '0')}</span><span class="card-type">${escapeHtml(game.category || game.type)}</span>${art}<span class="card-info"><strong>${escapeHtml(game.name)}</strong><small>${escapeHtml(game.description)}</small></span><span class="card-play">↗</span></button>`;
}
function renderGames() {
  const query = $('#searchInput').value.trim().toLocaleLowerCase('pt-BR');
  const shown = games.filter((game) => (currentFilter === 'Todos' || game.category === currentFilter) && `${game.name} ${game.description} ${game.category}`.toLocaleLowerCase('pt-BR').includes(query));
  $('#gamesCounter')?.replaceChildren(document.createTextNode(String(games.length)));
  gameGrid.innerHTML = shown.length ? shown.map(cardMarkup).join('') : '<article class="empty-state"><div class="empty-art">⌕</div><h3>Nenhum jogo encontrado</h3><p>Tente buscar por outro nome ou categoria.</p></article>';
  gameGrid.querySelectorAll('.game-card').forEach((card) => card.addEventListener('click', () => showDetails(games.find((game) => game.id === card.dataset.gameId))));
  const more = $('#moreGames');
  if (more) {
    more.innerHTML = games.filter((game) => game.id !== selectedGame?.id).slice(0, 4).map(cardMarkup).join('');
    more.querySelectorAll('.game-card').forEach((card) => card.addEventListener('click', () => showDetails(games.find((game) => game.id === card.dataset.gameId))));
  }
}
function showDetails(game) {
  if (!game) return;
  selectedGame = game;
  showPage('detail');
  $('#detailTitle').textContent = game.name;
  $('#detailCategory').textContent = `${game.category || game.type} · JOGO EM DESTAQUE`;
  $('#detailDescription').textContent = game.description;
  $('#detailPlatform').textContent = game.platform || (game.type === 'ZIP' ? 'Pacote ZIP' : game.type === 'HTML' ? 'Jogo HTML' : 'Navegador');
  $('#detailCover').innerHTML = game.image ? `<img src="${escapeHtml(game.image)}" alt="Capa de ${escapeHtml(game.name)}" onerror="this.style.display='none'">` : `<span>${escapeHtml(game.name.slice(0, 1).toUpperCase())}</span>`;
  $('#detailPlay').textContent = game.html !== undefined ? 'Jogar agora  ▶' : 'Abrir jogo  ↗';
  $('#detailHint').textContent = game.html !== undefined ? 'O jogo será aberto no player da Playroom.' : 'Este jogo será aberto no site da plataforma correspondente.';
  renderGames();
}
function startGame(game) {
  if (!game) return;
  if (game.html !== undefined) {
    $('#activeGameTitle').textContent = game.name;
    $('#openExternal').hidden = true;
    gameFrame.removeAttribute('src');
    gameFrame.srcdoc = game.html;
    player.hidden = false;
  } else {
    window.open(game.url, '_blank', 'noopener,noreferrer');
  }
}
$('#detailPlay').addEventListener('click', () => startGame(selectedGame));

async function loadZip(file) {
  if (!window.JSZip) throw new Error('O leitor de ZIP não carregou. Confira sua conexão e tente de novo.');
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const htmlEntry = entries.find((entry) => /(^|\/)index\.html?$/i.test(entry.name)) || entries.find((entry) => /\.html?$/i.test(entry.name));
  if (!htmlEntry) throw new Error('O ZIP precisa conter um arquivo index.html ou outro HTML.');
  const fileMap = new Map(entries.map((entry) => [entry.name.replace(/\\/g, '/'), entry]));
  let html = await htmlEntry.async('string');
  const base = htmlEntry.name.replace(/[^/]+$/, '');
  const resolveAsset = async (raw) => {
    const value = raw.trim();
    if (!value || /^(#|data:|blob:|https?:|\/\/|javascript:|mailto:)/i.test(value)) return raw;
    const path = decodeURIComponent(value.split(/[?#]/)[0]).replace(/^\.\//, '');
    const entry = [base + path, path].map((key) => fileMap.get(key)).find(Boolean);
    if (!entry) return raw;
    const blob = await entry.async('blob');
    const url = URL.createObjectURL(blob); objectUrls.push(url); return url;
  };
  const refs = [...html.matchAll(/\b(src|href|poster)\s*=\s*(["'])(.*?)\2/gi)];
  for (const [, attr, quote, value] of refs) {
    const resolved = await resolveAsset(value);
    if (resolved !== value) html = html.replace(`${attr}=${quote}${value}${quote}`, `${attr}=${quote}${resolved}${quote}`);
  }
  return html;
}
function addGame(game) {
  games.unshift(game);
  currentFilter = 'Todos';
  $('#searchInput').value = '';
  document.querySelectorAll('.filter').forEach((button) => button.classList.toggle('active', button.dataset.filter === 'Todos'));
  renderGames();
  showPage('explore');
  requestAnimationFrame(() => $('#biblioteca').scrollIntoView({ behavior: 'smooth', block: 'start' }));
}
async function handleFiles(fileList) {
  for (const file of Array.from(fileList || [])) {
    if (file.size > 100 * 1024 * 1024) { toast(`${file.name}: o limite é 100 MB.`); continue; }
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['zip', 'html', 'htm'].includes(ext)) { toast(`${file.name}: formato não suportado.`); continue; }
    try {
      const html = ext === 'zip' ? await loadZip(file) : await file.text();
      if (!/<html[\s>]/i.test(html) && !/<(canvas|body|script)[\s>]/i.test(html)) throw new Error('O arquivo não parece conter uma página HTML.');
      addGame({ id: newId(), name: readableName(file.name), html, category: 'Comunidade', type: ext.toUpperCase(), description: 'Jogo enviado pela comunidade e pronto para experimentar.', color: ext === 'zip' ? '#7153ca' : '#df6949', platform: ext.toUpperCase() === 'ZIP' ? 'Pacote ZIP' : 'Jogo HTML' });
      toast(`${readableName(file.name)} adicionado à biblioteca.`);
    } catch (error) { toast(`Não foi possível abrir ${file.name}: ${error.message}`); }
  }
}
uploadInput.addEventListener('change', (event) => { handleFiles(event.target.files); uploadInput.value = ''; });
const uploadBox = $('#uploadBox');
uploadBox.addEventListener('click', (event) => { if (event.target.closest('label') || event.target === uploadInput) return; uploadInput.click(); });
['dragenter', 'dragover'].forEach((event) => uploadBox.addEventListener(event, (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((event) => uploadBox.addEventListener(event, (e) => { e.preventDefault(); uploadBox.classList.remove('dragover'); }));
uploadBox.addEventListener('drop', (event) => handleFiles(event.dataTransfer.files));

$('#publishBtn').addEventListener('click', () => showPage('upload'));
$('#homeLink').addEventListener('click', (event) => { event.preventDefault(); showPage('explore'); });
$('#uploadBack').addEventListener('click', () => showPage('explore'));
$('#backToGames').addEventListener('click', () => showPage('explore'));
document.querySelectorAll('.nav-btn').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.page)));
$('#searchInput').addEventListener('input', renderGames);
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
  renderGames();
}));
$('#featuredGame').addEventListener('click', () => showDetails(games[0]));
const dialog = $('#linkDialog');
$('#linkUploadBtn').addEventListener('click', () => dialog.showModal());
$('#linkForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#linkName').value.trim();
  let parsed;
  try { parsed = new URL($('#linkUrl').value); } catch { toast('Informe uma URL válida.'); return; }
  if (!['http:', 'https:'].includes(parsed.protocol)) { toast('Use um link HTTP ou HTTPS.'); return; }
  dialog.close();
  addGame({ id: newId(), name, url: parsed.href, category: 'Comunidade', type: 'Link', description: 'Jogo compartilhado pela comunidade.', platform: 'Link externo' });
  event.target.reset(); toast(`${name} adicionado à biblioteca.`);
});
$('#fullscreenBtn').addEventListener('click', async () => {
  try { if (!document.fullscreenElement) await gameFrame.requestFullscreen(); else await document.exitFullscreen(); }
  catch { toast('Tela cheia não está disponível neste navegador.'); }
});
$('#closePlayer').addEventListener('click', () => { player.hidden = true; gameFrame.src = 'about:blank'; gameFrame.srcdoc = ''; });
window.addEventListener('beforeunload', () => objectUrls.forEach((url) => URL.revokeObjectURL(url)));
renderGames();
