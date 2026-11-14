// Each way to play works: Test (and its badge), Practice, flashcards, Explore and the Daily 10.
import { test, expect, newPlayer, goHome, openTopic, startMode, tapPlace, findTarget, mapSettled } from './helpers.js';

// Select a place the quick way (the keyboard), type its name, pick it from the list and save
async function answer(page, name, typed = name){
  const select = () => page.evaluate(n => [...document.querySelectorAll('#map path.st')].find(p => p.dataset.n === n).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})), name);
  await select();
  // the answer box opens once the place is selected; on a busy computer the first try can come too early
  await expect(async () => { if(!(await page.locator('#answer').isEditable())) await select(); await expect(page.locator('#answer')).toBeEditable({timeout: 1000}); }).toPass({timeout: 10_000});
  await page.fill('#answer', typed);
  const option = page.locator(`#opts li[data-v="${name.replace(/"/g, '\\"')}"]`);
  if(await option.count()) await option.first().dispatchEvent('click'); // pick it from the list (the list can close itself while it updates)
  await page.click('#submit');
}

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

// Answer one Daily 10 question correctly, whatever kind it is
async function answerDaily(page){
  const info = await page.evaluate(() => {
    const chip = document.getElementById('chipText').textContent, W = window.WGQ_TEST;
    const t = W.TOPICS.find(t => chip.includes(t.name));
    return {topic: t && t.id, pick: !document.getElementById('choices').hidden, sel: document.querySelector('#map path.sel')?.dataset.n};
  });
  expect(info.topic, 'the question says which topic it is from').toBeTruthy();
  if(info.pick){
    const right = await page.evaluate(async ({topic, sel}) => {
      const W = window.WGQ_TEST, t = W.TOPIC[topic];
      if(/-capitals$/.test(topic)){ const m = await W.loadMap(t.map); const it = m.items.find(i => i.n === sel); return it.cap || W.CAP[sel]; }
      return sel;
    }, info);
    await page.click(`#choices button[data-dv="${right.replace(/"/g, '\\"')}"]`);
  } else {
    await tapPlace(page, await findTarget(page, info.topic));
  }
  await expect(page.locator('#feedback')).toContainText(/yes/i);
  return info;
}

async function playDaily(page){
  await page.click('#dailyBtn');
  for(let i = 1; i <= 10; i++){
    await expect(page.locator('#chipText')).toContainText(`Question ${i} of 10`);
    await answerDaily(page);
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
    await answerDaily(page);
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
