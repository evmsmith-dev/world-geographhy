// The first ten minutes (from the November 2026 reviews): a short How to play, a clear start, the World Tour easy to find
import {test, expect, newPlayer, openTopic, startMode, answer} from './helpers.js';

test('How to play starts with three short steps; the rest is under More help', async ({page}) => {
  await page.goto('/?test');
  await page.click('#addPlayer');
  await page.fill('#pName', 'Ama');
  await page.click('#pForm button[type=submit]');
  await expect(page.locator('.panel ol.quick li')).toHaveCount(3);
  await expect(page.locator('#helpOk'), 'Let\'s play! is right below them').toBeInViewport();
  await expect(page.locator('details.morehelp')).not.toHaveAttribute('open', '');
  await expect(page.locator('.panel .steps')).toBeHidden();
  await page.click('details.morehelp summary');
  await expect(page.locator('.panel .steps')).toBeVisible();
});

test('a new player starts at Up next ("Start here"), and the World tile names the World Tour', async ({page}) => {
  await newPlayer(page);
  const firsts = await page.$$eval('#homeGroups > *', els => els.slice(0, 2).map(e => e.id || e.className));
  expect(firsts[0], 'Start here first').toContain('upnextsec');
  await expect(page.locator('.upnextsec h2')).toHaveText('Start here');
  await expect(page.locator('.rtile[data-region="World"] .rsub')).toHaveText('Continents & Oceans · All Countries · All Land & Water · All Landmarks');
});

test('results lead with what was right; places never answered fold into one line; the map is zoomed out', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-countries');
  await startMode(page, 'test');
  await answer(page, 'France');
  await answer(page, 'Italy', 'Greece');
  await page.click('#zIn'); await page.click('#zIn');
  await page.click('#reviewBtn');
  if(await page.isVisible('#dlgYes')) await page.click('#dlgYes');
  const order = await page.$$eval('#results h2', hs => hs.map(h => h.id));
  expect(order.indexOf('goodH'), 'Right before Missed').toBeLessThan(order.indexOf('badH'));
  await expect(page.locator('#badList > li:not(.blanks)')).toHaveCount(1);
  await expect(page.locator('#badList li.blanks summary')).toHaveText('Not answered (42)');
  await expect(page.locator('#badList')).not.toContainText('blank');
  await expect.poll(() => page.evaluate(() => vb.w), {message: 'zoomed out to the whole map'}).toBe(await page.evaluate(() => VW));
});

test('a badge note sits at the bottom, clear of the buttons at the top', async ({page}) => {
  await newPlayer(page);
  await page.evaluate(async () => { player.feats = {...(player.feats || {}), beatBest: 10}; await checkBadges(); });
  const box = await page.locator('.toast').boundingBox(), top = await page.locator('#homeScores').boundingBox();
  expect(box.y, 'below the top buttons').toBeGreaterThan(top.y + top.height);
  expect(box.y + box.height).toBeGreaterThan(page.viewportSize().height * 0.6);
});
