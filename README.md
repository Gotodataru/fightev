# fightev

UFC fight analytics on real data: the next event's card, fighter stats and an ML forecast with an honest accuracy record.

**Live:** https://gotodataru.github.io/fightev/ · add `?lang=en` or `?lang=ru` to pick the language.

## Pages

- **Fights** (`/`) — the card of the next event. Click a fight to open the breakdown: win probability, whether the three models agree, how often each fighter finishes fights, a ten-row tale of the tape, how they win, where they strike, layoff and last five bouts. On phones the breakdown splits into Forecast / Tape / Style tabs.
- **Model accuracy** (`/accuracy`) — every forecast recorded before the fight, checked against the result: model vs the betting favourite vs a coin flip, calibration with 95% intervals, per-event record, and why the finish model is not shown.
- **About** (`/case`) — the case study.

## Design notes

- Green marks the edge (higher probability or better number), never a corner; brightness is a second channel for colour-blind readers.
- Uncertainty is written in words: 51/49 is an "Even fight", newcomers get a "limited data" tag.
- States are designed, not accidental: loading skeleton, no photo, no stats, limited data, finished fight (right / wrong), no upcoming event, load error.
- Motion (panel, portraits, growing bars) is switched off under `prefers-reduced-motion`.

## How it works

The site is static: React 18 + TypeScript + Tailwind, built with Vite and deployed by GitHub Actions to GitHub Pages.
The data in `public/data/` (`fightcard.json`, `trackrecord.json`, face-aligned `photos/*.webp`) is exported from a private model repository after every scheduled model run and after results arrive, then pushed here — each push redeploys the site.

```bash
npm ci
npm run dev      # http://localhost:5173/fightev/
npm run build    # dist/ with per-route index.html for GitHub Pages
```

Fighter statistics come from UFCStats. Fighter photos belong to their respective owners and are used for non-commercial illustration.
