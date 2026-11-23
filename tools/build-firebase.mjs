// Builds src/vendor/firebase.js: the parts of Firebase that Race a friend uses (sign-in, App Check and the
// Realtime Database), as one file the game loads only when someone opens Race a friend.
// The game has no build step, so Firebase is kept in the repo as this one file. See tools/README.md.
//
//   cd tools && npm i --no-save firebase@13.4.0 esbuild@0.25.12 && node build-firebase.mjs
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const version = JSON.parse(readFileSync(createRequire(import.meta.url).resolve('firebase/package.json'), 'utf8')).version;
const entry = `
export { initializeApp } from "firebase/app";
export { initializeAppCheck, ReCaptchaEnterpriseProvider, ReCaptchaV3Provider } from "firebase/app-check";
export { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
export { getDatabase, ref, get, set, remove, onValue, runTransaction, onDisconnect, query, orderByChild, endAt, limitToFirst } from "firebase/database";
`;
const out = await build({stdin: {contents: entry, resolveDir: process.cwd(), loader: 'js'}, bundle: true, format: 'esm', minify: true, legalComments: 'none', write: false});
const head = `// Firebase JS SDK ${version} (https://github.com/firebase/firebase-js-sdk), Apache License 2.0.\n// Made by tools/build-firebase.mjs. Don't edit by hand.\n`;
writeFileSync(new URL('../src/vendor/firebase.js', import.meta.url), head + out.outputFiles[0].text);
console.log(`src/vendor/firebase.js: Firebase ${version}, ${Math.round(out.outputFiles[0].text.length / 1024)} KB`);
