# Builds the self-hosted website from the same game build as the claude.ai artifact.
import os,shutil,re
src='precinct/precinct-9.html';out='site';pub=out+'/public'
game=open(src).read()
shutil.rmtree(out,ignore_errors=True);os.makedirs(pub+'/vendor')
shutil.copy('three/package/build/three.min.js',pub+'/vendor/three.min.js')
shutil.copy('three/package/examples/js/loaders/GLTFLoader.js',pub+'/vendor/GLTFLoader.js')
if os.path.isdir('models'):shutil.copytree('models',pub+'/models')
for f in ['app','auth','firestore','database','functions','app-check']:shutil.copy(f'fb/node_modules/firebase/firebase-{f}-compat.js',pub+f'/vendor/firebase-{f}-compat.js')
for f in ['eko-online.js','firebase-config.js','manifest.webmanifest','icon-192.png','icon-512.png']:shutil.copy('site-src/'+f,pub+'/'+f)
for f in ['firestore.rules','firestore.spark.rules','firestore.indexes.json','database.rules.json','firebase.json','README.md']:shutil.copy('site-src/'+f,out+'/'+f)
os.makedirs(out+'/functions');[shutil.copy('site-src/functions/'+f,out+'/functions/'+f) for f in ['index.js','names.js','package.json']]
shutil.copy('build/politicians.js',out+'/functions/politicians.js')
cdn='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
assert cdn in game;game=game.replace(cdn,'<script src="vendor/three.min.js"></script>')
gl='<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>'
assert gl in game;game=game.replace(gl,'<script src="vendor/GLTFLoader.js"></script>')
game=game.replace('<title>Eko Nights</title>','',1)
online='''<script src="vendor/firebase-app-compat.js"></script><script src="vendor/firebase-auth-compat.js"></script><script src="vendor/firebase-firestore-compat.js"></script><script src="vendor/firebase-database-compat.js"></script><script src="vendor/firebase-functions-compat.js"></script><script src="vendor/firebase-app-check-compat.js"></script>
<script src="firebase-config.js"></script><script src="eko-online.js"></script>
<script>'''
i=game.rindex('<script>');game=game[:i]+online+game[i+8:]
css='<style>#onlineBox .row{gap:8px;flex-wrap:wrap}#onlineBox b{font-size:18px}.contcard.online{border-color:#3b5b8f}</style>'
icon="data:image/svg+xml,"+"%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230b1220'/%3E%3Cpath d='M32 8l20 8v14c0 13-9 22-20 26-11-4-20-13-20-26V16z' fill='%23f4b740'/%3E%3Ctext x='32' y='40' font-size='18' font-family='Arial' font-weight='700' text-anchor='middle' fill='%230b1220'%3EEKO%3C/text%3E%3C/svg%3E"
page=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Eko Nights · Police in Port Eko</title>
<meta name="description" content="A 3D Nigerian police game. Chase Yahoo boys, expose ghost contracts, solve murders and kidnappings, and squad up with other officers in Port Eko.">
<meta name="theme-color" content="#0b1220"><link rel="icon" href="{icon}"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icon-192.png"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black">
{css}
</head><body>
{game}
</body></html>
'''
open(pub+'/index.html','w').write(page)
print('site built',sum(os.path.getsize(os.path.join(d,f)) for d,_,fs in os.walk(pub) for f in fs)//1024,'KB')
