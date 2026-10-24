#!/usr/bin/env bash
# Starts the Firebase emulators for the online tests (run ./build.sh first).
#   ./emulators.sh          verified-mode rules: t14, t14d, t14e, t17
#   ./emulators.sh spark    free-plan rules:     t10, t12
# Needs Java 11+ and firebase-tools (npm i -g firebase-tools). Ctrl+C to stop.
set -euo pipefail
cd "$(dirname "$0")/site"
[[ -d functions/node_modules ]] || (cd functions && npm install --no-audit --no-fund)

# The Firebase CLI loads database rules over HTTP through HTTPS_PROXY when one is
# set, which fails behind a proxy. So start without them and load them with curl.
python3 - "${1:-}" <<'PY'
import json,sys
c=json.load(open('firebase.json'));c.pop('database',None)
if sys.argv[1]=='spark':c['firestore']['rules']='firestore.spark.rules'
json.dump(c,open('firebase.emulators.json','w'),indent=2)
PY

firebase emulators:start --only auth,firestore,database,functions --project demo-eko --config firebase.emulators.json &
EMU=$!
trap 'kill $EMU 2>/dev/null' EXIT INT TERM
until curl -s -o /dev/null http://127.0.0.1:9000/.json; do sleep 1; done
curl -sS -X PUT "http://127.0.0.1:9000/.settings/rules.json?ns=demo-eko-default-rtdb" \
  -H "Authorization: Bearer owner" --data-binary @database.rules.json >/dev/null
echo "Database rules loaded."
wait $EMU
