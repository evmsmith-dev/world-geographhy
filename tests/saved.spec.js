// Kids' progress is never lost: it survives a reload, backups save and load, and backups made by older versions still work.
import path from 'node:path';
import { test, expect, newPlayer, openGame, goHome, openTopic, startMode, tapPlace, findTarget } from './helpers.js';

// Made with the game as it was in November 2026: Ama has a perfect Test of Europe's Land & Water and some Africa
// practice (one wrong answer); Kofi has learned 5 US states. Never re-make this file: it stands for kids' real saved data.
const OLD_BACKUP = path.join(import.meta.dirname, 'fixtures', 'backup-2026-11.json');

async function loadBackup(page, file){
  await page.click('#homeSettings');
  await page.setInputFiles('#importFile', file);
  await page.click('#dlgYes');
  await expect(page.locator('.toast')).toContainText('Backup loaded');
}

test('progress is still there after closing and opening the game', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Oceania', 'oc-countries');
  await startMode(page, 'find');
  for(let i = 0; i < 3; i++){ const before = await page.textContent('#findQ'); await tapPlace(page, await findTarget(page, 'oc-countries')); await expect(page.locator('#findQ')).not.toHaveText(before); }
  await page.waitForTimeout(500); // let the last answer save
  await goHome(page); // a fresh page load
  await expect(page.locator('#homePlayer')).toContainText('Ama');
  await openTopic(page, 'Oceania', 'oc-countries');
  await expect(page.locator('#regionBody .stats')).toContainText('3 of 14 learned');
});

test('a backup from an older version loads with every player, score and badge', async ({page}) => {
  await newPlayer(page, 'Someone');
  await loadBackup(page, OLD_BACKUP);
  await expect(page.locator('#homePlayer')).toContainText('Ama');
  await openTopic(page, 'Europe', 'eu-geo');
  await expect(page.locator('#regionBody .stats')).toContainText('14 of 14 learned');
  await expect(page.locator('#regionBody .stats')).toContainText('Badge earned');
  await goHome(page);
  await openTopic(page, 'Africa', 'af-countries');
  await expect(page.locator('#regionBody .stats')).toContainText('5 of 54 learned');
  // the other player is there too, with their own progress
  await goHome(page);
  await page.click('#homePlayer');
  await expect(page.locator('#playerGrid')).toContainText('Kofi');
  await expect(page.locator('#playerGrid')).not.toContainText('Someone');
  await page.locator('#playerGrid').getByText('Kofi').click();
  await openTopic(page, 'United States', 'us-states');
  await expect(page.locator('#regionBody .stats')).toContainText('5 of 50 learned');
});

test('a backup saved now loads back on another device', async ({page, browser}, info) => {
  await newPlayer(page, 'Lena');
  await openTopic(page, 'World', 'world');
  await startMode(page, 'find');
  for(let i = 0; i < 4; i++){ const before = await page.textContent('#findQ'); await tapPlace(page, await findTarget(page, 'world')); await expect(page.locator('#findQ')).not.toHaveText(before); }
  await page.waitForTimeout(500);
  await goHome(page);
  await page.click('#homeSettings');
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#doExport')]);
  const file = info.outputPath('backup.json');
  await download.saveAs(file);
  // "another device": a new browser with nothing saved
  const other = await browser.newContext({...info.project.use, baseURL: info.project.use.baseURL});
  const page2 = await other.newPage();
  await newPlayer(page2, 'Temp');
  await loadBackup(page2, file);
  await expect(page2.locator('#homePlayer')).toContainText('Lena');
  await openTopic(page2, 'World', 'world');
  await expect(page2.locator('#regionBody .stats')).toContainText('4 of 12 learned');
  await other.close();
});

test('progress saved under the old Central America map moves to North America', async ({page}) => {
  await newPlayer(page);
  // records as the old version saved them, before North America replaced Central America
  await page.evaluate(async () => {
    const pid = localStorage.getItem('wgq-player');
    const db = await new Promise((res, rej) => { const r = indexedDB.open('world-geography-quiz', 1); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    await new Promise((res, rej) => { const t = db.transaction('items', 'readwrite'), s = t.objectStore('items');
      for(const item of ['Panama', 'Belize', 'Cuba']) s.put({key: `${pid}|ca-countries|${item}`, pid, topic: 'ca-countries', item, seen: 1, right: 1, wrong: 0, last: 'right', at: Date.now() - 864e5});
      t.oncomplete = res; t.onerror = () => rej(t.error); });
    db.close();
    localStorage.removeItem('wgq-migrated-na');
  });
  await goHome(page); // the move happens when the game starts
  await openTopic(page, 'North America', 'na-countries');
  await expect(page.locator('#regionBody .stats')).toContainText('3 of 23 learned');
});
