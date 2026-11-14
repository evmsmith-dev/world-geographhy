# The game's code

Plain JavaScript, no libraries and no build step: `index.html` loads these files in number order, and that's all.

| File | What's in it |
|---|---|
| `01-helpers.js` | Small helpers used everywhere: `$`, `esc`, `shuffle`, the saved-settings store (`LS`), toasts |
| `02-topics.js` | What can be learned: the topics, capitals, pronunciations (`SAY`), Land & Water names, mix-up tips (`LOOKALIKES`) |
| `03-storage.js` | Saving progress on the device (IndexedDB, with an in-memory fallback) |
| `04-screens.js` | Moving between screens, the back button, panels and dialogs |
| `05-sound.js` | Sounds, speech ("Say it") and confetti |
| `06-players.js` | Players: making, picking and editing them |
| `07-home.js` | The home screen and the place screen (tabs and ways to play) |
| `08-map.js` | Loading and drawing maps, zooming, dragging, tapping and search |
| `09-game.js` | Playing: Test, Practice and Review, answers and scores |
| `10-find-it.js` | Find it: the game names a place and the player taps it |
| `11-easy-answers.js` | Easy answers: pick from 4 instead of typing |
| `12-flashcards.js` | Flashcards (Learn) |
| `13-scores.js` | The Scores screen |
| `14-explore.js` | Explore: tap anything on the map to learn about it |
| `15-daily.js` | The Daily 10, streaks and badges |
| `16-world-tour.js` | The World Tour: every country, or every Land & Water place, in one game on the continent maps |
| `17-settings.js` | Settings, How to play, and backups |
| `18-start.js` | Updates and start-up. It runs last and starts the game |
| `app.css` | The look |

## How the files work together

The files share one set of names: a `const` or `function` at the top of one file can be used in any other. Two rules
keep that working:

- **Code that runs right away can only use names from its own file or earlier files.** Most code runs later (when the
  player taps something), and that can use anything. The game starts at the end of `18-start.js`, when every file
  has loaded.
- **Every top-level name must be unique across all the files.** Using the same name twice stops the game from loading;
  the automatic tests catch it.

## Adding a file

1. Give it a number for where it belongs in the order.
2. Add a `<script src="src/NN-name.js" defer></script>` line to `index.html`, in order.
3. Add it to the list in `sw.js`, and change the `CACHE` version there so devices pick it up. (A test checks the list.)
