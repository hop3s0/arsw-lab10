// Invoca FibonacciMemo de forma secuencial con varios valores de n y muestra el estado de la caché.
// Uso: node memo-test.js [n1 n2 ...]   (por defecto: 5000 10000 15000 20000 20000 5000)
const URL = process.env.FUNCTION_URL ||
  'https://fibonacci-arsw-jj-dcd8dmb2hrbygue4.northcentralus-01.azurewebsites.net/api/FibonacciMemo';
const ns = process.argv.slice(2).map(Number);
const values = ns.length ? ns : [5000, 10000, 15000, 20000, 20000, 5000];

(async () => {
  console.log(`Hora local: ${new Date().toLocaleString()}\n`);
  console.log('| nth | HTTP | Resultado | cacheHit | Caché antes → después | Cómputo (ms) | Respuesta (ms) | Instancia | Instancia iniciada |');
  console.log('|---:|:---:|---|:---:|---|---:|---:|---|---|');
  for (const n of values) {
    const t0 = Date.now();
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nth: n }),
    });
    const elapsed = Date.now() - t0;
    let b;
    try { b = await res.json(); } catch { b = {}; }
    const result = b.answer ? `${b.answer.length} dígitos (${b.answer.slice(0, 8)}…)` : (b.error || 'sin cuerpo');
    const inst = b.instance ? b.instance.slice(-12) : '—';
    const started = b.instanceStartedAt ? new Date(b.instanceStartedAt).toLocaleTimeString() : '—';
    console.log(`| ${n} | ${res.status} | ${result} | ${b.cacheHit ?? '—'} | ${b.cacheBefore ?? '—'} → ${b.cacheAfter ?? '—'} | ${b.durationMs ?? '—'} | ${elapsed} | …${inst} | ${started} |`);
  }
})();
