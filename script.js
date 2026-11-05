const $ = (selector) => document.querySelector(selector);
const uploadInput = $('#gameUploader');
const gameGrid = $('#gameGrid');
const gameFrame = $('#gameFrame');
const player = $('#player');
const games = [];
let activeGameId = null;
let currentFilter = 'Todos';
let objectUrls = [];

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const readableName = (name) => name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Jogo sem nome';
const fileSize = (size) => size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB`;
function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 3400); }
function addGame(game) { games.unshift(game); renderGames(); playGame(game); }
function renderGames() {
  const query = $('#searchInput').value.trim().toLocaleLowerCase('pt-BR');
  const shown = games.filter((game) => (currentFilter === 'Todos' || game.type === currentFilter) && `${game.name} ${game.description}`.toLocaleLowerCase('pt-BR').includes(query));
  $('#gamesCounter').textContent = games.length;
  if (!shown.length) {
    gameGrid.innerHTML = games.length ? '<article class="empty-state"><div class="empty-art">⌕</div><h3>Nenhum jogo encontrado</h3><p>Tente outro nome ou filtro.</p></article>' : '<article class="empty-state"><div class="empty-art">＋</div><h3>A biblioteca começa com você</h3><p>Adicione um jogo em HTML, um ZIP com os arquivos do jogo ou um link público.</p><button class="text-action" id="emptyUploadBtn">Adicionar o primeiro jogo <span>→</span></button></article>';
    $('#emptyUploadBtn')?.addEventListener('click', () => $('#enviar').scrollIntoView({ behavior: 'smooth' }));
    return;
  }
  gameGrid.innerHTML = shown.map((game, index) => `<button class="game-card ${game.id === activeGameId ? 'active' : ''}" data-game-id="${escapeHtml(game.id)}" style="--cover:${game.color}" aria-label="Jogar ${escapeHtml(game.name)}"><span class="card-number">${String(index + 1).padStart(2, '0')}</span><span class="card-type">${escapeHtml(game.type)}</span><span class="card-art" aria-hidden="true">${game.art}</span><span class="card-info"><strong>${escapeHtml(game.name)}</strong><small>${escapeHtml(game.description)}</small></span><span class="card-play">▶</span></button>`).join('');
  gameGrid.querySelectorAll('.game-card').forEach((card) => card.addEventListener('click', () => playGame(games.find((game) => game.id === card.dataset.gameId))));
}
function playGame(game) {
  if (!game) return;
  activeGameId = game.id;
  $('#activeGameTitle').textContent = game.name;
  if (game.html !== undefined) { $('#openExternal').hidden = true; gameFrame.removeAttribute('src'); gameFrame.srcdoc = game.html; }
  else { gameFrame.removeAttribute('srcdoc'); gameFrame.src = game.url; $('#openExternal').href = game.url; $('#openExternal').hidden = false; }
  player.hidden = false;
  renderGames();
  player.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function id() { return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

async function loadZip(file) {
  if (!window.JSZip) throw new Error('Não foi possível carregar o leitor ZIP. Confira sua conexão e tente novamente.');
  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  const htmlEntry = entries.find((entry) => /(^|\/)index\.html?$/i.test(entry.name)) || entries.find((entry) => /\.html?$/i.test(entry.name));
  if (!htmlEntry) throw new Error('O ZIP precisa conter um arquivo index.html ou outro HTML.');
  const fileMap = new Map(entries.map((entry) => [entry.name.replace(/\\/g, '/'), entry]));
  let html = await htmlEntry.async('string');
  const base = htmlEntry.name.replace(/[^/]+$/, '');
  // Turn relative asset references into temporary browser URLs so ZIP games with separate files work.
  const resolveAsset = async (raw) => {
    const value = raw.trim();
    if (!value || /^(#|data:|blob:|https?:|\/\/|javascript:|mailto:)/i.test(value)) return raw;
    const path = decodeURIComponent(value.split(/[?#]/)[0]).replace(/^\.\//, '');
    const candidates = [base + path, path];
    const entry = candidates.map((key) => fileMap.get(key)).find(Boolean);
    if (!entry) return raw;
    const blob = await entry.async('blob');
    const url = URL.createObjectURL(blob); objectUrls.push(url); return url;
  };
  const refs = [...html.matchAll(/\b(src|href|poster)\s*=\s*(["'])(.*?)\2/gi)];
  for (const [, attr, quote, value] of refs) {
    const resolved = await resolveAsset(value);
    if (resolved !== value) html = html.replace(`${attr}=${quote}${value}${quote}`, `${attr}=${quote}${resolved}${quote}`);
  }
  // Revoke old package assets after the new package has been prepared.
  return html;
}

async function handleFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const file of files) {
    if (file.size > 100 * 1024 * 1024) { toast(`${file.name}: o limite é 100 MB.`); continue; }
    const ext = file.name.toLowerCase().split('.').pop();
    if (!['zip', 'html', 'htm'].includes(ext)) { toast(`${file.name}: formato não suportado.`); continue; }
    try {
      const html = ext === 'zip' ? await loadZip(file) : await file.text();
      if (!/<html[\s>]/i.test(html) && !/<(canvas|body|script)[\s>]/i.test(html)) throw new Error('O arquivo não parece conter uma página HTML válida.');
      addGame({ id: id(), name: readableName(file.name), html, type: ext === 'zip' ? 'ZIP' : 'HTML', description: ext === 'zip' ? 'Jogo enviado em pacote ZIP' : 'Jogo HTML enviado', color: ext === 'zip' ? '#7759e8' : '#e76b48', art: ext === 'zip' ? '▧' : '▤', size: fileSize(file.size) });
      toast(`${readableName(file.name)} adicionado à biblioteca.`);
    } catch (error) { toast(`Não foi possível abrir ${file.name}: ${error.message}`); }
  }
}
uploadInput.addEventListener('change', (event) => { handleFiles(event.target.files); uploadInput.value = ''; });
const uploadBox = $('#uploadBox');
uploadBox.addEventListener('click', (event) => {
  if (event.target.closest('label') || event.target === uploadInput) return;
  uploadInput.click();
});
['dragenter', 'dragover'].forEach((event) => uploadBox.addEventListener(event, (e) => { e.preventDefault(); uploadBox.classList.add('dragover'); }));
['dragleave', 'drop'].forEach((event) => uploadBox.addEventListener(event, (e) => { e.preventDefault(); uploadBox.classList.remove('dragover'); }));
uploadBox.addEventListener('drop', (event) => handleFiles(event.dataTransfer.files));

$('#publishBtn').addEventListener('click', () => $('#enviar').scrollIntoView({ behavior: 'smooth' }));
$('#heroUploadBtn').addEventListener('click', () => $('#enviar').scrollIntoView({ behavior: 'smooth' }));
$('#exploreBtn').addEventListener('click', () => $('#biblioteca').scrollIntoView({ behavior: 'smooth' }));
document.querySelectorAll('.nav-btn').forEach((button) => button.addEventListener('click', () => {
  const target = button.dataset.target;
  document.getElementById(target).scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.nav-btn').forEach((item) => item.classList.toggle('active', item === button));
}));
$('#searchInput').addEventListener('input', renderGames);
document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  currentFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
  renderGames();
}));
const dialog = $('#linkDialog');
$('#linkUploadBtn').addEventListener('click', () => dialog.showModal());
$('#linkForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('#linkName').value.trim();
  let parsed;
  try { parsed = new URL($('#linkUrl').value); } catch { toast('Informe uma URL válida.'); return; }
  if (!['http:', 'https:'].includes(parsed.protocol)) { toast('Use um link HTTP ou HTTPS.'); return; }
  dialog.close();
  addGame({ id: id(), name, url: parsed.href, type: 'Link', description: 'Jogo compartilhado por link', color: '#397d70', art: '↗' });
  event.target.reset(); toast(`${name} adicionado à biblioteca.`);
});
$('#fullscreenBtn').addEventListener('click', async () => {
  try { if (!document.fullscreenElement) await gameFrame.requestFullscreen(); else await document.exitFullscreen(); }
  catch { toast('Tela cheia não está disponível neste navegador.'); }
});
$('#closePlayer').addEventListener('click', () => { player.hidden = true; gameFrame.src = 'about:blank'; gameFrame.srcdoc = ''; activeGameId = null; renderGames(); });
window.addEventListener('beforeunload', () => objectUrls.forEach((url) => URL.revokeObjectURL(url)));
renderGames();
