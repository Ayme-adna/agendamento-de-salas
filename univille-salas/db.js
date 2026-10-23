const sql = require('mssql/msnodesqlv8');

const SERVIDOR = '.';

const config = {
  connectionString: `Driver={SQL Server};Server=${SERVIDOR};Database=UnivilleSalas;Trusted_Connection=Yes;`
};

const pool = new sql.ConnectionPool(config);
const pronto = pool.connect().then(() => console.log('Banco de dados conectado!')).catch(e => {
  console.error('\n*** ERRO AO CONECTAR NO SQL SERVER ***\n' + e.message + '\nConfira o nome do servidor no db.js e se o banco UnivilleSalas foi criado.\n');
});

async function q(texto, params = {}) {
  await pronto;
  const r = pool.request();
  for (const k in params) r.input(k, params[k]);
  return (await r.query(texto)).recordset;
}
module.exports = { q };
