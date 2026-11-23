# Setting up Firebase for Race a friend

**Race a friend** needs a free Firebase project. Until it has one, the game works exactly as before and
Race a friend doesn't show up anywhere. Setting it up takes about 10 minutes and needs no payment card: the free
**Spark** plan allows 100 connections at once, which is about 50 races at the same time.

Use a **new project** for this game, not Chess Quest's. A Firebase project has only one set of database rules, so
sharing one would mean merging the two games' rules (and a mistake could break chess), and the 100 connections
would be shared between both games.

## 1. Create the project

1. Go to <https://console.firebase.google.com> and sign in with your Google account.
2. Click **Create a project** (or **Add project**) and name it, for example `world-geography-quiz`.
3. When it asks about **Google Analytics**, turn it **off**. The game doesn't use analytics, and leaving it off keeps
   children's data out of tracking.
4. Click **Create project**, then **Continue**.

## 2. Turn on anonymous sign-in

1. In the left menu: **Security → Authentication → Get started**. (Firebase moves its menu around from time to time.
   If you can't find something, type its name in the search box at the top of the console, or open **All products**.)
2. On the **Sign-in method** tab, choose **Anonymous**, switch it on, and **Save**.

Players never see a sign-in: each device gets a random player number in the background.

## 3. Create the database

1. Open **Realtime Database** and click **Create database**. Make sure it's *Realtime Database*, not *Firestore*.
2. Pick the location nearest your players (for the US: `us-central1`), then **Next**.
3. Choose **Start in locked mode** and click **Enable**.
4. Open the **Rules** tab, delete everything there, paste the whole contents of
   [`database.rules.json`](../database.rules.json) from this repo, and click **Publish**.

The rules let only the two players of a race change it, only in the ways the game does (a player can only take an
empty seat, write their own time once per place, and so on), and let anyone delete a race once it's past its time.
Without them the database refuses everything.

## 4. Register the web app and copy its settings

1. Click the gear ⚙️ next to **Project overview → Project settings**.
2. Under **Your apps**, click the web icon **</>**.
3. Give it a nickname (`World Geography Quiz`). Leave **Firebase Hosting** unticked. Click **Register app**.
4. Firebase shows a `firebaseConfig = { … }` block. It must include a `databaseURL` line (it will, if you created the
   database first). Copy the whole block.
5. Put it in [`src/20-race.js`](../src/20-race.js) as `const RACE_FIREBASE = { … };` (in place of `null`), or paste it
   to Claude to do. These values are safe to publish: they only name the project. The database rules protect it.

## 5. Allow your site's address

1. **Security → Authentication → Settings → Authorized domains → Add domain**.
2. Add `evmsmith-dev.github.io`.

Merge the change. Once GitHub Pages has published it, **🏁 Race a friend** shows up on the home screen and on the
Countries, States, Flags and Continents & Oceans tabs.

## 6. App Check (recommended)

App Check makes Firebase accept requests only from the real game, not from scripts that copied the settings above.
Players never see it: reCAPTCHA checks quietly in the background.

**Order matters:** turn on *enforcement* last. If you enforce before the game sends App Check tokens, racing stops
working.

1. **Make a reCAPTCHA key.** Open <https://console.cloud.google.com/security/recaptcha> and pick the same project at
   the top. If asked, enable the reCAPTCHA Enterprise API. Click **Create key**: type *Website*, name
   `World Geography Quiz`, domain `evmsmith-dev.github.io`. Leave **Use checkbox challenge** off. Create it and copy
   the **key ID** (a long string starting with `6L`).
2. **Register the app with App Check.** In the Firebase console: **Security → App Check → Apps**. Choose the web app,
   pick **reCAPTCHA Enterprise**, paste the key ID, and save.
3. **Put the key in the game.** In [`src/20-race.js`](../src/20-race.js) set `const RACE_APP_CHECK_KEY = "6L…";`.
   Merge, and wait for it to be published.
4. **Check it's working.** Race once, then look at **App Check → APIs → Realtime Database**. After a few hours the
   chart should show almost all requests as **Verified**.
5. **Enforce.** On that page, click **Enforce** for **Realtime Database**. Wait a few days after step 3 so most
   devices have pressed **Update**; until they do, they'd see "Couldn't connect".

If the Google Cloud console insists on a billing account for the Enterprise key, use classic **reCAPTCHA v3**
instead: create a v3 key at <https://www.google.com/recaptcha/admin/create> (domain `evmsmith-dev.github.io`), choose
**reCAPTCHA** (not Enterprise) in step 2 and paste the *secret key* there, and in step 3 set `RACE_APP_CHECK_KEY` to
the *site key* and `RACE_APP_CHECK_PROVIDER = "v3"`.

## Good to know

- **What's sent:** a race holds the topic, the 10 places, each player's avatar *number* (one of the game's 12
  animals), their head start, and for each place whether they found it, how many tries and how long it took. No
  names (players' names never leave the device), no chat, no free text.
- **Clean-up:** a race that hasn't started is over after 30 minutes; a started one is deleted a day later. Either
  player can cancel a race any time before it starts (**Cancel race**, or ← in the lobby). The game deletes old races
  whenever someone races.
- **Changing the rules later:** paste the new `database.rules.json` into the **Rules** tab again whenever an update
  says the rules changed. The times in the rules (20 seconds a place, 30 minutes before the start, a day after) match
  `RACE_TIMES` in `src/20-race.js`: change them together.
- **Trust:** each device times its own player, from when the place appears on its screen to the right tap, so a slow
  connection doesn't lose a race. The times come from the players' devices, which is fine for friends and family but
  not for prizes or rankings.
- **Updating Firebase:** the game keeps the parts of Firebase it uses in `src/vendor/firebase.js`, made by
  `tools/build-firebase.mjs` (see `tools/README.md`).
