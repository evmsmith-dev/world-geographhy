// Fixes from the November 2026 reviews (UX expert, geography expert, 8th grader): the play screens
import {test, expect, newPlayer, openTopic, startMode, goHome, answer, answerRun, tapPlace, mapSettled, findTarget} from './helpers.js';

const pick = (page, n) => page.evaluate(n => [...document.querySelectorAll('#map path.st')].find(p => p.dataset.n === n).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})), n);
const cls = (page, n) => page.getAttribute(`#map path.st[data-n="${n}"]`, 'class');

test('Practice shows right (green) or wrong (red) on the map the moment you answer', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-countries');
  await startMode(page, 'practice');
  await answer(page, 'France');
  await expect(page.locator('#map path.st[data-n="France"]')).toHaveClass(/\bok\b.*\bsel\b|\bsel\b.*\bok\b/);
  const colour = v => page.evaluate(v => { const d = document.createElement('div'); d.style.color = `var(${v})`; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }, v);
  const ok = await colour('--ok'); // (the colour fades in, so wait for it)
  await expect.poll(() => page.$eval('#map path.st[data-n="France"]', p => getComputedStyle(p).fill), {message: 'green (right), not the picked colour'}).toBe(ok);
  await expect(page.locator('#selLabel')).toHaveText('Got it!');
  await answer(page, 'Slovakia', 'Slovenia');
  await expect(page.locator('#map path.st[data-n="Slovakia"]')).toHaveClass(/\bbad\b/);
  await expect(page.locator('#selLabel')).toHaveText('Not this time');
});

test('Test: after Save the map stays still and nothing is picked, so the next tap goes where you tap', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-countries');
  await startMode(page, 'test');
  await answer(page, 'Spain');
  await expect(page.locator('#feedback')).toContainText('Saved Spain. Tap the next place, or press Next');
  expect(await page.evaluate(() => current), 'nothing picked').toBeNull();
  await expect(page.locator('#map .st.sel')).toHaveCount(0);
  const vb = await page.getAttribute('#map', 'viewBox');
  await page.waitForTimeout(500);
  expect(await page.getAttribute('#map', 'viewBox'), 'the map did not move').toBe(vb);
  await answer(page, 'Italy');
  expect(await page.evaluate(() => G.answers), 'each answer saved to the place tapped').toMatchObject({Spain: 'Spain', Italy: 'Italy'});
  await page.click('#next');
  expect(await page.evaluate(() => current), 'Next still picks the next one').not.toBeNull();
});

test('a typing slip still finds the answer, even with two letters swapped', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-capitals');
  await startMode(page, 'practice');
  await pick(page, 'Spain');
  await page.fill('#answer', 'madird');
  await expect(page.locator('#opts li').first()).toHaveText('Madrid');
  await page.fill('#answer', 'Budapset');
  await expect(page.locator('#opts li').first()).toHaveText('Budapest');
});

test('flag and landmark flashcards keep the flag or drawing on the back, next to the name and where it is', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Africa', 'af-flags');
  await startMode(page, 'flash');
  await page.click('#fReveal');
  const n = await page.textContent('#fAnswer');
  await expect(page.locator('#fBack image')).toHaveAttribute('href', await page.evaluate(n => flagSrc(n), n));
  await expect(page.locator('#fLoc')).toBeVisible();
  await expect(page.locator('#fLoc path.hi')).toHaveCount(1);
  await goHome(page);
  await openTopic(page, 'Asia', 'as-landmarks');
  await startMode(page, 'flash');
  await page.click('#fReveal');
  await expect(page.locator('#fBack image')).toHaveAttribute('href', /^assets\/landmarks\//);
  await expect(page.locator('#fLoc circle.hi')).toHaveCount(1);
  await expect(page.locator('#fLoc circle.ring')).toHaveCount(1);
});

test('the US map: a tap in the middle of Massachusetts is Massachusetts (Rhode Island\'s circle sits offshore, with a line)', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'United States', 'us-states');
  await startMode(page, 'find');
  await mapSettled(page);
  const got = await page.evaluate(() => {
    const it = M.items.find(i => i.n === 'Massachusetts'), m = svg.getScreenCTM(), pt = svg.createSVGPoint();
    pt.x = it.c[0]; pt.y = it.c[1]; const s = pt.matrixTransform(m), under = placeUnder(s.x, s.y);
    return dotNear(s.x, s.y, under) || under;
  });
  expect(got).toBe('Massachusetts');
  await expect(page.locator('#map line.leader')).toHaveCount(1);
});

test('Find it: tapping the same wrong place twice uses only one try', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Oceania', 'oc-countries');
  await startMode(page, 'find');
  await mapSettled(page);
  const target = await findTarget(page, 'oc-countries'), wrong = target === 'Australia' ? 'New Zealand' : 'Australia';
  await tapPlace(page, wrong);
  await expect(page.locator('#feedback')).toContainText('2 tries left');
  await tapPlace(page, wrong);
  await expect(page.locator('#feedback')).toContainText('again. Try another place!');
  expect(await page.evaluate(() => G.tries)).toBe(1);
});

test('the Daily 10 keeps its place for the day, and a new player gets starter questions', async ({page}) => {
  await newPlayer(page);
  await expect(page.locator('#dailyBtn')).toContainText('to get you started');
  await page.click('#dailyBtn');
  await expect(page.locator('#chipText')).toContainText('Question 1 of 10');
  const qs = await page.evaluate(() => DAILY.qs.map(q => q.t));
  expect(qs.filter(t => !(t === 'world' || /-(countries|states)$/.test(t))), 'only the continents and oceans, countries and states').toEqual([]);
  await answerRun(page);
  await expect(page.locator('#chipText')).toContainText('Question 2 of 10', {timeout: 6000});
  await answerRun(page);
  await expect(page.locator('#chipText')).toContainText('Question 3 of 10', {timeout: 6000});
  const before = await page.evaluate(() => JSON.stringify(DAILY.qs.map(q => q.t + '|' + q.n)));
  await goHome(page);
  await page.click('#dailyBtn');
  await expect(page.locator('#chipText')).toContainText('Question 3 of 10');
  expect(await page.evaluate(() => JSON.stringify(DAILY.qs.map(q => q.t + '|' + q.n))), 'the same questions').toBe(before);
  await expect(page.locator('#tally')).toHaveText('2 right');
});

test('country cards and Explore show other names and two-continent notes, and the World tour explains the count', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Asia', 'as-countries');
  await page.click('#exploreBtn');
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length > 40);
  await pick(page, 'Turkey');
  await expect(page.locator('#exInfo')).toContainText('Also called Türkiye. It is in two continents, Asia and Europe.');
  await goHome(page);
  await page.click('.rtile[data-region="World"]');
  await page.click('#regionTabs [data-tab="world-countries"]');
  await page.click('[data-countcard]');
  await expect(page.locator('.countcard')).toContainText('the 193 members of the United Nations, plus Vatican City and Taiwan');
  await expect(page.locator('.countcard')).toContainText('Crimea is part of Ukraine');
});
