#!/usr/bin/env bash
# Lanza N procesos de Newman en paralelo (1 petición cada uno) contra la Azure Function.
# Uso: ./run-concurrent.sh [CONCURRENCIA=10] [NTH=1000000] [FUNCION=Fibonacci]
set -uo pipefail

N="${1:-10}"
NTH="${2:-1000000}"
FUNCTION_NAME="${3:-Fibonacci}"

DIR="$(cd "$(dirname "$0")" && pwd)"
NEWMAN="$DIR/node_modules/newman/bin/newman.js"
if [[ ! -f "$NEWMAN" ]]; then
  echo "Newman no está instalado. Ejecute primero: (cd \"$DIR\" && npm install)" >&2
  exit 1
fi

OUT="$DIR/results/$(date +%Y%m%d-%H%M%S)-${FUNCTION_NAME}-nth${NTH}-c${N}"
mkdir -p "$OUT"

echo "Enviando $N peticiones concurrentes a /api/$FUNCTION_NAME con nth=$NTH ..."
START=$(date +%s.%N)
for i in $(seq 1 "$N"); do
  (
  node "$NEWMAN" run "$DIR/ARSW_LAB10_FIBONACCI.postman_collection.json" \
    -e "$DIR/ARSW_LAB10.postman_environment.json" \
    --env-var "nth=$NTH" \
    --env-var "FUNCTION_NAME=$FUNCTION_NAME" \
    -r cli,json --reporter-json-export "$OUT/req-$i.json" \
    > "$OUT/req-$i.log" 2>&1
  echo "exit code: $?" >> "$OUT/req-$i.log"
  ) &
done
wait
END=$(date +%s.%N)

if ! ls "$OUT"/req-*.json > /dev/null 2>&1; then
  echo "ERROR: Newman no generó reportes. Revise $OUT/req-1.log:" >&2
  cat "$OUT/req-1.log" >&2
  exit 1
fi

node "$DIR/summarize.js" "$OUT" "$START" "$END" | tee "$OUT/summary.md"
