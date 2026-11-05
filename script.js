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
let selectedLogoUrl = '';
let selectedLogoFile = null;

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const readableName = (name) => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Jogo sem nome';
const fileSize = (size) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
function makeObjectUrl(file) { const url = URL.createObjectURL(file); objectUrls.push(url); return url; }
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
    ? `<img class="card-art" src="${escapeHtml(game.image)}" alt="" loading="lazy">`
    : game.logo
      ? `<img class="card-art uploaded-cover" src="${escapeHtml(game.logo)}" alt="Capa de ${escapeHtml(game.name)}" loading="lazy">`
      : `<span class="card-art card-art-fallback"><span class="placeholder-mark">▶</span><span class="placeholder-caption">JOGO DA COMUNIDADE</span></span>`;
  const logo = game.logo && game.image ? `<span class="card-logo-wrap"><img class="card-logo" src="${escapeHtml(game.logo)}" alt="Logo de ${escapeHtml(game.name)}" loading="lazy"></span>` : '';
  return `<button class="game-card" data-game-id="${escapeHtml(game.id)}" style="--cover:${escapeHtml(game.color || '#e96b4d')}" aria-label="Ver ${escapeHtml(game.name)}"><span class="card-number">${String(index + 1).padStart(2, '0')}</span><span class="card-type">${escapeHtml(game.category || game.type)}</span>${art}${logo}<span class="card-info"><strong>${escapeHtml(game.name)}</strong><small>${escapeHtml(game.description)}</small></span><span class="card-play">↗</span></button>`;
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
  $('#detailCover').innerHTML = game.image
    ? `<img src="${escapeHtml(game.image)}" alt="Capa de ${escapeHtml(game.name)}">${game.logo ? `<img class="detail-logo" src="${escapeHtml(game.logo)}" alt="Logo de ${escapeHtml(game.name)}">` : ''}`
    : game.logo
      ? `<img class="detail-primary-cover" src="${escapeHtml(game.logo)}" alt="Capa de ${escapeHtml(game.name)}">`
      : `<div class="detail-placeholder"><span class="placeholder-mark">▶</span><span>JOGO DA COMUNIDADE</span></div>`;
  const hasUploadedFile = game.html !== undefined || game.fileUrl;
  $('#detailPlay').textContent = hasUploadedFile ? 'Jogar agora  ▶' : 'Abrir jogo  ↗';
  $('#detailHint').textContent = hasUploadedFile ? 'O jogo será aberto no player da Playroom.' : 'Este jogo será aberto no site da plataforma correspondente.';
  renderGames();
}
async function startGame(game) {
  if (!game) return;
  if (game.html === undefined && game.fileUrl) {
    try {
      const response = await fetch(game.fileUrl);
      if (!response.ok) throw new Error('Não foi possível baixar o arquivo salvo.');
      const blob = await response.blob();
      const file = new File([blob], game.fileName, { type: game.type === 'ZIP' ? 'application/zip' : 'text/html' });
      game.html = game.type === 'ZIP' ? await loadZip(file) : await file.text();
    } catch (error) { toast(`Não foi possível abrir ${game.name}: ${error.message}`); return; }
  }
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

async function persistGame(metadata, file, logoFile) {
  const createResponse = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });
  const created = await createResponse.json().catch(() => ({}));
  if (!createResponse.ok) throw new Error(created.error || 'Não foi possível salvar o jogo.');
  const id = created.id;
  try {
    if (file) {
      const fileResponse = await fetch(`/api/games/${id}/file`, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: file });
      const fileResult = await fileResponse.json().catch(() => ({}));
      if (!fileResponse.ok) throw new Error(fileResult.error || 'Falha ao salvar o arquivo do jogo.');
    }
    if (logoFile) {
      const logoResponse = await fetch(`/api/games/${id}/logo`, { method: 'PUT', headers: { 'Content-Type': logoFile.type }, body: logoFile });
      const logoResult = await logoResponse.json().catch(() => ({}));
      if (!logoResponse.ok) throw new Error(logoResult.error || 'Falha ao salvar a logo.');
    }
    const publishResponse = await fetch(`/api/games/${id}/publish`, { method: 'POST' });
    const saved = await publishResponse.json().catch(() => ({}));
    if (!publishResponse.ok) throw new Error(saved.error || 'Não foi possível publicar o jogo.');
    return { ...metadata, ...saved, image: '', logo: saved.logo || '', color: '#df6949' };
  } catch (error) {
    await fetch(`/api/games/${id}`, { method: 'DELETE' }).catch(() => {});
    throw error;
  }
}

async function loadSavedGames() {
  try {
    const response = await fetch('/api/games');
    if (!response.ok) throw new Error('A API local não respondeu.');
    const saved = await response.json();
    games.unshift(...saved.map((game) => ({ ...game, image: '', logo: game.logo || '', color: '#df6949' })));
    renderGames();
  } catch (error) {
    console.error('Não foi possível carregar os jogos salvos:', error);
    toast('Não foi possível carregar a biblioteca salva. Confira se o servidor está rodando.');
  }
}

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
    return makeObjectUrl(blob);
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
  const logoFile = selectedLogoFile;
  for (const file of Array.from(fileList || [])) {
    if (file.size > 100 * 1024 * 1024) { toast(`${file.name}: o limite é 100 MB.`); continue; }
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['zip', 'html', 'htm'].includes(ext)) { toast(`${file.name}: formato não suportado.`); continue; }
    try {
      const html = ext === 'zip' ? await loadZip(file) : await file.text();
      if (!/<html[\s>]/i.test(html) && !/<(canvas|body|script)[\s>]/i.test(html)) throw new Error('O arquivo não parece conter uma página HTML.');
      const metadata = { name: readableName(file.name), fileName: file.name, category: 'Comunidade', type: ext === 'zip' ? 'ZIP' : 'HTML', description: 'Jogo enviado pela comunidade e pronto para experimentar.', platform: ext === 'zip' ? 'Pacote ZIP' : 'Jogo HTML' };
      const savedGame = await persistGame(metadata, file, logoFile);
      savedGame.html = html;
      addGame(savedGame);
      toast(`${readableName(file.name)} adicionado à biblioteca.`);
    } catch (error) { toast(`Não foi possível abrir ${file.name}: ${error.message}`); }
  }
  selectedLogoUrl = '';
  selectedLogoFile = null;
  $('#gameLogo').value = '';
  $('#logoPreview').textContent = '＋';
  $('#clearLogoBtn').hidden = true;
}
uploadInput.addEventListener('change', (event) => { handleFiles(event.target.files); uploadInput.value = ''; });
const uploadBox = $('#uploadBox');
uploadBox.addEventListener('click', (event) => { if (event.target.closest('label') || event.target === uploadInput) return; uploadInput.click(); });
['dragenter', 'dragover'].forEach((event) => uploadBox.addEventListener(event, (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((event) => uploadBox.addEventListener(event, (e) => { e.preventDefault(); uploadBox.classList.remove('dragover'); }));
uploadBox.addEventListener('drop', (event) => handleFiles(event.dataTransfer.files));
$('#gameLogo').addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
    event.target.value = '';
    toast('Escolha uma imagem de até 5 MB para usar como logo.');
    return;
  }
  selectedLogoUrl = makeObjectUrl(file);
  selectedLogoFile = file;
  $('#logoPreview').innerHTML = `<img src="${selectedLogoUrl}" alt="Prévia da logo">`;
  $('#clearLogoBtn').hidden = false;
});
$('#clearLogoBtn').addEventListener('click', () => {
  $('#gameLogo').value = '';
  selectedLogoUrl = '';
  selectedLogoFile = null;
  $('#logoPreview').textContent = '＋';
  $('#clearLogoBtn').hidden = true;
});

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
$('#linkForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = $('#linkName').value.trim();
  let parsed;
  try { parsed = new URL($('#linkUrl').value); } catch { toast('Informe uma URL válida.'); return; }
  if (!['http:', 'https:'].includes(parsed.protocol)) { toast('Use um link HTTP ou HTTPS.'); return; }
  const logoFile = $('#linkLogo').files[0];
  if (logoFile && (!logoFile.type.startsWith('image/') || logoFile.size > 5 * 1024 * 1024)) { toast('Escolha uma logo de até 5 MB.'); return; }
  try {
    const savedGame = await persistGame({ name, url: parsed.href, category: 'Comunidade', type: 'Link', description: 'Jogo compartilhado pela comunidade.', platform: 'Link externo' }, null, logoFile);
    dialog.close();
    addGame(savedGame);
    event.target.reset(); toast(`${name} adicionado à biblioteca.`);
  } catch (error) { toast(`Não foi possível salvar ${name}: ${error.message}`); }
});
$('#fullscreenBtn').addEventListener('click', async () => {
  try { if (!document.fullscreenElement) await gameFrame.requestFullscreen(); else await document.exitFullscreen(); }
  catch { toast('Tela cheia não está disponível neste navegador.'); }
});
$('#closePlayer').addEventListener('click', () => { player.hidden = true; gameFrame.src = 'about:blank'; gameFrame.srcdoc = ''; });
window.addEventListener('beforeunload', () => objectUrls.forEach((url) => URL.revokeObjectURL(url)));
renderGames();
loadSavedGames();
