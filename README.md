# World Geography Quiz

A map quiz for kids: US states, capitals and flags, countries, capitals and flags of Europe, Africa, Asia, Oceania, North America and South America, their major mountain ranges, deserts, seas and lakes, and the continents and oceans, plus a World Tour of all 195 countries (or all the mountains, deserts and waters) in one game. It installs as an app on phones, tablets and computers, works offline, and keeps separate scores, streaks and badges for each player on the device.

## Put it on GitHub Pages

1. On github.com, create a new **public** repository, for example `world-geography-quiz`.
2. On the empty repository page, click **uploading an existing file**.
3. Click **choose your files**, select all the files and folders (Ctrl+A on Windows, Cmd+A on Mac), and click **Open**. Then click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, set **Source** to **GitHub Actions**.
5. Go to **Actions**, open **Tests and publish**, and click **Run workflow**. When the tests pass (about 5 minutes), it publishes the game and shows your link: `https://YOUR-USERNAME.github.io/world-geography-quiz/`

## Install it

- **iPhone / iPad (Safari):** open the link, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the link, tap **⋮**, then **Install app**.
- **Computer (Chrome or Edge):** click the install icon at the right end of the address bar.

## Updating

Changes now arrive as pull requests on GitHub. Each one runs the automatic tests (see `tests/README.md`): a green check means they passed, a red X means something broke. Review a pull request, then click **Merge**. The tests run again on main, and only if they all pass is the game published to GitHub Pages, about 5 minutes after merging. If they fail, the site keeps the last good version. Publishing stamps the version (`WGQ_BUILD` in `index.html`) with the time of the last change to the game itself, so devices are offered an update only when the game changed; there's no need to change the stamp by hand.
The app checks for a new version when it opens or comes back on screen (at most once an hour) and shows **A new version is ready** with an **Update** button.

After it's published, GitHub can take a few more minutes before every device sees the new files.

## Scores and backups

Scores are saved only on the device, in the browser's storage for this site. Nothing is sent anywhere.
Removing the app or clearing the browser's site data erases them, so use **⚙ Settings → Save a backup** before switching devices or reinstalling, and **Load a backup** afterward.

## Files

| File or folder | Purpose |
|---|---|
| `index.html` | The page. Its version stamp is filled in when the game is published |
| `sw.js` | Offline support: the list of files saved on the device. It stays at the top level so it can serve the whole game |
| `manifest.webmanifest` | App name, colors and icons for installing |
| `src/` | The game's code, in numbered files (`01-helpers.js` … `18-start.js`, see `src/README.md`), and its look (`app.css`) |
| `data/maps/` | Map shapes: `us.json`, `world.json` and one file per continent (`europe.json`, `africa.json`, …), plus each continent's **Land & Water** places (`europe-geo.json`, …) |
| `data/` | `flags.json` (country flags), `usflags.json` (state flags), `facts.json` (the “Did you know?” fun facts), `thumbs.json` (small map pictures for the home screen) |
| `assets/icons/` | App icons |
| `assets/fonts/` | Fonts, stored locally so the game works offline |
| `tests/` | Automatic tests that run on GitHub (see `tests/README.md`). Not part of the published game |
| `tools/` | Scripts that build the Land & Water maps. Not part of the published game |
| `.github/workflows/` | Runs the tests, and publishes the game when they pass |

When you add a file the game uses, add it to the list in `sw.js` too (a test checks this).

## Credits

Mountain range, sea and lake shapes come from Natural Earth (https://www.naturalearthdata.com), which is in the public domain.

Flag images come from the flag-icons project (https://github.com/lipis/flag-icons), used under the MIT License:

```
The MIT License (MIT)

Copyright (c) 2013 Panayiotis Lipiridis

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## State flag credits

US state flag artwork comes from the [us-state-flags](https://www.npmjs.com/package/us-state-flags) package by Foxsense Innovations, used under the ISC license. The lettering on the California and Illinois flags was redrawn, and the Ohio flag was drawn by hand.

ISC License

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
