# World Geography Quiz

A map quiz for kids: US states and capitals, countries, capitals and flags of Europe, Africa, Asia, Oceania, Central America and South America, and the continents and oceans. It installs as an app on phones, tablets and computers, works offline, and keeps separate scores, streaks and badges for each player on the device.

## Put it on GitHub Pages

1. On github.com, create a new **public** repository, for example `world-geography-quiz`.
2. On the empty repository page, click **uploading an existing file**.
3. Click **choose your files**, select **all 27 files** (Ctrl+A on Windows, Cmd+A on Mac), and click **Open**. Then click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, set **Source** to *Deploy from a branch*, choose **main** and **/ (root)**, and click **Save**.
5. After a minute or two the page shows your link: `https://YOUR-USERNAME.github.io/world-geography-quiz/`

## Install it

- **iPhone / iPad (Safari):** open the link, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the link, tap **⋮**, then **Install app**.
- **Computer (Chrome or Edge):** click the install icon at the right end of the address bar.

## Updating

Upload **all the files** from the new version, replacing the old ones. Each release has its own version stamp.
The app checks for a new version when it opens or comes back on screen (at most once an hour) and shows **A new version is ready** with an **Update** button.
GitHub can take up to about 10 minutes after an upload before the new files are live.

## Scores and backups

Scores are saved only on the device, in the browser's storage for this site. Nothing is sent anywhere.
Removing the app or clearing the browser's site data erases them, so use **⚙ Settings → Save a backup** before switching devices or reinstalling, and **Load a backup** afterward.

## Files

| File | Purpose |
|---|---|
| `index.html` | The page, with the version stamp |
| `app.js` | The game |
| `app.css` | The look |
| `us.json`, `world.json`, `europe.json`, `africa.json`, `asia.json`, `oceania.json`, `camerica.json`, `samerica.json` | Map shapes for the US, the world, Europe, Africa, Asia, Oceania, Central America and South America |
| `flags.json` | Flags of the countries in Europe, Africa, Asia, Oceania, Central America and South America |
| `thumbs.json` | Small map pictures for the home screen |
| `manifest.webmanifest` | App name, colors and icons for installing |
| `sw.js` | Offline support |
| `icon*.png`, `icon.svg`, `apple-touch-icon.png`, `favicon-32.png` | App icons |
| `*.woff2` | Fonts, stored locally so it works offline |

## Credits

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
