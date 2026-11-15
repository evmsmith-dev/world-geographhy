// Mystery Country, Beat the Clock, and the screen-reader words for the landmark drawings
import {test, expect, newPlayer, openTopic, goHome, tapPlace, mapSettled, answerRun} from './helpers.js';

test('Beat the Clock: as many as you can before time runs out, then your best, and play again', async ({page}) => {
  test.setTimeout(120_000); // a 15-second game, played by a busy test machine
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-countries');
  await expect(page.locator('.clockbtn')).toContainText('How many can you get right in 60 seconds?');
  await page.evaluate(() => { window.WGQ_TEST.clockSeconds = 15; });
  await page.click('.clockbtn');
  await expect(page.locator('#chipText')).toContainText('Beat the Clock');
  await expect(page.locator('#chipText')).toContainText('Countries of Europe');
  await expect(page.locator('#clock')).toBeVisible();
  await expect(page.locator('#clock')).toHaveText(/^0:1[0-5]$/);
  const now = () => page.evaluate(() => ['#findQ', '#selLabel', '#choices'].map(s => document.querySelector(s).textContent).join('|'));
  let got = 0;
  while(await page.locator('#dailyDone').isHidden()){
    const q = await now();
    await answerRun(page).catch(() => {}); // the clock may run out mid-answer
    await page.waitForFunction(q => !document.getElementById('dailyDone').hidden || ['#findQ', '#selLabel', '#choices'].map(s => document.querySelector(s).textContent).join('|') !== q, q, {timeout: 5000}).catch(() => {});
    got = Number((await page.textContent('#tally')).match(/\d+/)[0]);
  }
  // the score is the one at the end (an answer can land in the last moment, after the last look at the tally)
  await expect(page.locator('#dailyDoneH')).toHaveText(/^Time's up! You got \d+ right!$/);
  got = Number((await page.textContent('#dailyDoneH')).match(/\d+/)[0]);
  expect(got, 'some answered in 15 seconds').toBeGreaterThan(1);
  await expect(page.locator('#tally')).toHaveText(`${got} right`);
  await expect(page.locator('#clock')).toBeHidden();
  await page.click('#dailyHome');
  await expect(page.locator('.clockbtn')).toContainText(`Your best: ${got}.`);
  // play again from the end screen; a chosen part plays only that part
  await page.click('.partrow [data-part="Western"]');
  await page.click('.clockbtn');
  await expect(page.locator('#chipText')).toContainText('Countries of Europe');
  const off = await page.evaluate(() => { const western = window.WGQ_TEST.TOPIC['eu-countries'].parts.Western; return DAILY.qs.filter(q => !western.includes(q.n)).map(q => q.n); });
  expect(off, 'only Western Europe').toEqual([]);
  await answerRun(page);
});

test('Beat the Clock: one try for each, and a badge for 20 right', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Oceania', 'oc-countries');
  await page.click('.clockbtn');
  await expect(page.locator('#chipText')).toContainText('Countries of Oceania');
  // find a Find it question, and miss it once: it moves straight on
  for(let i = 0; i < 20 && await page.locator('#choices').isVisible(); i++){ const before = await page.textContent('#tally'); await answerRun(page); await expect(page.locator('#tally')).not.toHaveText(before); await expect(page.locator('#feedback')).toBeEmpty(); }
  const q = await page.textContent('#findQ'), wrong = q.includes('Australia') ? 'New Zealand' : 'Australia';
  await mapSettled(page);
  await tapPlace(page, wrong);
  await expect(page.locator('#feedback')).toContainText('Here is');
  await expect(page.locator('#feedback')).not.toContainText('Try once more');
  // the badge
  await page.evaluate(async () => { player.feats = {...(player.feats || {}), beatBest: 20}; await checkBadges(); });
  await expect(page.locator('.toast')).toContainText('New badge: Speed Star! (and 1 more)'); // 20 right earns Speed Star (10) and Beat the Clock (20)
});

test('Mystery Country: clues one at a time, fewer clues for more points, and a best score', async ({page}) => {
  await newPlayer(page);
  await page.evaluate(() => { window.WGQ_TEST.mysteryQuestions = [['af-countries', 'Kenya'], ['eu-countries', 'France']]; });
  await page.click('#mysteryBtn');
  await expect(page.locator('.mysterypick button')).toHaveText(['United States (states)', 'Europe', 'Africa', 'Asia', 'Oceania', 'North America', 'South America', '🎲 Surprise me']);
  await page.click('[data-mystery="Africa"]');
  await expect(page.locator('#chipText')).toContainText('Mystery 1 of 2');
  await expect(page.locator('#selLabel')).toHaveText('Clue 1 of 6 · worth 6 points');
  await expect(page.locator('.clues li')).toHaveCount(1);
  await expect(page.locator('.clues li').first()).toHaveText(/^It's in the .+ of Africa\.$/);
  await expect(page.locator('#map path.sel, #map path.ok')).toHaveCount(0);
  // a wrong guess shows the next clue
  await mapSettled(page);
  await tapPlace(page, 'Nigeria');
  await expect(page.locator('#feedback')).toContainText("That's Nigeria, not the mystery country. Here's another clue.");
  await expect(page.locator('#selLabel')).toHaveText('Clue 2 of 6 · worth 5 points');
  await page.click('#nextClue');
  await expect(page.locator('#selLabel')).toHaveText('Clue 3 of 6 · worth 4 points');
  await expect(page.locator('#findQ'), "the clues don't give it away").not.toContainText('Kenya');
  await tapPlace(page, 'Kenya');
  await expect(page.locator('#feedback')).toContainText('Yes! It\'s Kenya! You found it with 3 clues: +4 points.');
  await expect(page.locator('#tally')).toHaveText('4 points');
  // no more clues: the answer
  await expect(page.locator('#chipText')).toContainText('Mystery 2 of 2', {timeout: 6000});
  for(let i = 1; i < 6; i++){ await page.click('#nextClue'); await expect(page.locator('#selLabel')).toContainText(`Clue ${i + 1} of 6`); }
  await expect(page.locator('.clues li.new img.flag')).toBeVisible(); // the last clue is the flag
  await expect(page.locator('#nextClue')).toHaveText('Show me the answer');
  await page.click('#nextClue');
  await expect(page.locator('#feedback')).toContainText('The mystery country was France.');
  await expect(page.locator('#map path.sel')).toHaveAttribute('data-n', 'France');
  await expect(page.locator('#dailyDoneH')).toHaveText('You scored 4 points!', {timeout: 8000});
  await expect(page.locator('#dailyDoneP')).toContainText('1 of 2 mysteries solved');
  await expect(page.locator('#runAgain')).toBeVisible();
  await page.click('#dailyHome');
  await page.click('#mysteryBtn');
  await expect(page.locator('[data-mystery="Africa"]')).toContainText('Best: 4');
});

test('Mystery Country: every country and state has its clues, and none gives away the name', async ({page}) => {
  test.setTimeout(120_000);
  await newPlayer(page);
  const bad = await page.evaluate(async () => {
    const W = window.WGQ_TEST, out = [];
    for(const r of W.MYSTERY_PLACES){
      const t = W.mysteryTopic(r), m = await W.loadMap(t.map);
      for(const it of m.items){
        const clues = await W.mysteryClues(t.id, it.n);
        if(clues.length < 5) out.push(`${it.n}: only ${clues.length} clues`);
        // a word of its name, as a whole word (not "Rica" in "America"), and not the continent's own name ("South Africa" is in Africa)
        const words = it.n.split(/[\s-]+/).filter(w => w.length > 3 && !r.split(' ').includes(w) && !/^(saint|south|north|east|west|republic|islands|united|states|democratic|central|new|and)$/i.test(w));
        const give = clues.slice(0, -2).find(c => words.some(w => new RegExp(`(^|[^\\p{L}])${w}($|[^\\p{L}])`, 'iu').test(c)));
        if(give) out.push(`${it.n}: "${give}"`);
      }
    }
    return out;
  });
  expect(bad).toEqual([]);
});

test('the landmark drawings have words for screen readers, which never give the answer away', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-landmarks');
  await page.click('#exploreBtn');
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length === 10);
  await mapSettled(page);
  await tapPlace(page, 'Eiffel Tower');
  await expect(page.locator('#exInfo img.lmpic')).toHaveAttribute('alt', 'A drawing of the Eiffel Tower');
  await goHome(page);
  await page.evaluate(() => { window.WGQ_TEST.dailyQuestions = [['eu-landmarks', 'Colosseum', 'pick']]; });
  await page.click('#dailyBtn');
  await expect(page.locator('#findQ img.lmpic')).toHaveAttribute('alt', 'A drawing of a landmark');
});

test('there is only one timer: no stopwatch in Settings or in a game, and the speed badges come from Beat the Clock', async ({page}) => {
  await newPlayer(page);
  await page.click('#homeSettings');
  await expect(page.locator('.panel')).toContainText('Sounds');
  await expect(page.locator('.panel')).not.toContainText('Stopwatch');
  await page.keyboard.press('Escape');
  await openTopic(page, 'Oceania', 'oc-countries');
  await page.click('.modebig[data-mode="practice"]');
  await page.waitForFunction(() => document.querySelectorAll('#map path.st').length > 0);
  await expect(page.locator('#clock')).toBeHidden();
  // Speed Star at 10, Beat the Clock at 20, the secret Lightning at 30
  const earned = async best => page.evaluate(async best => { player.feats = {...(player.feats || {}), beatBest: best}; player.badges = {};
    return (await computeBadges(player)).filter(b => ['speed', 'clock20', 'lightning'].includes(b.id) && b.earned).map(b => b.name).sort(); }, best);
  expect(await earned(9)).toEqual([]);
  expect(await earned(10)).toEqual(['Speed Star']);
  expect(await earned(20)).toEqual(['Beat the Clock', 'Speed Star']);
  expect(await earned(30)).toEqual(['Beat the Clock', 'Lightning', 'Speed Star']);
});
