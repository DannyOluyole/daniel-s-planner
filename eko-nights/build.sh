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

# artifact/models: the same models for the claude.ai artifact, which can't serve .glb files. Each GLB becomes
# plain glTF JSON with its data embedded (GLTFLoader reads either), saved as .json.
python3 - <<'PY'
import json,struct,base64,os,shutil
shutil.rmtree('artifact',ignore_errors=True)
if os.path.exists('models/manifest.json'):
    os.makedirs('artifact/models')
    man=json.load(open('models/manifest.json'));out={}
    for k,spec in man.items():
        src='models/'+spec['file']
        if not os.path.exists(src):continue
        data=open(src,'rb').read();spec=dict(spec)
        if spec['file'].endswith('.glb'):
            magic,ver,total=struct.unpack_from('<4sII',data,0);assert magic==b'glTF'
            pos=12;gl=None;binc=b''
            while pos<total:
                n,typ=struct.unpack_from('<II',data,pos);chunk=data[pos+8:pos+8+n];pos+=8+n
                if typ==0x4E4F534A:gl=json.loads(chunk.decode().rstrip(' \x00'))
                elif typ==0x004E4942:binc=chunk
            if gl.get('buffers'):gl['buffers'][0]['uri']='data:application/octet-stream;base64,'+base64.b64encode(binc).decode()
            spec['file']=spec['file'][:-4]+'.json';open('artifact/models/'+spec['file'],'w').write(json.dumps(gl,separators=(',',':')))
        else:shutil.copy(src,'artifact/models/'+spec['file'])
        out[k]=spec
    json.dump(out,open('artifact/models/manifest.json','w'),indent=2)
    print('artifact models:',', '.join(out))
PY
echo "Done. Serve site/public to play, or deploy site/ with Firebase (see site/README.md)."
