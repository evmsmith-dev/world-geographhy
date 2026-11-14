// A device that already has the game keeps working when a new version comes out, even when files move.
// The test serves the last version from before the move into folders, lets the game save itself offline and some
// progress, then switches the website to this version and presses Update the way a kid would.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { test, expect, answer } from './helpers.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const CACHE = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8').match(/const CACHE = '([^']+)'/)[1]; // this version's offline copy
const OLD = 'beb13493b9721513ecc9ee3a7c45dcb16c698a18'; // main just before the files moved into folders (November 2026)

function haveCommit(){ try { execSync(`git -C "${ROOT}" cat-file -e ${OLD}^{commit}`, {stdio: 'ignore'}); return true; } catch { return false; } }

test('a device with the old version updates to this one and keeps its progress', async ({page, browserName}, info) => {
  const PORT = 8790 + info.parallelIndex; // its own little website, so tests running side by side don't share one
  test.skip(browserName === 'webkit', 'Playwright WebKit cannot run this service worker test');
  test.skip(!haveCommit(), 'needs the git history (the old version is read from it)');

  // the old version in a folder, and a "website" whose files can be switched from old to new
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wgq-upgrade-'));
  const oldDir = path.join(tmp, 'old'), site = path.join(tmp, 'site');
  fs.mkdirSync(oldDir);
  execSync(`git -C "${ROOT}" archive ${OLD} | tar -x -C "${oldDir}"`);
  fs.symlinkSync(oldDir, site);
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', site], {stdio: 'ignore'});
  try {
    const base = `http://localhost:${PORT}/`;
    for(let i = 0; i < 50; i++){ try { if((await fetch(base + 'index.html')).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }

    // with the old version: make a player, let it save its files for offline, learn two countries
    await page.goto(base + '?test');
    await page.click('#addPlayer'); await page.fill('#pName', 'Ama'); await page.click('#pForm button[type=submit]'); await page.click('#helpOk');
    await page.waitForFunction(async () => navigator.serviceWorker.controller && (await caches.has('wgq-v1')) && (await (await caches.open('wgq-v1')).keys()).length > 30, null, {timeout: 60_000, polling: 500});
    await page.click('.rtile[data-region="Oceania"]');
    await page.click('#regionTabs [data-tab="oc-countries"]');
    await page.click('.modebig[data-mode="practice"]');
    await page.waitForFunction(() => document.querySelectorAll('#map path.st').length === 14);
    for(const n of ['Australia', 'Fiji']){
      await answer(page, n);
      await expect(page.locator('#feedback')).toContainText(/yes/i);
    }
    await page.waitForTimeout(500);

    // the new version comes out
    fs.unlinkSync(site); fs.symlinkSync(ROOT, site);

    // the kid opens the game again: it notices the new version; they press Update
    await page.evaluate(() => localStorage.removeItem('wgq-update-check')); // don't wait for the once-an-hour check
    await page.goto(base + '?test');
    await page.locator('.toast button', {hasText: 'Update'}).click({timeout: 30_000});

    // after the update (and the one extra reload when the new offline helper takes over), the new version runs
    const now = fn => page.evaluate(fn).catch(() => null); // null while the page is reloading
    await expect.poll(() => now(() => !!document.querySelector('script[src^="src/"]') && !!window.WGQ_TEST), {timeout: 30_000}).toBe(true);
    await expect.poll(() => now(() => caches.keys()), {timeout: 30_000}).toEqual([CACHE]);
    await page.waitForLoadState('load');
    await page.waitForTimeout(1000); // in case the one extra reload is still on its way
    await expect(page.locator('#homePlayer')).toContainText('Ama');
    expect(await page.evaluate(() => document.fonts.check('16px "Alegreya Sans"')), 'the fonts load from their new folder').toBe(true);
    await page.click('.rtile[data-region="Oceania"]');
    await page.click('#regionTabs [data-tab="oc-countries"]');
    await expect(page.locator('#regionBody .stats')).toContainText('2 of 14 learned');
    await page.click('.modebig[data-mode="find"]');
    await page.waitForFunction(() => document.querySelectorAll('#map path.st').length === 14);

    // and it still works offline afterwards
    await page.context().setOffline(true);
    await page.goto(base + '?test');
    await expect(page.locator('#homePlayer')).toContainText('Ama');
    await page.context().setOffline(false);
  } finally {
    server.kill();
    fs.rmSync(tmp, {recursive: true, force: true});
  }
});
