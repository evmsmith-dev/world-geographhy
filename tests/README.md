# Automatic tests

These tests play the game the way a kid would, on a phone and on an iPad, and check the game's data. They run on GitHub
on every pull request (see `.github/workflows/tests.yml`). A green check on the pull request means everything passed; a
red X means something broke. Click **Details** next to it to see which test failed and why.

The game itself doesn't use anything in this folder.

## What they check

| File | What it checks |
|---|---|
| `data.spec.js` | The game's lists agree with each other and with its files: every place has a fun fact and every fun fact has a place, every topic's count matches its map, every flag game has every flag, mix-up tips and pronunciations name real places, the offline list in `sw.js` has every file, all JSON is valid. |
| `tap-everything.spec.js` | A whole game of Find it on every map, answered by tapping with a finger, so every place can be tapped (zooming in where a kid would have to). A few questions of each Capitals and Flags game. |
| `modes.spec.js` | Test (and its Master badge), Practice with mix-up tips, flashcards, Explore, the Daily 10 (including Land & Water questions and same-kind choices), Up next, Scores and How to play. |
| `saved.spec.js` | Progress survives closing the game; a backup made by an older version still loads with every player, score and badge; a backup saved now loads on another device; old Central America progress moves to North America. |
| `layout.spec.js` | Tabs aren't cut off, the place screen is centered, the zoom buttons don't cover the map, and the game fits on the screen without scrolling. |
| `offline.spec.js` | After one visit, the game opens and plays with no internet. |
| `upgrade.spec.js` | A device with an older version (from before the files moved into folders) updates to this one when the kid presses Update, keeps its progress, and still works offline. It reads the old version from the git history. |

"Phone" is a Galaxy-sized screen in Chromium (the engine in Chrome and Samsung Internet). "iPad" is an iPad (7th
generation) in WebKit (the engine in Safari).

## The test hook

The tests read the game's data through `window.WGQ_TEST`, which `src/17-start.js` creates only when the page is opened with
`?test` in the address. Players never see it. When the code is reorganized, keep `WGQ_TEST` working with the same names.

## The old backup file

`fixtures/backup-2026-11.json` is a backup saved by the game in November 2026 (two players, Ama and Kofi, with some
progress and a badge). It stands for kids' real saved data, so don't remake it: if a change to the game breaks loading
it, the change needs fixing, not the file.

## Running them on a computer

You need Node.js and Python 3.

```
cd tests
npm ci
npx playwright install chromium webkit
npx playwright test
```

`npx playwright test --project=phone` runs only the phone tests; `npx playwright test layout` runs only `layout.spec.js`.
If WebKit can't be installed, `CHROMIUM_ONLY=1 npx playwright test` runs the iPad tests in Chromium instead.
