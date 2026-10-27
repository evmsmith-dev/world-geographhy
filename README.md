# World Geography Quiz

A map quiz for kids: US states, capitals and flags, countries, capitals and flags of Europe, Africa, Asia, Oceania, North America and South America, and the continents and oceans. It installs as an app on phones, tablets and computers, works offline, and keeps separate scores, streaks and badges for each player on the device.

## Put it on GitHub Pages

1. On github.com, create a new **public** repository, for example `world-geography-quiz`.
2. On the empty repository page, click **uploading an existing file**.
3. Click **choose your files**, select **all 29 files** (Ctrl+A on Windows, Cmd+A on Mac), and click **Open**. Then click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, set **Source** to *Deploy from a branch*, choose **main** and **/ (root)**, and click **Save**.
5. After a minute or two the page shows your link: `https://YOUR-USERNAME.github.io/world-geography-quiz/`

## Install it

- **iPhone / iPad (Safari):** open the link, tap **Share**, then **Add to Home Screen**.
- **Android (Chrome):** open the link, tap **⋮**, then **Install app**.
- **Computer (Chrome or Edge):** click the install icon at the right end of the address bar.

## Updating

Upload **all the files** from the new version, replacing the old ones. Each release has its own version stamp.
The app checks for a new version when it opens or comes back on screen (at most once an hour) and shows **A new version is ready** with an **Update** button.
If your repository still has `camerica.json` from an older version, you can delete it. North America replaced it.

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
| `us.json`, `world.json`, `europe.json`, `africa.json`, `asia.json`, `oceania.json`, `namerica.json`, `samerica.json` | Map shapes for the US, the world, Europe, Africa, Asia, Oceania, North America and South America |
| `flags.json` | Flags of the countries in Europe, Africa, Asia, Oceania, North America and South America |
| `usflags.json` | Flags of the 50 US states |
| `facts.json` | The “Did you know?” fun facts shown in Explore |
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

## State flag credits

US state flag artwork comes from the [us-state-flags](https://www.npmjs.com/package/us-state-flags) package by Foxsense Innovations, used under the ISC license. The lettering on the California and Illinois flags was redrawn, and the Ohio flag was drawn by hand.

ISC License

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
