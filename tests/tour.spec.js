// The World Tour: every country, or every Land & Water place, in one game, each question on its own continent's map.
import { test, expect, newPlayer, goHome, openTopic, startMode, tapPlace, findTarget, answerRun } from './helpers.js';

async function openTour(page, id){
  await page.click('.rtile[data-region="World"]');
  await page.click(`#regionTabs [data-tab="${id}"]`);
  await expect(page.locator('.modebig').first()).toHaveAttribute('data-tour', id);
}
async function startTourMode(page, mode){
  await page.click(`.modebig[data-tmode="${mode}"]`);
  await expect(page.locator('#chipText')).toContainText('Question');
}
const stats = page => page.locator('#regionBody .stats');

test('the World has tabs for all the countries and all the Land & Water places', async ({page}) => {
  await newPlayer(page);
  await page.click('.rtile[data-region="World"]');
  await expect(page.locator('#regionTabs button')).toHaveText(['Continents & Oceans', 'All Countries', 'All Land & Water']);
  const cut = await page.$$eval('#regionTabs button', bs => bs.filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent));
  expect(cut, 'tab names that are cut off').toEqual([]);
  await page.click('#regionTabs [data-tab="world-countries"]');
  await expect(stats(page)).toContainText('0 of 195 learned');
  await expect(page.locator('.tourparts li')).toHaveCount(6);
  await page.click('#regionTabs [data-tab="world-geo"]');
  await expect(stats(page)).toContainText('0 of 79 learned');
});

test('progress is shared both ways between the continents and the World Tour', async ({page}) => {
  await newPlayer(page);
  // learn 3 countries in Oceania: the World Tour counts them
  await openTopic(page, 'Oceania', 'oc-countries');
  await startMode(page, 'find');
  for(let i = 0; i < 3; i++){ const before = await page.textContent('#findQ'); await tapPlace(page, await findTarget(page, 'oc-countries')); await expect(page.locator('#findQ')).not.toHaveText(before); }
  await page.waitForTimeout(500);
  await goHome(page);
  await openTour(page, 'world-countries');
  await expect(stats(page)).toContainText('3 of 195 learned');
  await expect(page.locator('.tourparts')).toContainText('Oceania 3 of 14');
  // answer 4 in the World Tour (they start in Europe): Europe counts them
  await startTourMode(page, 'find');
  for(let i = 0; i < 4; i++){ await expect(page.locator('#chipText')).toContainText(`Question ${i + 1} of 195`); await answerRun(page); }
  await page.waitForTimeout(1200);
  await goHome(page);
  await openTopic(page, 'Europe', 'eu-countries');
  await expect(stats(page)).toContainText('4 of 44 learned');
});

test('a World Tour can be stopped and picked up later where it was left', async ({page}) => {
  await newPlayer(page);
  await openTour(page, 'world-countries');
  await startTourMode(page, 'name');
  for(let i = 0; i < 3; i++){ await expect(page.locator('#chipText')).toContainText(`Question ${i + 1} of 195`); await answerRun(page); }
  await page.waitForTimeout(1200);
  await page.click('#backHome');
  await expect(page.locator('.modebig[data-tmode="name"]')).toContainText('Keep going: 3 of 195');
  await goHome(page); // even after closing the game
  await openTour(page, 'world-countries');
  await startTourMode(page, 'name');
  await expect(page.locator('#chipText')).toContainText('Question 4 of 195');
});

test('a whole Land & Water World Tour, every place tapped, earns the badges', async ({page}) => {
  test.setTimeout(300_000);
  await newPlayer(page);
  await openTour(page, 'world-geo');
  await startTourMode(page, 'find');
  for(let i = 1; i <= 79; i++){
    await expect(page.locator('#chipText')).toContainText(`Question ${i} of 79`);
    await answerRun(page);
  }
  await expect(page.locator('#dailyDone')).toContainText('79 out of 79! Perfect!');
  await expect(page.locator('.toast')).toContainText('badge');
  await page.click('#dailyHome');
  await expect(stats(page)).toContainText('79 of 79 learned');
  await expect(stats(page)).toContainText('Badge earned: Land & Water of the World Master');
  await expect(page.locator('.modebig[data-tmode="find"]')).not.toContainText('Keep going');
});

test('World 20 mixes places from all over, and missed ones can be practiced right away', async ({page}) => {
  await newPlayer(page);
  await openTour(page, 'world-countries');
  await startTourMode(page, 'quick');
  const continents = new Set();
  for(let i = 1; i <= 20; i++){
    await expect(page.locator('#chipText')).toContainText(`Question ${i} of 20`);
    continents.add((await page.textContent('#chipText')).replace(/.*· /, ''));
    if(i <= 2){ // get the first two wrong
      if(await page.isVisible('#choices')){
        const sel = await page.evaluate(() => document.querySelector('#map path.sel').dataset.n);
        await page.locator('#choices button').filter({hasNotText: sel}).first().click();
      } else {
        const target = (await page.textContent('#findQ')).replace(/^Find (the )?/, '').trim();
        const wrong = await page.evaluate(t => [...document.querySelectorAll('#map path.st')].map(p => p.dataset.n).find(n => n && n !== t), target);
        for(let k = 0; k < 2; k++){ await tapPlace(page, wrong); await page.waitForTimeout(300); }
      }
      await expect(page.locator('#feedback')).toContainText(/not quite|here is/i);
      await page.waitForTimeout(2500);
    } else await answerRun(page);
  }
  expect(continents.size, 'continents in a World 20').toBeGreaterThanOrEqual(5);
  await expect(page.locator('#dailyDone')).toContainText('You got 18 out of 20');
  await page.click('#tourAgain');
  await expect(page.locator('#chipText')).toContainText('Question 1 of 2');
});
