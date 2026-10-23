const qs = new URLSearchParams(location.search);
const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const dataLonga = d => new Date(d + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

async function api(url, opt = {}) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opt, body: opt.body ? JSON.stringify(opt.body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401 && !url.includes('login')) { location = '/'; throw d; }
  if (!r.ok) throw d;
  return d;
}

async function header(ativo) {
  const u = await api('/api/me');
  document.body.insertAdjacentHTML('afterbegin', `<header><span class="logo"><b>univille</b></span>
  <nav><a href="/salas.html" class="${ativo == 'b' ? 'on' : ''}">Buscar salas</a><a href="/minhas-reservas.html" class="${ativo == 'm' ? 'on' : ''}">Minhas reservas</a><a href="#" onclick="alert('Dúvidas? Procure a recepção da biblioteca.')">Ajuda</a></nav>
  <div style="text-align:right"><b>${u.nome}</b><br><small>Estudante • ${u.identificador}</small> · <a href="#" onclick="sair()">Sair</a></div></header>`);
  return u;
}

async function sair() { await api('/api/logout', { method: 'POST' }); location = '/'; }
