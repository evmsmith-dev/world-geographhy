// The Progress screen: everything at a glance, short enough on a phone
import {test, expect, newPlayer, goHome} from './helpers.js';

// a player who has played 8 topics in 4 places, a few games each, with some misses
async function busyPlayer(page){
  await newPlayer(page);
  await page.evaluate(async () => {
    const topics = ['eu-countries', 'eu-capitals', 'af-countries', 'as-countries', 'us-states', 'us-capitals', 'eu-landmarks', 'sa-countries'];
    for(const id of topics){
      const t = window.WGQ_TEST.TOPIC[id], m = await window.WGQ_TEST.loadMap(t.map);
      for(const [i, it] of m.items.slice(0, 15).entries()) await recordItem(player.id, id, it.n, i % 4 !== 0);
      for(let g = 0; g < 4; g++) await DB.put('attempts', {pid: player.id, topic: id, mode: ['find', 'practice', 'test', 'test'][g], part: null, at: Date.now() - g * 864e5, correct: 10 + g, total: t.count});
    }
    await itemsSaved(); await checkBadges(); hideToast();
  });
  await page.click('#homeScores');
  await expect(page.locator('.psum')).toBeVisible();
}
const height = page => page.evaluate(() => document.getElementById('scrScores').scrollHeight);

test('Progress fits in about a screen and a half on a phone, with a summary, the passport, badges and what needs practice', async ({page}) => {
  await busyPlayer(page);
  const screen = page.viewportSize().height;
  expect(await height(page), 'the Me tab, with 8 topics played').toBeLessThan(screen * 1.6);
  await expect(page.locator('.psum div')).toHaveCount(4);
  await expect(page.locator('.psum')).toContainText('stamps');
  await expect(page.locator('.pcards #passBtn')).toContainText('of 64 stamps');
  await expect(page.locator('.pcards #badgesBtn')).toContainText(/\d+ of \d+/);
  // needs practice: the top 3, the rest folded away, each with its button
  await expect(page.locator('.psec > .prow')).toHaveCount(3);
  await expect(page.locator('.pmore summary')).toHaveText('5 more to practice');
  // only the places played, closed, one line per topic played
  await expect(page.locator('.pgroup .gn')).toHaveText(['United States', 'Europe', 'Africa', 'Asia', 'South America']);
  await expect(page.locator('.pgroup[open]')).toHaveCount(0);
  await expect(page.locator('.trow')).toHaveCount(8);
  const europe = page.locator('.pgroup', {hasText: 'Europe'});
  await europe.locator('summary').first().click();
  await europe.locator('.trow summary').first().click();
  await expect(europe.locator('.trow[open] .bars')).toBeVisible();
  await expect(europe.locator('.trow[open] .recent li')).toHaveCount(4);
  // the badges open in a screen of their own, and back
  await page.click('#badgesBtn');
  await expect(page.locator('.panel .bgroup').first()).toBeVisible();
  await expect(page.locator('.panel')).toContainText('Daily 10 streak');
  await page.keyboard.press('Escape');
  await expect(page.locator('.panel .bgroup')).toHaveCount(0);
  await expect(page.locator('#scrScores')).toBeVisible();
  // Practice these: straight into a game of those
  const first = page.locator('.psec > .prow').first();
  const n = Number((await first.locator('button').textContent()).match(/\d+/)[0]);
  await first.locator('button').click();
  await expect(page.locator('#scrPlay')).toBeVisible();
  expect(await page.evaluate(() => G.mode + ' ' + G.only.length)).toBe(`practice ${n}`);
});

test('the Everyone tab: tables only for topics someone has played, the rest on one line', async ({page}) => {
  await busyPlayer(page);
  await page.click('#tabAll');
  await page.click('[data-place="United States"]');
  await expect(page.locator('.famsec .tcard h3')).toHaveText(['States', 'Capitals']);
  await expect(page.locator('.notyet')).toContainText('Not started yet: Flags · Regions');
  expect(await height(page)).toBeLessThan(page.viewportSize().height * 1.4);
  await page.click('[data-place="Oceania"]');
  await expect(page.locator('.famsec .tcard')).toHaveCount(0);
  await expect(page.locator('.notyet')).toContainText('Nobody has started these yet');
});

test('a new player: Progress is one screen with friendly first steps', async ({page}) => {
  await newPlayer(page);
  await page.click('#homeScores');
  await expect(page.locator('.psum')).toBeVisible();
  await expect(page.locator('#passBtn')).toContainText('Learn a landmark to get your first stamp!');
  await expect(page.locator('#scoresBody')).toContainText('Play a game and your places show up here.');
  expect(await height(page)).toBeLessThanOrEqual(page.viewportSize().height);
});
