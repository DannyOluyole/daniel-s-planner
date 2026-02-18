# Personalized Fitness System (MVP)

A lightweight, self-contained **personalized fitness system** that:

- Collects your **profile + goals**
- Generates a **weekly training plan** and **nutrition targets** (rules-based)
- Lets you **log workouts** and **body metrics**
- Shows simple **progress charts**
- Stores data locally in your browser (`localStorage`) with **export/import** backups

## Run it locally

Because the app uses browser scripts, run it from a local server:

```bash
cd /workspace
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Tests

The planning logic lives in `engine.js` and is testable in Node:

```bash
cd /workspace
node --test
```

## Project structure

- `index.html`: SPA layout (Profile / Plan / Log / Progress / Settings)
- `styles.css`: UI styling
- `engine.js`: rules engine (BMR/TDEE, macros, training split)
- `app.js`: state + UI rendering + logs + charts
- `test/engine.test.js`: Node tests for `engine.js`

## Notes & disclaimer

- This MVP is **educational** and uses conservative heuristics (not medical advice).
- If you have pain, injuries, or a medical condition, consult a qualified professional.

