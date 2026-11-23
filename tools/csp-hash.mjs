// Updates the Content Security Policy in index.html to allow the page's own inline <script> (and nothing else inline).
// The policy names that script by its fingerprint (a sha256 hash), so whenever the script changes, the hash must too.
// Publishing changes it (it stamps the version, WGQ_BUILD), so .github/workflows/tests.yml runs this right after.
// After editing the inline script by hand, run it on index.html: node tools/csp-hash.mjs index.html
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const inlineHashes = html => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(m => `'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);

if(process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href){ // run as a command (the tests only import inlineHashes)
  const file = process.argv[2], html = readFileSync(file, 'utf8');
  const rule = /(script-src 'self')((?: 'sha256-[A-Za-z0-9+/=]+')*)/;
  if(!rule.test(html)) throw new Error(`${file} has no script-src 'self' in its Content-Security-Policy`);
  writeFileSync(file, html.replace(rule, `$1 ${inlineHashes(html).join(' ')}`));
  console.log(`${file}: script-src allows ${inlineHashes(html).length} inline script(s)`);
}
