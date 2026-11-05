const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const root = __dirname;
const dataRoot = path.join(root, 'data');
const uploadsRoot = path.join(dataRoot, 'uploads');
const databaseFile = path.join(dataRoot, 'games.json');
const port = Number(process.env.PORT) || 8000;
const maxGameBytes = 100 * 1024 * 1024;
const maxLogoBytes = 5 * 1024 * 1024;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.zip': 'application/zip',
};
const imageExtensions = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg' };
let databaseQueue = Promise.resolve();

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function readDatabase() {
  try {
    return JSON.parse((await fsp.readFile(databaseFile, 'utf8')).replace(/^\uFEFF/, ''));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function updateDatabase(update) {
  const operation = databaseQueue.then(async () => {
    const records = await readDatabase();
    const result = await update(records);
    await fsp.mkdir(dataRoot, { recursive: true });
    const temporaryFile = `${databaseFile}.${randomUUID()}.tmp`;
    await fsp.writeFile(temporaryFile, JSON.stringify(records, null, 2), 'utf8');
    await fsp.rename(temporaryFile, databaseFile);
    return result;
  });
  databaseQueue = operation.catch(() => {});
  return operation;
}

async function readBody(request, limit) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) throw httpError(413, `O limite é ${Math.round(limit / (1024 * 1024))} MB.`);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, size);
}

function publicRecord(record) {
  return {
    id: record.id,
    name: record.name,
    description: record.description,
    category: record.category,
    type: record.type,
    platform: record.platform,
    url: record.url,
    fileName: record.fileName,
    createdAt: record.createdAt,
    ...(record.type !== 'Link' ? { fileUrl: `/api/games/${record.id}/file` } : {}),
    ...(record.logoFile ? { logo: `/api/games/${record.id}/logo` } : {}),
  };
}

async function getRecord(id) {
  const records = await readDatabase();
  return records.find((record) => record.id === id);
}

async function serveStoredFile(request, response, record, kind) {
  if (!record || !record.published) return json(response, 404, { error: 'Jogo não encontrado.' });
  let filePath;
  if (kind === 'logo') {
    if (!record.logoFile) return json(response, 404, { error: 'Logo não encontrada.' });
    filePath = path.join(uploadsRoot, `${record.id}${record.logoFile}`);
  } else {
    if (record.type === 'Link' || !record.fileName) return json(response, 404, { error: 'Arquivo não encontrado.' });
    filePath = path.join(uploadsRoot, `${record.id}${path.extname(record.fileName).toLowerCase()}`);
  }
  try {
    const stat = await fsp.stat(filePath);
    response.writeHead(200, {
      'Content-Type': kind === 'logo' ? (mimeTypes[record.logoFile] || 'application/octet-stream') : (mimeTypes[path.extname(record.fileName).toLowerCase()] || 'application/octet-stream'),
      'Content-Length': stat.size,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': kind === 'file' ? `inline; filename="${path.basename(record.fileName).replace(/["\r\n]/g, '')}"` : 'inline',
    });
    if (request.method === 'HEAD') return response.end();
    fs.createReadStream(filePath).pipe(response);
  } catch (error) {
    if (error.code === 'ENOENT') return json(response, 404, { error: 'Arquivo não encontrado.' });
    throw error;
  }
}

async function handleApi(request, response, url) {
  const pathname = url.pathname;
  if (pathname === '/api/games' && request.method === 'GET') {
    await databaseQueue;
    const records = await readDatabase();
    return json(response, 200, records.filter((record) => record.published).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(publicRecord));
  }

  if (pathname === '/api/games' && request.method === 'POST') {
    const body = await readBody(request, 64 * 1024);
    let input;
    try { input = JSON.parse(body.toString('utf8')); } catch { throw httpError(400, 'Dados do jogo inválidos.'); }
    const name = String(input.name || '').trim();
    const type = String(input.type || '').toUpperCase();
    if (!name || name.length > 80) throw httpError(400, 'O nome precisa ter entre 1 e 80 caracteres.');
    if (!['HTML', 'ZIP', 'LINK'].includes(type)) throw httpError(400, 'Tipo de jogo inválido.');
    const record = {
      id: randomUUID(), name,
      description: String(input.description || 'Jogo enviado pela comunidade.').slice(0, 500),
      category: 'Comunidade', type: type === 'LINK' ? 'Link' : type,
      platform: type === 'ZIP' ? 'Pacote ZIP' : type === 'HTML' ? 'Jogo HTML' : 'Link externo',
      createdAt: new Date().toISOString(), published: false,
    };
    if (record.type === 'Link') {
      let target;
      try { target = new URL(String(input.url || '')); } catch { throw httpError(400, 'URL inválida.'); }
      if (!['http:', 'https:'].includes(target.protocol)) throw httpError(400, 'A URL precisa usar HTTP ou HTTPS.');
      record.url = target.href;
    } else {
      const fileName = path.basename(String(input.fileName || ''));
      const extension = path.extname(fileName).toLowerCase();
      if ((record.type === 'ZIP' && extension !== '.zip') || (record.type === 'HTML' && !['.html', '.htm'].includes(extension))) throw httpError(400, 'Extensão de arquivo incompatível.');
      record.fileName = fileName;
    }
    await fsp.mkdir(uploadsRoot, { recursive: true });
    await updateDatabase((records) => records.push(record));
    return json(response, 201, { id: record.id });
  }

  const gameRoute = pathname.match(/^\/api\/games\/([a-f0-9-]+)$/i);
  if (gameRoute && request.method === 'DELETE') {
    const [, id] = gameRoute;
    await updateDatabase((records) => {
      const index = records.findIndex((record) => record.id === id);
      if (index >= 0) records.splice(index, 1);
    });
    for (const entry of await fsp.readdir(uploadsRoot).catch(() => [])) {
      if (entry.startsWith(`${id}.`)) await fsp.rm(path.join(uploadsRoot, entry), { force: true });
    }
    return json(response, 200, { ok: true });
  }

  const fileRoute = pathname.match(/^\/api\/games\/([a-f0-9-]+)\/(file|logo)$/i);
  if (fileRoute && ['GET', 'HEAD'].includes(request.method)) {
    const record = await getRecord(fileRoute[1]);
    return serveStoredFile(request, response, record, fileRoute[2]);
  }

  const actionRoute = pathname.match(/^\/api\/games\/([a-f0-9-]+)\/(file|logo|publish)$/i);
  if (actionRoute && request.method === 'PUT' && actionRoute[2] === 'file') {
    const [, id] = actionRoute;
    const record = await getRecord(id);
    if (!record || record.published || record.type === 'Link') throw httpError(404, 'Envio não encontrado.');
    const extension = path.extname(record.fileName).toLowerCase();
    const body = await readBody(request, maxGameBytes);
    if (!body.length) throw httpError(400, 'O arquivo está vazio.');
    await fsp.writeFile(path.join(uploadsRoot, `${id}${extension}`), body);
    return json(response, 200, { ok: true });
  }

  if (actionRoute && request.method === 'PUT' && actionRoute[2] === 'logo') {
    const [, id] = actionRoute;
    const record = await getRecord(id);
    if (!record || record.published) throw httpError(404, 'Envio não encontrado.');
    const contentType = String(request.headers['content-type'] || '').split(';')[0].toLowerCase();
    const extension = imageExtensions[contentType];
    if (!extension) throw httpError(415, 'Formato de logo não suportado.');
    const body = await readBody(request, maxLogoBytes);
    if (!body.length) throw httpError(400, 'A logo está vazia.');
    await fsp.writeFile(path.join(uploadsRoot, `${id}${extension}`), body);
    await updateDatabase((records) => {
      const stored = records.find((item) => item.id === id);
      stored.logoFile = extension;
    });
    return json(response, 200, { ok: true });
  }

  if (actionRoute && request.method === 'POST' && actionRoute[2] === 'publish') {
    const [, id] = actionRoute;
    const record = await getRecord(id);
    if (!record) throw httpError(404, 'Envio não encontrado.');
    if (record.type !== 'Link') {
      try { await fsp.access(path.join(uploadsRoot, `${id}${path.extname(record.fileName).toLowerCase()}`)); }
      catch { throw httpError(400, 'O arquivo do jogo ainda não foi enviado.'); }
    }
    await updateDatabase((records) => { records.find((item) => item.id === id).published = true; });
    return json(response, 201, publicRecord(await getRecord(id)));
  }

  return json(response, 404, { error: 'Rota da API não encontrada.' });
}

async function handleRequest(request, response) {
  let url;
  try { url = new URL(request.url, 'http://localhost'); }
  catch { response.writeHead(400).end('URL inválida'); return; }

  if (url.pathname.startsWith('/api/')) {
    try { await handleApi(request, response, url); }
    catch (error) { json(response, error.status || 500, { error: error.message || 'Erro interno.' }); }
    return;
  }

  let pathname;
  try { pathname = decodeURIComponent(url.pathname); }
  catch { response.writeHead(400).end('URL inválida'); return; }
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) { response.writeHead(403).end('Acesso negado'); return; }
  if (path.relative(root, filePath).split(path.sep)[0].toLowerCase() === 'data') { response.writeHead(404).end('Arquivo não encontrado'); return; }
  try {
    const stats = await fsp.stat(filePath);
    const resolvedPath = stats.isDirectory() ? path.join(filePath, 'index.html') : filePath;
    const content = await fsp.readFile(resolvedPath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[path.extname(resolvedPath).toLowerCase()] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': /\.(html?|css|js)$/i.test(resolvedPath) ? 'no-cache' : 'public, max-age=3600',
    });
    response.end(content);
  } catch (error) {
    response.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(error.code === 'ENOENT' ? 'Arquivo não encontrado' : 'Erro ao ler arquivo');
  }
}

http.createServer(handleRequest).listen(port, '127.0.0.1', () => {
  console.log(`Playroom disponível em http://localhost:${port}`);
  console.log(`Banco de jogos local: ${databaseFile}`);
  console.log('Pressione Ctrl+C para encerrar.');
});
