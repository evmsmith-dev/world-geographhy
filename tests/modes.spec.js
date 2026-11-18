// Each way to play works: Test (and its badge), Practice, flashcards, Explore and the Daily 10.
import { test, expect, newPlayer, goHome, openTopic, startMode, tapPlace, findTarget, mapSettled, answer, answerRun, savedAnswers } from './helpers.js';

test('a Test ended early shows what was right, missed and wrong, and you can keep going', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-capitals');
  await startMode(page, 'test');
  const cap = n => page.evaluate(n => window.WGQ_TEST.TOPIC['eu-capitals'].answer(n), n);
  await answer(page, 'France', await cap('France'));      // right
  await answer(page, 'Italy', await cap('Spain'));        // wrong
  await page.click('#reviewBtn');                         // before answering the rest
  if(await page.isVisible('#dlgYes')) await page.click('#dlgYes');
  const total = await page.evaluate(() => window.WGQ_TEST.TOPIC['eu-capitals'].count);
  await expect(page.locator('#score')).toContainText(`You got 1 out of ${total}.`);
  await expect(page.locator('#goodH')).toHaveText('Right (1)');
  await expect(page.locator('#badH')).toHaveText(`Missed (${total - 1})`);
  await expect(page.locator('#goodList')).toContainText(await cap('France'));
  await expect(page.locator('#badList')).toContainText(await cap('Italy'));
  await expect(page.locator('#map path.st[data-n="France"]')).toHaveClass(/ok/);
  await expect(page.locator('#map path.st[data-n="Italy"]')).toHaveClass(/bad|wrong/);
  // and the game isn't stuck: try the missed ones again
  await page.click('#retry');
  await expect(page.locator('#reviewBtn')).toBeVisible();
  await answer(page, 'Italy', await cap('Italy'));
  await expect(page.locator('#map path.st[data-n="Italy"]')).toHaveClass(/answered|ok|done/);
});

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

test('after playing, home suggests what to do next and the Progress screen shows it', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'South America', 'sa-countries');
  await startMode(page, 'find');
  for(let i = 0; i < 3; i++){ const before = await page.textContent('#findQ'); await tapPlace(page, await findTarget(page, 'sa-countries')); await expect(page.locator('#findQ')).not.toHaveText(before); }
  await savedAnswers(page, 'sa-countries', 3); // saving happens a moment after each answer
  await goHome(page);
  await expect(page.locator('.upnext')).toBeVisible();
  await expect(page.locator('#homeScores')).toHaveText(/Progress/);
  await page.click('#homeScores');
  await expect(page.locator('#scrScores')).toBeVisible();
  await expect(page.locator('#scrScores h1')).toHaveText('Progress');
  const group = page.locator('.pgroup', {hasText: 'South America'});
  await expect(group).toHaveAttribute('open', ''); // the only place played starts open
  await expect(group.locator('.trow summary')).toContainText('Countries');
  await expect(group.locator('.trow .tl')).toHaveText('3/12');
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

test('the United States tabs: Regions, Cities, Land & Water and Landmarks work in Explore, and every tab name fits', async ({page}) => {
  await newPlayer(page);
  await page.click('.rtile[data-region="United States"]');
  await expect(page.locator('#regionTabs button')).toHaveText(['States', 'Capitals', 'Flags', 'Regions', 'Cities', 'National Parks', 'Land & Water', 'Landmarks']);
  const cut = await page.$$eval('#regionTabs button', bs => bs.filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent));
  expect(cut, 'tab names that are cut off').toEqual([]);
  for(const [topic, count, place, detail] of [['us-regions', 5, 'Southwest', '4 states: Arizona, New Mexico, Texas and Oklahoma'], ['us-cities', 25, 'Houston', 'A city in Texas'], ['us-geo', 31, 'Mississippi River', 'A river in the United States'], ['us-landmarks', 12, 'Gateway Arch', 'A landmark in Missouri']]){
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

test('National Parks have part chips, and a part plays just its parks and has its own badge', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'United States', 'us-parks');
  await expect(page.locator('.partrow button')).toHaveText(['All', 'Pacific', 'Rockies', 'Southwest', 'Midwest', 'East', 'Alaska & Hawaii']);
  await page.click('.partrow [data-part="Rockies"]');
  await expect(page.locator('#regionBody .stats')).toContainText('0 of 6 learned in the Rocky Mountain states');
  // a perfect Test of the part: its 6 parks, then the part badge
  await page.click('.modebig[data-mode="test"]');
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length === 45);
  await page.waitForFunction(() => document.querySelectorAll('#map path.st:not(.off)').length === 6); // once the others are hidden
  const names = await page.evaluate(() => [...document.querySelectorAll('#map path.st')].filter(p => !p.classList.contains('off')).map(p => p.dataset.n));
  expect(names.length).toBe(6);
  for(const n of names) await answer(page, n);
  await page.click('#reviewBtn');
  if(await page.isVisible('#dlgYes')) await page.click('#dlgYes');
  await expect(page.locator('#score')).toContainText('6 out of 6');
  await expect(page.locator('.toast')).toContainText('badge'); // (a secret badge for a perfect part may be shown first)
  await page.click('#backHome');
  await expect(page.locator('#regionBody .stats')).toContainText('6 of 6 learned in the Rocky Mountain states', {timeout: 15_000}); // after the answers are saved, which takes longer on a busy machine
  await expect(page.locator('#regionBody .stats')).toContainText('Badge earned: Rocky Mountain National Parks');
  // other US tabs have no part chips
  await goHome(page);
  await openTopic(page, 'United States', 'us-states');
  await expect(page.locator('.partrow')).toHaveCount(0);
});

test('Landmarks: each continent has a tab, Explore says the country, and questions read right', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-landmarks');
  await expect(page.locator('#regionTabs [aria-selected="true"]')).toHaveText('Landmarks');
  await expect(page.locator('#regionBody .sub').first()).toHaveText('Find 10 famous landmarks in Europe.');
  await page.click('#exploreBtn');
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length === 10);
  await mapSettled(page);
  await tapPlace(page, 'Eiffel Tower');
  await expect(page.locator('#exInfo')).toContainText('A landmark in France');
  await expect(page.locator('#exInfo')).toContainText('1889');
  // "Find the Eiffel Tower" but "Find Machu Picchu"
  await goHome(page);
  await openTopic(page, 'South America', 'sa-landmarks');
  await startMode(page, 'find');
  const q = await page.textContent('#findQ');
  expect(q).toMatch(/^Find /);
  expect(q, 'no "the" before Machu Picchu, Angel Falls, Salar de Uyuni…').not.toMatch(/^Find the (Machu Picchu|Christ the Redeemer|Iguazu Falls|Angel Falls|Mitad del Mundo|Salar de Uyuni)/);
});

test('Landmarks have pictures: in Explore, Find it, Practice and on flashcards, and "Which landmark is this?" in the Daily 10', async ({page}) => {
  const loaded = img => expect.poll(() => img.evaluate(i => i.complete && i.naturalWidth > 0), {timeout: 10_000}).toBe(true);
  const picOf = n => page.evaluate(n => window.WGQ_TEST.picSrc(n), n);
  await newPlayer(page);
  // Explore: the picture beside the name
  await openTopic(page, 'Europe', 'eu-landmarks');
  await page.click('#exploreBtn');
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length === 10);
  await mapSettled(page);
  await tapPlace(page, 'Eiffel Tower');
  await expect(page.locator('#exInfo img.lmpic')).toHaveAttribute('src', 'assets/landmarks/eiffel-tower.svg');
  await loaded(page.locator('#exInfo img.lmpic'));
  // Find it: the picture with the name to find
  await goHome(page);
  await openTopic(page, 'Asia', 'as-landmarks');
  await startMode(page, 'find');
  const target = await findTarget(page, 'as-landmarks');
  await expect(page.locator('#findQ img.lmpic')).toHaveAttribute('src', await picOf(target));
  await loaded(page.locator('#findQ img.lmpic'));
  // Practice: tap a landmark and its picture shows with "Which landmark is this?"
  await goHome(page);
  await openTopic(page, 'Africa', 'af-landmarks');
  await startMode(page, 'practice');
  await expect(page.locator('#findQ')).toBeHidden();
  await page.evaluate(() => [...document.querySelectorAll('#map path.st')].find(p => p.dataset.n === 'Victoria Falls').dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})));
  await expect(page.locator('#selLabel')).toHaveText('Which landmark is this?');
  await expect(page.locator('#findQ img.lmpic')).toHaveAttribute('src', 'assets/landmarks/victoria-falls.svg');
  // Flashcards: the picture on the front, the answer and the map on the back
  await goHome(page);
  await openTopic(page, 'Africa', 'af-landmarks');
  await startMode(page, 'flash');
  await expect(page.locator('#fFront image')).toHaveAttribute('href', /^assets\/landmarks\/.+\.svg$/);
  await expect(page.locator('#fPrompt')).toHaveText('Which landmark is this?');
  const front = await page.getAttribute('#fFront image', 'href');
  await page.click('#fReveal');
  expect(front, 'the front shows the landmark on the back').toBe(await picOf(await page.textContent('#fAnswer')));
  await expect(page.locator('#fBack image'), 'the drawing stays on the back').toHaveAttribute('href', front);
  await expect(page.locator('#fLoc circle.hi'), 'and a little map shows where it is').toHaveCount(1);
  // Daily 10: the picture, not the place, then the place once answered
  await goHome(page);
  await page.evaluate(() => { window.WGQ_TEST.dailyQuestions = [['sa-landmarks', 'Machu Picchu', 'pick'], ['eu-landmarks', 'Colosseum', 'find']]; });
  await page.click('#dailyBtn');
  await expect(page.locator('#chipText')).toContainText('Question 1 of 2');
  await expect(page.locator('#selLabel')).toHaveText('Which landmark is this?');
  await expect(page.locator('#findQ img.lmpic')).toHaveAttribute('src', 'assets/landmarks/machu-picchu.svg');
  await expect(page.locator('#map path.sel'), 'the place is not shown before answering').toHaveCount(0);
  await expect(page.locator('#choices button')).toHaveCount(4);
  await page.click('#choices button[data-dv="Machu Picchu"]');
  await expect(page.locator('#feedback')).toContainText("Yes! That's Machu Picchu.");
  await expect(page.locator('#map path.ok')).toHaveAttribute('data-n', 'Machu Picchu');
  await expect(page.locator('#chipText')).toContainText('Question 2 of 2');
  await expect(page.locator('#findQ')).toContainText('Find the Colosseum');
  await expect(page.locator('#findQ img.lmpic')).toHaveAttribute('src', 'assets/landmarks/colosseum.svg');
  await expect(page.locator('#choices')).toBeHidden();
});

test('the passport: a stamp for each landmark learned, kept after a miss, with a note about new ones', async ({page}) => {
  const progress = async () => { await goHome(page); await page.click('#homeScores'); await expect(page.locator('#scrScores')).toBeVisible(); };
  await newPlayer(page);
  await expect(page.locator('#scrHome #passBtn'), 'the passport is on the Progress screen, not home').toHaveCount(0);
  await progress();
  await expect(page.locator('.pcards #passBtn'), 'near the top of the Progress screen').toBeVisible();
  await expect(page.locator('#passBtn')).toContainText('Learn a landmark to get your first stamp!');
  // learn all of Oceania's landmarks in Find it
  await goHome(page);
  await openTopic(page, 'Oceania', 'oc-landmarks');
  await expect(page.locator('#regionBody [data-passport]')).toBeVisible();
  await startMode(page, 'find');
  await mapSettled(page);
  for(let i = 0; i < 6; i++){ const before = await page.textContent('#findQ'); await tapPlace(page, await findTarget(page, 'oc-landmarks')); if(i < 5) await expect(page.locator('#findQ')).not.toHaveText(before); }
  await expect(page.locator('#results')).toBeVisible();
  await progress();
  await expect(page.locator('#passBtn')).toContainText('6 of 64 stamps');
  await expect(page.locator('#passBtn .stamp')).toHaveCount(3); // the newest few
  // the passport: Oceania's page is full, the rest wait
  await page.click('#passBtn');
  await expect(page.locator('.passport')).toContainText('6 of 64 stamps');
  await expect(page.locator('.ppage', {hasText: 'Oceania'}).locator('h3')).toContainText('6 of 6');
  await expect(page.locator('.passport .stamp.on')).toHaveCount(6);
  await expect(page.locator('.passport .stamp.off')).toHaveCount(58);
  await page.click('[data-stamp="Uluru"]');
  await expect(page.locator('.stampbig')).toContainText('A landmark in Australia');
  await expect(page.locator('.stampbig')).toContainText('Stamped');
  await expect(page.locator('.stampbig .fact')).toBeVisible();
  await page.click('.stampbig [data-close]');
  await page.keyboard.press('Escape');
  await expect(page.locator('.passport')).toHaveCount(0);
  // a new stamp after a game, with no new badge to announce, gets its own note (any badge still to announce goes first)
  await page.evaluate(async () => { await itemsSaved(); await checkBadges(); hideToast(); });
  await page.evaluate(async () => { await recordItem(player.id, 'eu-landmarks', 'Eiffel Tower', true); await checkBadges(); });
  await expect(page.locator('.toast')).toContainText('New passport stamp: Eiffel Tower!');
  await page.click('.toast button:has-text("See passport")');
  await expect(page.locator('.ppage', {hasText: 'Europe'}).locator('h3')).toContainText('1 of 10');
  // a miss later doesn't take a stamp away
  await page.evaluate(async () => { await recordItem(player.id, 'oc-landmarks', 'Uluru', false); });
  await progress();
  await expect(page.locator('#passBtn')).toContainText('7 of 64 stamps');
  // the family's stamps on the Everyone tab
  await page.click('#tabAll');
  await expect(page.locator('.famcard.me .fstats')).toContainText('7stamps');
});

test('typing an answer: the list of names waits for typing over a landmark picture, and opens right away elsewhere', async ({page}) => {
  await newPlayer(page);
  const pick = n => page.evaluate(n => [...document.querySelectorAll('#map path.st')].find(p => p.dataset.n === n).dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true})), n);
  await openTopic(page, 'Europe', 'eu-landmarks');
  await startMode(page, 'practice');
  await pick('Big Ben');
  await expect(page.locator('#answer')).toBeEditable();
  await page.focus('#answer');
  await expect(page.locator('#findQ img.lmpic')).toBeVisible();
  await expect(page.locator('#opts'), 'the list does not cover the picture').toBeHidden();
  await page.keyboard.type('Big');
  await expect(page.locator('#opts')).toBeVisible();
  await expect(page.locator('#opts li').first()).toHaveText('Big Ben');
  await goHome(page);
  await openTopic(page, 'Europe', 'eu-countries');
  await startMode(page, 'practice');
  await pick('France');
  await expect(page.locator('#answer')).toBeEditable();
  await page.focus('#answer');
  await expect(page.locator('#opts')).toBeVisible();
});

test('"Which country is this landmark in?" in the Daily 10: the picture and name, four countries, then the place on the map', async ({page}) => {
  await newPlayer(page);
  await page.evaluate(() => { window.WGQ_TEST.dailyQuestions = [['eu-landmarks', 'Eiffel Tower', 'country'], ['af-landmarks', 'Victoria Falls', 'country'], ['na-landmarks', 'Statue of Liberty', 'country']]; });
  await page.click('#dailyBtn');
  await expect(page.locator('#chipText')).toContainText('Question 1 of 3');
  await expect(page.locator('#selLabel')).toHaveText('Pick the country');
  await expect(page.locator('#findQ')).toContainText('Which country is the Eiffel Tower in?');
  await expect(page.locator('#findQ img.lmpic')).toHaveAttribute('src', 'assets/landmarks/eiffel-tower.svg');
  await expect(page.locator('#map path.sel'), 'the place is not shown before answering').toHaveCount(0);
  const opts = await page.$$eval('#choices button', bs => bs.map(b => b.dataset.dv));
  expect(opts).toHaveLength(4);
  expect(opts.filter(c => c === 'France'), 'France is offered once').toHaveLength(1);
  const europe = await page.evaluate(async () => (await window.WGQ_TEST.loadMap('europe')).items.map(i => i.n));
  expect(opts.filter(c => !europe.includes(c)), 'every choice is a country in Europe').toEqual([]);
  // a wrong answer: the right country is shown, and the landmark on the map
  await page.click(`#choices button[data-dv="${opts.find(c => c !== 'France')}"]`);
  await expect(page.locator('#feedback')).toContainText('Not quite. The Eiffel Tower is in France.');
  await expect(page.locator('#choices button[data-dv="France"]')).toHaveClass(/picked-ok/);
  await expect(page.locator('#map path.sel')).toHaveAttribute('data-n', 'Eiffel Tower');
  // a landmark between two countries: either one is offered, and it's right
  await expect(page.locator('#chipText')).toContainText('Question 2 of 3');
  const two = await page.$$eval('#choices button', bs => bs.map(b => b.dataset.dv).filter(c => c === 'Zambia' || c === 'Zimbabwe'));
  expect(two, 'one of Zambia and Zimbabwe').toHaveLength(1);
  await page.click(`#choices button[data-dv="${two[0]}"]`);
  await expect(page.locator('#feedback')).toContainText('Yes! Victoria Falls is in Zambia and Zimbabwe.');
  await expect(page.locator('#map path.ok')).toHaveAttribute('data-n', 'Victoria Falls');
  await expect(page.locator('#chipText')).toContainText('Question 3 of 3');
  await expect(page.locator('#findQ')).toContainText('Which country is the Statue of Liberty in?');
  await page.click('#choices button[data-dv="United States"]');
  await expect(page.locator('#feedback')).toContainText('Yes! The Statue of Liberty is in the United States.');
});

test('US Landmarks: "Which state is it in?" in the Daily 10, and its own page in the passport', async ({page}) => {
  await newPlayer(page);
  await page.evaluate(() => { window.WGQ_TEST.dailyQuestions = [['us-landmarks', 'Alamo', 'country'], ['us-landmarks', 'Hoover Dam', 'country'], ['us-landmarks', 'Space Needle', 'pick']]; });
  await page.click('#dailyBtn');
  await expect(page.locator('#selLabel')).toHaveText('Pick the state');
  await expect(page.locator('#findQ')).toContainText('Which state is the Alamo in?');
  await expect(page.locator('#findQ img.lmpic')).toHaveAttribute('src', 'assets/landmarks/alamo.svg');
  const opts = await page.$$eval('#choices button', bs => bs.map(b => b.dataset.dv));
  const states = await page.evaluate(async () => (await window.WGQ_TEST.loadMap('us')).items.map(i => i.n));
  expect(opts).toHaveLength(4);
  expect(opts.filter(c => !states.includes(c)), 'every choice is a state').toEqual([]);
  await page.click('#choices button[data-dv="Texas"]');
  await expect(page.locator('#feedback')).toContainText('Yes! The Alamo is in Texas.');
  await expect(page.locator('#chipText')).toContainText('Question 2 of 3');
  const two = await page.$$eval('#choices button', bs => bs.map(b => b.dataset.dv).filter(c => c === 'Nevada' || c === 'Arizona'));
  expect(two, 'one of Nevada and Arizona').toHaveLength(1);
  await page.click(`#choices button[data-dv="${two[0]}"]`);
  await expect(page.locator('#feedback')).toContainText('Yes! The Hoover Dam is in Nevada and Arizona.');
  await expect(page.locator('#chipText')).toContainText('Question 3 of 3');
  await expect(page.locator('#selLabel')).toHaveText('Which landmark is this?');
  await page.click('#choices button[data-dv="Space Needle"]');
  await expect(page.locator('#feedback')).toContainText("Yes! That's the Space Needle.");
  await expect(page.locator('#dailyDone')).toContainText('You got 3 out of');
  await goHome(page);
  await page.click('#homeScores');
  await page.click('#passBtn');
  await expect(page.locator('.ppage').last().locator('h3')).toContainText('United States 3 of 12');
});
