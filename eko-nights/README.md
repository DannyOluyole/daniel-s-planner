# Eko Nights: source

A 3D Nigerian police game that runs in the browser (three.js), with optional online play on Firebase.

## Build

Needs Node.js 22+, npm and Python 3.

```bash
./build.sh            # fetch libraries, assemble the game, build the website
./build.sh --clean    # same, from scratch
```

The first run downloads three.js r128 into `three/` and the Firebase web SDK into `fb/`. Then it:

1. `assemble2.py`: `v2.html` + `build/*.js` → `precinct/precinct-9.html` (the game as one page, as used for the claude.ai artifact)
2. `build_site.py`: `precinct-9.html` + `site-src/` → `site/` (the self-hosted website, with three.js and Firebase served from `vendor/`)
3. writes `wrapped.html`, the game in a full page with local three.js, for the `file://` tests
4. writes `artifact/models/`: the models converted for the claude.ai artifact, which can't serve `.glb` files (each becomes glTF JSON with its data embedded)

To update the claude.ai artifact, publish `precinct/precinct-9.html` with `artifact/models/*` as supporting files at `models/...`.

To play, serve `site/public` with any static server, e.g. `npx serve site/public` or `python3 -m http.server -d site/public`, and open it in a browser. To deploy, follow `site/README.md` (written from `site-src/README.md`).

`three/`, `fb/`, `precinct/`, `site/`, `artifact/` and `wrapped.html` are build output and are not committed. Rebuild after changing `models/`.

## Source layout

| Path | What it is |
| --- | --- |
| `v2.html` | the base game; `assemble2.py` takes sections of it and patches them |
| `build/` | game modules: world, simulation, combat, story, cases, online, audio, touch controls, perf, etc. |
| `site-src/` | website files: Firebase config, online client, rules, Cloud Functions, manifest, icons |
| `models/` | 3D models that replace the built-in shapes, listed in `models/manifest.json` (copied into the site by the build) |
| `tools/make-models.js` | builds the low-poly vehicle models in `models/`: police cruiser, sedan, hatchback, minivan, pickup, SUV, danfo, keke and okada (400–1,400 triangles each), plus a line-up render: `node tools/make-models.js [names]`. Body panels use a material named `paint`, which the game repaints in each vehicle's own colour |
| `t*.js` | Playwright browser tests |

## Tests

Run from this folder after `./build.sh`, e.g. `node t19.js`. Each prints `PASS`/`FAIL` lines or a summary and exits non-zero on failure. They need Playwright (`npm i -D playwright`); the scripts load it from `/opt/node-tools/node_modules/playwright` and Chromium from `/opt/pw-browsers/chromium`, so edit those two paths if yours are elsewhere.

- **Offline:** need only the build.

  | Test | What it plays through |
  | --- | --- |
  | `t3` | street work: traffic stop, robbery case (witness, CCTV, bank records, arrest, interview, raid), car and foot chases, kidnap rescue, phone layout |
  | `t4` | creating an officer, chapter 1 traffic duty with a refused and a taken bribe, danfos and okadas |
  | `t5` | the claude.ai artifact build (`wrapped.html`) loads |
  | `t6` | the whole seven-chapter story, to the ending screen |
  | `t7` | the corrupt path through the story, to the "Part of the System" ending |
  | `t8` | a homicide case with a reload in the middle |
  | `t9` | squads on the artifact build, with its storage API mocked |
  | `t26` | case scores and grades, the Daily Case (same case for everyone, one ranked attempt a day) and its leaderboard, on the artifact build with its storage mocked |
  | `t11`, `t13l`, `t15`, `t16`, `t18`–`t25` | phone controls, performance, combat, case guidance, the city, 3D models, and more |

- **Online:** need the Firebase emulators (Java 11+ and `npm i -g firebase-tools`). Start them in a second terminal, wait for "All emulators ready", then run the tests:

  ```bash
  ./emulators.sh          # verified-mode rules, for t14, t14d, t14e, t17, t27 (the Daily Case scored by the server)
  ./emulators.sh spark    # free-plan rules, for t10, t12
  ```

  The script installs the Cloud Functions dependencies on first run and loads the database rules itself, because behind an HTTPS proxy the Firebase CLI's own rules upload fails with `Unable to parse JSON ... "request bl"`.
