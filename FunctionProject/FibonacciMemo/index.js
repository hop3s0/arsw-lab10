const os = require('os');

// Caché de memoization a nivel de módulo: vive mientras viva el proceso de la instancia.
// memo[i] = F(i) como BigInt nativo.
const memo = [0n, 1n];
const startedAt = new Date();

function fib(n) {
    if (memo[n] !== undefined) return memo[n];
    const value = fib(n - 1) + fib(n - 2);   // recursión: profundidad = n - (mayor índice ya en caché)
    memo[n] = value;
    return value;
}

module.exports = async function (context, req) {
    const nth = Number((req.body && req.body.nth) ?? req.query.nth);
    const instance = process.env.CONTAINER_NAME || process.env.WEBSITE_INSTANCE_ID || os.hostname();

    if (!Number.isInteger(nth) || nth < 0) {
        context.res = { status: 400, body: { error: 'nth debe ser un entero mayor o igual a 0' } };
        return;
    }

    const cachedBefore = memo.length - 1;    // mayor n ya calculado en esta instancia
    const t0 = process.hrtime.bigint();
    try {
        const answer = fib(nth);
        const durationMs = Number(process.hrtime.bigint() - t0) / 1e6;
        context.log(`FibonacciMemo nth=${nth} cacheBefore=${cachedBefore} durationMs=${durationMs.toFixed(2)} instance=${instance}`);
        context.res = {
            headers: { 'Content-Type': 'application/json' },
            body: {
                nth,
                answer: answer.toString(),
                cacheHit: nth <= cachedBefore,
                cacheBefore: cachedBefore,
                cacheAfter: memo.length - 1,
                durationMs: Number(durationMs.toFixed(2)),
                instance,
                instanceStartedAt: startedAt.toISOString(),
            },
        };
    } catch (err) {
        context.log.error(`FibonacciMemo nth=${nth} cacheBefore=${cachedBefore} error=${err.message}`);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: {
                nth,
                error: `${err.name}: ${err.message}`,
                cacheBefore: cachedBefore,
                cacheAfter: memo.length - 1,
                instance,
                instanceStartedAt: startedAt.toISOString(),
            },
        };
    }
};
