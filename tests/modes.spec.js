// Each way to play works: Test (and its badge), Practice, flashcards, Explore and the Daily 10.
import { test, expect, newPlayer, goHome, openTopic, startMode, tapPlace, findTarget, mapSettled, answer, answerRun } from './helpers.js';

test('a perfect Test earns the Master badge', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-geo');
  await startMode(page, 'test');
  const names = await page.evaluate(() => [...new Set([...document.querySelectorAll('#map path.st')].map(p => p.dataset.n))]);
  for(const n of names) await answer(page, n);
  await page.click('#reviewBtn');
  if(await page.isVisible('#dlgYes')) await page.click('#dlgYes');
  await expect(page.locator('#score')).toContainText(`${names.length} out of ${names.length}`);
  await expect(page.locator('.toast')).toContainText('Land & Water of Europe Master');
  await page.click('#backHome');
  await expect(page.locator('#regionBody .stats')).toContainText(`${names.length} of ${names.length} learned`);
  await expect(page.locator('#regionBody .stats')).toContainText('Badge earned');
});

test('Practice says right away if an answer is right or wrong, with a tip for look-alikes', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Africa', 'af-countries');
  await startMode(page, 'practice');
  await answer(page, 'Niger', 'Nigeria');
  await expect(page.locator('#feedback')).toContainText(/not quite/i);
  await expect(page.locator('#feedback')).toContainText('Niger is the big desert country'); // the mix-up tip
  await answer(page, 'Kenya');
  await expect(page.locator('#feedback')).toContainText(/yes|right|correct/i);
});

test('flashcards go through the whole deck and do not count as learned', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Oceania', 'oc-geo');
  await startMode(page, 'flash');
  const count = await page.evaluate(() => window.WGQ_TEST.TOPIC['oc-geo'].count);
  for(let i = 0; i < count; i++){
    await page.click('#fReveal');
    await expect(page.locator('#fAnswer')).not.toBeEmpty();
    await expect(page.locator('#fSub')).toContainText(/ in Oceania$/);
    await page.click('#fGot');
  }
  await expect(page.locator('#fDone')).toBeVisible();
  await page.click('#backHome');
  await expect(page.locator('#regionBody .stats')).toContainText(`0 of ${count} learned`);
});

test('Explore shows a name, details and a fun fact for each kind of place', async ({page}) => {
  await newPlayer(page);
  for(const [region, topic, place, detail] of [['United States', 'us-states', 'Texas', 'Postal code'], ['Asia', 'as-countries', 'Japan', 'Tokyo'], ['Africa', 'af-geo', 'Sahara', 'A desert in Africa'], ['World', 'world', 'Africa', 'continent']]){
    await goHome(page);
    await openTopic(page, region, topic);
    await page.click('#exploreBtn');
    await page.waitForFunction(() => document.querySelectorAll('#map path.st').length > 0);
    await mapSettled(page);
    await tapPlace(page, place);
    await expect(page.locator('#exInfo')).toContainText(place);
    await expect(page.locator('#exInfo')).toContainText(detail);
    if(region !== 'World') await expect(page.locator('#exInfo')).toContainText('Did you know?');
  }
});

async function playDaily(page){
  await page.click('#dailyBtn');
  for(let i = 1; i <= 10; i++){
    await expect(page.locator('#chipText')).toContainText(`Question ${i} of 10`);
    await answerRun(page);
    const next = page.locator('#dailyNext');
    if(await next.isVisible()) await next.click();
  }
  await expect(page.locator('#dailyDone')).toContainText('10 out of 10');
}

test('the Daily 10 works with questions from all over the game', async ({page}) => {
  await newPlayer(page);
  await playDaily(page);
});

test('the Daily 10 works with Land & Water questions, and offers choices of the same kind', async ({page}) => {
  await newPlayer(page);
  await page.evaluate(() => { window.WGQ_TEST.dailyQuestions = [
    ['sa-geo', 'Atacama Desert', 'find'], ['na-geo', 'Mojave Desert', 'find'], ['af-geo', 'Sahara', 'pick'], ['oc-geo', 'Simpson Desert', 'find'], ['as-geo', 'Gobi Desert', 'pick'],
    ['as-geo', 'Dead Sea', 'find'], ['eu-geo', 'Adriatic Sea', 'pick'], ['eu-geo', 'English Channel', 'find'], ['af-geo', 'Lake Chad', 'find'], ['na-geo', 'Great Salt Lake', 'pick']]; });
  await page.click('#dailyBtn');
  for(let i = 1; i <= 10; i++){
    await expect(page.locator('#chipText')).toContainText(`Question ${i} of 10`);
    if(await page.isVisible('#choices')){
      // "Which desert is this?" should offer deserts first
      const kinds = await page.evaluate(async () => {
        const W = window.WGQ_TEST, chip = document.getElementById('chipText').textContent, t = W.TOPICS.find(t => chip.includes(t.name));
        const m = await W.loadMap(t.map), sub = n => m.items.find(i => i.n === n).sub, right = document.querySelector('#map path.sel').dataset.n;
        return {want: sub(right), offered: [...document.querySelectorAll('#choices button')].map(b => sub(b.dataset.dv)), have: m.items.filter(i => i.sub === sub(right)).length};
      });
      const same = kinds.offered.filter(s => s === kinds.want).length;
      expect(same, `choices of the same kind (${kinds.want})`).toBe(Math.min(4, kinds.have));
    }
    await answerRun(page);
    const next = page.locator('#dailyNext');
    if(await next.isVisible()) await next.click();
  }
  await expect(page.locator('#dailyDone')).toContainText('10 out of 10');
});

test('after playing, home suggests what to do next and Scores show the progress', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'South America', 'sa-countries');
  await startMode(page, 'find');
  for(let i = 0; i < 3; i++){ const before = await page.textContent('#findQ'); await tapPlace(page, await findTarget(page, 'sa-countries')); await expect(page.locator('#findQ')).not.toHaveText(before); }
  await goHome(page);
  await expect(page.locator('.upnext')).toBeVisible();
  await page.click('#homeScores');
  await expect(page.locator('#scrScores')).toBeVisible();
  await expect(page.locator('#scoresBody')).toContainText('Countries of South America');
});

test('How to play opens and covers Land & Water', async ({page}) => {
  await newPlayer(page);
  await page.click('#homeHelp');
  await expect(page.locator('.steps')).toContainText('Land & Water');
});

test('crowded places next to tiny countries can be tapped without zooming in', async ({page}) => {
  await newPlayer(page);
  for(const [region, topic, places] of [['Europe', 'eu-countries', ['Switzerland', 'Italy', 'Austria']], ['Asia', 'as-countries', ['Qatar', 'United Arab Emirates', 'Malaysia']]]){
    await goHome(page);
    await openTopic(page, region, topic);
    await page.click('#exploreBtn');
    await page.waitForFunction(() => document.querySelectorAll('#map path.st').length > 0);
    // Explore zooms in on what was tapped; go back to the whole map once that has happened
    const wholeMap = async () => { await page.waitForTimeout(300); await mapSettled(page); if(!(await page.isDisabled('#zFit'))){ await page.click('#zFit'); await mapSettled(page); } };
    for(const place of places){
      await wholeMap();
      await tapPlace(page, place, {zoom: false});
      await expect(page.locator('#exInfo')).toContainText(place);
    }
    // and the tiny neighbors' circles still work
    for(const tiny of region === 'Europe' ? ['Liechtenstein', 'San Marino'] : ['Bahrain', 'Singapore']){
      await wholeMap();
      await tapPlace(page, tiny, {zoom: false});
      await expect(page.locator('#exInfo')).toContainText(tiny);
    }
  }
});

test('each Land & Water place screen says how many of each kind of place there are, adding up to the total', async ({page}) => {
  await newPlayer(page);
  const regions = {eu: 'Europe', af: 'Africa', as: 'Asia', oc: 'Oceania', na: 'North America', sa: 'South America'};
  for(const [id, region] of Object.entries(regions)){
    await goHome(page);
    await openTopic(page, region, id + '-geo');
    const text = await page.locator('#regionBody .sub').first().textContent();
    expect(text).toMatch(new RegExp(`^Find .+ in ${region}\\.`));
    const sum = [...text.matchAll(/(\d+|\ba) [a-z]/g)].reduce((a, m) => a + (m[1] === 'a' ? 1 : +m[1]), 0);
    const count = await page.evaluate(id => window.WGQ_TEST.TOPIC[id].count, id + '-geo');
    expect(sum, `"${text}" adds up to ${count}`).toBe(count);
  }
});

test('National Parks: Explore says which state each park is in, and flashcards show it', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'United States', 'us-parks');
  await expect(page.locator('#regionBody .stats')).toContainText('0 of 45 learned');
  await page.click('#exploreBtn');
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length === 45);
  await expect(page.locator('#chipText')).toContainText('Explore national parks');
  await mapSettled(page);
  await tapPlace(page, 'Yellowstone National Park');
  await expect(page.locator('#exInfo')).toContainText('A national park in Wyoming, Montana and Idaho');
  await expect(page.locator('#exInfo')).toContainText('Old Faithful');
  await goHome(page);
  await openTopic(page, 'United States', 'us-parks');
  await startMode(page, 'flash');
  await page.click('#fReveal');
  await expect(page.locator('#fAnswer')).toContainText('National Park');
  await expect(page.locator('#fSub')).toContainText('A national park in ');
});

test.describe(() => {
  test.use({serviceWorkers: 'block'}); // so the slow connection below isn't skipped by the offline copy
  test('tapping tabs quickly always shows the last tab tapped', async ({page}) => {
  await newPlayer(page);
  // a slow connection: the Land & Water map takes a moment, so its tab finishes drawing after the next one
  await page.route(/europe-geo\.json/, async route => { await new Promise(r => setTimeout(r, 1200)); await route.continue(); });
  await page.click('.rtile[data-region="Europe"]');
  for(const id of ['eu-geo', 'eu-capitals']) await page.click(`#regionTabs [data-tab="${id}"]`);
  await page.waitForTimeout(2500);
  await expect(page.locator('.modebig').first()).toHaveAttribute('data-topic', 'eu-capitals');
  await expect(page.locator('#regionTabs [aria-selected="true"]')).toHaveText('Capitals');
});
});

test('the United States tabs: Regions, Cities and Land & Water work in Explore, and every tab name fits', async ({page}) => {
  await newPlayer(page);
  await page.click('.rtile[data-region="United States"]');
  await expect(page.locator('#regionTabs button')).toHaveText(['States', 'Capitals', 'Flags', 'Regions', 'Cities', 'National Parks', 'Land & Water']);
  const cut = await page.$$eval('#regionTabs button', bs => bs.filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent));
  expect(cut, 'tab names that are cut off').toEqual([]);
  for(const [topic, count, place, detail] of [['us-regions', 5, 'Southwest', '4 states: Arizona, New Mexico, Texas and Oklahoma'], ['us-cities', 25, 'Houston', 'A city in Texas'], ['us-geo', 31, 'Mississippi River', 'A river in the United States']]){
    await goHome(page);
    await openTopic(page, 'United States', topic);
    await expect(page.locator('#regionBody .stats')).toContainText(`0 of ${count} learned`);
    if(topic === 'us-geo') await expect(page.locator('#regionBody .sub').first()).toContainText('in the United States.');
    await page.click('#exploreBtn');
    await page.waitForFunction(n => document.querySelectorAll('#map path.st').length === n, count);
    await mapSettled(page);
    await tapPlace(page, place);
    await expect(page.locator('#exInfo')).toContainText(detail);
    await expect(page.locator('#exInfo')).toContainText('Did you know?');
  }
});
