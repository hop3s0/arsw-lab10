// Resume los reportes JSON de Newman generados por run-concurrent.sh
// Uso: node summarize.js <carpeta-resultados> <inicio-epoch-s> <fin-epoch-s>
const fs = require('fs');
const path = require('path');

const [dir, startS, endS] = process.argv.slice(2);
const files = fs.readdirSync(dir).filter(f => /^req-\d+\.json$/.test(f))
  .sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4)));

const rows = files.map(f => {
  const { run } = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const ex = run.executions[0] || {};
  const res = ex.response;
  const err = ex.requestError ? ex.requestError.message || String(ex.requestError) : null;
  return {
    id: f.match(/\d+/)[0],
    code: res ? res.code : '—',
    status: res ? res.status : (err || 'sin respuesta'),
    timeMs: res ? res.responseTime : null,
    bytes: res ? res.responseSize : 0,
    started: run.timings.started,
    failures: run.failures.length,
  };
});

const t0 = Math.min(...rows.map(r => r.started));
const fmt = ms => (ms / 1000).toFixed(2);
const ok = rows.filter(r => r.code === 200 && r.failures === 0);
const times = rows.filter(r => r.timeMs != null).map(r => r.timeMs).sort((a, b) => a - b);
const avg = times.reduce((a, b) => a + b, 0) / (times.length || 1);

console.log(`| # | HTTP | Inicio (s) | Tiempo de respuesta (s) | Fin (s) | Tamaño (bytes) | Tests |`);
console.log(`|---:|:---:|---:|---:|---:|---:|:---:|`);
for (const r of rows) {
  const start = (r.started - t0) / 1000;
  const end = r.timeMs != null ? start + r.timeMs / 1000 : null;
  console.log(`| ${r.id} | ${r.code} ${r.status} | ${start.toFixed(2)} | ${r.timeMs != null ? fmt(r.timeMs) : '—'} | ${end != null ? end.toFixed(2) : '—'} | ${r.bytes} | ${r.failures === 0 ? 'OK' : `${r.failures} fallo(s)`} |`);
}
console.log('');
console.log(`- Peticiones exitosas: **${ok.length}/${rows.length}**`);
if (times.length) {
  console.log(`- Tiempo de respuesta: mín **${fmt(times[0])} s**, promedio **${fmt(avg)} s**, máx **${fmt(times[times.length - 1])} s**`);
}
if (startS && endS) {
  console.log(`- Duración total de la prueba (reloj): **${(parseFloat(endS) - parseFloat(startS)).toFixed(2)} s**`);
}
