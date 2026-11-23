// World Geography Quiz: the Firebase half of Race a friend (src/20-race.js).
// Loaded only when someone opens Race a friend, so the rest of the game stays small and works offline.
// Anonymous sign-in (no email, no password, nothing personal) and the Realtime Database.
// database.rules.json is the server's half of this file: it refuses anything this file wouldn't write.
import {
  initializeApp, initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider, getAuth, signInAnonymously, onAuthStateChanged,
  getDatabase, ref, get, set, remove, onValue, runTransaction, onDisconnect, query, orderByChild, endAt, limitToFirst,
} from './vendor/firebase.js';

export async function createRaceBackend({config, appCheckKey = null, appCheckProvider = 'enterprise', makeCode}){
  const app = initializeApp(config);
  if(appCheckKey){
    // On a developer's own computer App Check prints a debug token in the console instead (see docs/firebase-setup.md).
    if(['localhost', '127.0.0.1'].includes(location.hostname)) self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    const provider = appCheckProvider === 'v3' ? new ReCaptchaV3Provider(appCheckKey) : new ReCaptchaEnterpriseProvider(appCheckKey);
    initializeAppCheck(app, {provider, isTokenAutoRefreshEnabled: true});
  }
  const auth = getAuth(app), db = getDatabase(app);
  // the same anonymous id comes back on this device, so a player can get back into their race
  const user = await new Promise((resolve, reject) => {
    const stop = onAuthStateChanged(auth, u => {
      if(u){ stop(); resolve(u); return; }
      signInAnonymously(auth).catch(e => { stop(); reject(Object.assign(new Error('signing in: ' + (e.code || e.message)), {code: e.code || e.message})); });
    }, reject);
  });
  const raceRef = code => ref(db, `races/${code}`);
  // the countdowns use the server's time, so a phone with its clock set wrong still starts with the other one
  // (the rules check the times a race is given, so wait a moment for the first offset before racing)
  let offset = 0;
  await new Promise(resolve => {
    setTimeout(resolve, 3000);
    onValue(ref(db, '.info/serverTimeOffset'), snap => { offset = snap.val() || 0; resolve(); });
  });
  const serverNow = () => Date.now() + offset;

  return {
    kind: 'firebase',
    uid: user.uid,
    serverNow,
    /** Saves make(code) under a new, unused code and returns the code. */
    async create(make){
      for(let attempt = 0; attempt < 5; attempt++){
        const code = makeCode(), record = make(code);
        let out;
        try{ out = await runTransaction(raceRef(code), cur => cur === null ? record : undefined); }
        catch(e){ throw Object.assign(new Error('saving the race: ' + (e.code || e.message)), {code: 'database/' + (e.code || e.message)}); }
        if(out.committed) return code;
      }
      throw new Error('busy');
    },
    async read(code){ return (await get(raceRef(code))).val(); },
    /** Runs change(race) as a transaction; change returns null to leave the race alone. Resolves true if it was saved. */
    async transact(code, change){
      try{
        const out = await runTransaction(raceRef(code), race => {
          // Before the first read the local copy is null: returning null makes Firebase fetch the real race and
          // run this again (it never deletes a race that exists).
          if(race === null) return null;
          const next = change(race);
          return next === null ? undefined : next;
        }, {applyLocally: false});
        return out.committed && out.snapshot.exists();
      }catch(e){ return false; } // refused by the rules, or offline
    },
    async remove(code){ try{ await remove(raceRef(code)); return true; }catch(e){ return false; } },
    watch(code, cb){ return onValue(raceRef(code), snap => cb(snap.val()), () => cb(null)); },
    setPresence(code, seat){
      const mine = ref(db, `races/${code}/presence/${seat}`);
      // online whenever the connection (re)opens; Firebase marks the player away by itself if the connection drops
      const stop = onValue(ref(db, '.info/connected'), snap => {
        if(snap.val() !== true) return;
        onDisconnect(mine).set(false).then(() => set(mine, true)).catch(() => {});
      });
      return () => { stop(); set(mine, false).catch(() => {}); };
    },
    async sweep(){
      // races past their time (the rules let anyone delete one), a few at a time
      try{
        const old = await get(query(ref(db, 'races'), orderByChild('expires'), endAt(serverNow() - 60000), limitToFirst(25)));
        const gone = []; old.forEach(child => { gone.push(remove(child.ref).catch(() => {})); });
        await Promise.all(gone);
      }catch(e){}
    },
  };
}
