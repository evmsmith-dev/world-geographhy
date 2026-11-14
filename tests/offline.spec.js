// The game works with no internet once it has been opened one time (the service worker in sw.js keeps a copy).
import fs from 'node:fs';
import path from 'node:path';
import { test, expect, newPlayer, openGame, openTopic, startMode, tapPlace } from './helpers.js';

const FILES = fs.readFileSync(path.join(import.meta.dirname, '..', 'sw.js'), 'utf8').match(/const FILES = \[([\s\S]*?)\];/)[1].match(/'[^']+'/g).length;

test('after one visit, the game opens and plays with no internet', async ({page, context}) => {
  await newPlayer(page);
  // wait until the service worker is in charge and has saved every file
  await page.waitForFunction(async n => navigator.serviceWorker.controller && (await (await caches.open('wgq-v1')).keys()).length >= n, FILES, {timeout: 60_000, polling: 500});
  await context.setOffline(true);
  await openGame(page);
  await expect(page.locator('#homePlayer')).toContainText('Ama');
  // a Land & Water map (drawn on its continent's map) and a flag game
  for(const [region, topic] of [['Europe', 'eu-geo'], ['United States', 'us-flags']]){
    await openGame(page);
    await openTopic(page, region, topic);
    await startMode(page, 'find');
    await expect(page.locator('#findQ')).not.toBeEmpty();
  }
  // Explore with a fun fact, offline
  await openGame(page);
  await openTopic(page, 'Asia', 'as-countries');
  await page.click('#exploreBtn');
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length > 0);
  await tapPlace(page, 'Japan');
  await expect(page.locator('#exInfo')).toContainText('Did you know?');
  await context.setOffline(false);
});
