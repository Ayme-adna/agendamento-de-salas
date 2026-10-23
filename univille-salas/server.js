const express = require('express'), session = require('express-session'), bcrypt = require('bcryptjs');
const { q } = require('./db');
const app = express();
app.use(express.json());
app.use(session({ secret: 'univille-segredo', resave: false, saveUninitialized: false, cookie: { maxAge: 8 * 3600 * 1000 } }));
app.use(express.static('public'));

const auth = (req, res, next) => req.session.uid ? next() : res.status(401).json({ erro: 'Faça login.' });
const hoje = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

// ---------- Usuários ----------
app.post('/api/cadastro', async (req, res) => {
  const { nome, login, senha } = req.body;
  if (!nome || !login || !senha || senha.length < 6) return res.status(400).json({ erro: 'Preencha tudo (senha com 6+ caracteres).' });
  const id = login.trim().toLowerCase();
  if (!(/^\d{6,}$/.test(id) || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(id)))
    return res.status(400).json({ erro: 'Use sua matrícula (só números) ou e-mail institucional.' });
  if ((await q('SELECT 1 x FROM Usuarios WHERE Identificador=@i', { i: id })).length)
    return res.status(409).json({ erro: 'Já existe cadastro com essa matrícula/e-mail.' });
  await q('INSERT INTO Usuarios (Nome,Identificador,SenhaHash) VALUES (@n,@i,@s)', { n: nome.trim(), i: id, s: await bcrypt.hash(senha, 10) });
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { login, senha, manter } = req.body;
  const [u] = await q('SELECT * FROM Usuarios WHERE Identificador=@i', { i: (login || '').trim().toLowerCase() });
  if (!u || !(await bcrypt.compare(senha || '', u.SenhaHash))) return res.status(401).json({ erro: 'Matrícula/e-mail ou senha incorretos.' });
  req.session.uid = u.Id;
  if (manter) req.session.cookie.maxAge = 30 * 24 * 3600 * 1000;
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => req.session.destroy(() => res.json({ ok: true })));

app.get('/api/me', auth, async (req, res) => {
  const [u] = await q('SELECT Nome,Identificador FROM Usuarios WHERE Id=@i', { i: req.session.uid });
  res.json({ nome: u.Nome, identificador: u.Identificador });
});

// ---------- Salas ----------
app.get('/api/salas', auth, async (req, res) => {
  const { data = hoje(), hora = 14, pessoas = 1, busca = '', campus = '', so = '1' } = req.query;
  let l = await q(`SELECT s.*, CASE WHEN EXISTS (SELECT 1 FROM Reservas r WHERE r.SalaId=s.Id AND r.Data=@d AND r.HoraInicio=@h AND r.Status='Confirmada') THEN 0 ELSE 1 END Disponivel
    FROM Salas s WHERE s.Capacidade>=@p AND (@c='' OR s.Campus=@c) AND (@b='' OR s.Codigo+' '+s.Bloco+' '+s.Recursos LIKE '%'+@b+'%')
    ORDER BY s.Capacidade`, { d: data, h: +hora, p: +pessoas, c: campus, b: busca });
  if (so === '1') l = l.filter(s => s.Disponivel);
  res.json(l);
});

app.get('/api/salas/:id', auth, async (req, res) => {
  const [s] = await q('SELECT * FROM Salas WHERE Id=@i', { i: req.params.id });
  s ? res.json(s) : res.status(404).json({ erro: 'Sala não encontrada.' });
});

app.get('/api/salas/:id/disponibilidade', auth, async (req, res) => {
  const l = await q(`SELECT HoraInicio FROM Reservas WHERE SalaId=@s AND Data=@d AND Status='Confirmada'`, { s: req.params.id, d: req.query.data });
  res.json({ ocupados: l.map(r => r.HoraInicio) });
});

// ---------- Reservas ----------
app.post('/api/reservas', auth, async (req, res) => {
  const { salaId, data, hora, pessoas, finalidade } = req.body;
  const [s] = await q('SELECT * FROM Salas WHERE Id=@i', { i: salaId });
  if (!s || ![10, 12, 14, 16].includes(+hora) || !data || data < hoje()) return res.status(400).json({ erro: 'Dados da reserva inválidos.' });
  if (+pessoas < 1 || +pessoas > s.Capacidade) return res.status(400).json({ erro: `A sala comporta até ${s.Capacidade} pessoas.` });
  if ((await q(`SELECT 1 x FROM Reservas WHERE SalaId=@s AND Data=@d AND HoraInicio=@h AND Status='Confirmada'`, { s: salaId, d: data, h: +hora })).length)
    return res.status(409).json({ erro: 'Esse horário acabou de ser reservado por outra pessoa.' });
  if ((await q(`SELECT 1 x FROM Reservas WHERE UsuarioId=@u AND Data=@d AND Status='Confirmada'`, { u: req.session.uid, d: data })).length)
    return res.status(409).json({ erro: 'Você só pode reservar até 2 horas por dia.' });
  const codigo = `UH-${data.slice(0, 4)}-${Math.floor(10000 + Math.random() * 90000)}`;
  await q(`INSERT INTO Reservas (Codigo,UsuarioId,SalaId,Data,HoraInicio,Pessoas,Finalidade) VALUES (@c,@u,@s,@d,@h,@p,@f)`,
    { c: codigo, u: req.session.uid, s: salaId, d: data, h: +hora, p: +pessoas, f: finalidade || '' });
  res.json({ codigo });
});

const SELECT_RES = `SELECT r.Id,r.Codigo,CONVERT(varchar(10),r.Data,23) Data,r.HoraInicio,r.Pessoas,r.Finalidade,r.Status,
  s.Codigo Sala,s.Bloco,s.Andar,s.Campus,s.Capacidade,s.Imagem FROM Reservas r JOIN Salas s ON s.Id=r.SalaId`;

app.get('/api/reservas', auth, async (req, res) =>
  res.json(await q(`${SELECT_RES} WHERE r.UsuarioId=@u ORDER BY r.Data DESC, r.HoraInicio`, { u: req.session.uid })));

app.get('/api/reservas/:codigo', auth, async (req, res) => {
  const [r] = await q(`${SELECT_RES} WHERE r.Codigo=@c AND r.UsuarioId=@u`, { c: req.params.codigo, u: req.session.uid });
  r ? res.json(r) : res.status(404).json({ erro: 'Reserva não encontrada.' });
});

app.delete('/api/reservas/:id', auth, async (req, res) => {
  await q(`UPDATE Reservas SET Status='Cancelada' WHERE Id=@i AND UsuarioId=@u`, { i: req.params.id, u: req.session.uid });
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Site rodando em http://localhost:3000'));
