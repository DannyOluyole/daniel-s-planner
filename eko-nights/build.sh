#!/usr/bin/env bash
# One-command build: fetches the libraries the build needs, assembles the game
# and writes the deployable website to site/.
#   ./build.sh            build
#   ./build.sh --clean    delete downloaded libraries and build output first
set -euo pipefail
cd "$(dirname "$0")"

if [[ "${1:-}" == "--clean" ]]; then rm -rf three fb precinct site; fi

# three.js r128 (the version the game's CDN tags point at)
if [[ ! -f three/package/build/three.min.js ]]; then
  echo "Fetching three.js r128..."
  mkdir -p three
  (cd three && npm pack three@0.128.0 --silent >/dev/null && tar xzf three-0.128.0.tgz && rm three-0.128.0.tgz)
fi

# Firebase web SDK (compat builds, served from your own domain)
if [[ ! -f fb/node_modules/firebase/firebase-app-compat.js ]]; then
  echo "Fetching Firebase SDK..."
  mkdir -p fb
  (cd fb && [[ -f package.json ]] || npm init -y >/dev/null; npm install firebase@11 --silent --no-audit --no-fund)
fi

mkdir -p precinct
python3 assemble2.py     # v2.html + build/*.js -> precinct/precinct-9.html
python3 build_site.py    # precinct-9.html + site-src/ -> site/
# wrapped.html: the game in a full page, as the claude.ai artifact host serves it (used by the
# file:// tests). three.js comes from the local copy so it works offline.
python3 - <<'PY'
g=open('precinct/precinct-9.html').read()
g=g.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','three/package/build/three.min.js')
g=g.replace('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js','three/package/examples/js/loaders/GLTFLoader.js')
open('wrapped.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+g+'</body></html>')
PY
echo "Done. Serve site/public to play, or deploy site/ with Firebase (see site/README.md)."
