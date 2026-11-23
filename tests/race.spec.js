// Race a friend: two players race to find the same places. The tests use the game's local stand-in for Firebase
// (window.WGQ_RACE_BACKEND = 'local'), so two tabs in one browser race each other the way two phones would.
import { test, expect, newPlayer, goHome, openGame, openTopic, tapPlace, mapSettled } from './helpers.js';

// quicker races for the tests: 3 places, short waits
const QUICK = {rounds: 3, round: 12000, catchup: 4000, count: 400, reveal: 1500, lock: 300, away: 1500};
async function quick(p, extra = {}){
  await p.evaluate(([times, items]) => { window.WGQ_TEST.raceTimes = times; window.WGQ_TEST.raceItems = items; }, [{...QUICK, ...extra}, ['France', 'Spain', 'Italy']]);
}
// A second device: another tab in the same browser, failing the test on any error like the first one does
async function secondTab(page){
  const p = await page.context().newPage(), errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if(m.type() === 'error' && !/Failed to load resource|error occurred when fetching the script|Failed to update a ServiceWorker/.test(m.text())) errors.push(m.text()); });
  await goHome(p);
  // another player, so each keeps their own progress (and has another avatar)
  await p.click('#homePlayer'); await p.click('#addPlayer');
  await p.fill('#pName', 'Kofi'); await p.click('#pForm button[type=submit]');
  if(await p.locator('#helpOk').isVisible()) await p.click('#helpOk');
  await expect(p.locator('#scrHome')).toBeVisible();
  return {p, errors};
}
async function startHosting(page, topic = 'eu-countries'){
  await page.click('#raceBtn');
  await page.click(`.panel [data-race-topic="${topic}"]`);
  await expect(page.locator('#raceBox .racecode')).toBeVisible();
  return (await page.locator('#raceBox .racecode').textContent()).trim();
}
async function joinWith(p, typed){
  await p.click('#raceBtn');
  await p.fill('#raceCodeIn', typed);
  await p.click('#raceJoinForm button[type=submit]');
}
// (the stand-in needs shared workers: every browser the game is tested on has them, and a test says so if one doesn't)
const setup = async page => {
  await page.context().addInitScript(() => { window.WGQ_RACE_BACKEND = 'local'; });
  await newPlayer(page);
  expect(await page.evaluate(() => 'SharedWorker' in window), 'this browser has shared workers, for the stand-in for Firebase').toBe(true);
};

test('Race a friend only shows up once online play is set up', async ({page}) => {
  await page.context().addInitScript(() => { window.WGQ_RACE_BACKEND = 'off'; }); // as if RACE_FIREBASE were null
  await newPlayer(page);
  await expect(page.locator('#homeGroups .mysterybtn')).toBeVisible();
  await expect(page.locator('#raceBtn')).toHaveCount(0);
  await openTopic(page, 'Europe', 'eu-countries');
  await expect(page.locator('.racemode')).toHaveCount(0);
});

test('two players race: same places, 3 tries, a head start, points, the end screen and a rematch', async ({page}) => {
  await setup(page); await quick(page);
  const code = await startHosting(page);
  expect(code).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
  await expect(page.locator('#raceBox')).toContainText('Waiting for your friend to join');

  const {p: guest, errors} = await secondTab(page); await quick(guest);
  await joinWith(guest, code.toLowerCase().replace(/^(...)/, '$1 ')); // typed in small letters, with a space: still the code
  await expect(guest.locator('#raceBox')).toContainText('Waiting for');
  // the host gives the guest a 6-second head start, and both see it
  await expect(page.locator('[data-race="start"]')).toBeEnabled();
  await page.click('[data-head="b"][data-secs="6"]');
  await expect(guest.locator('#raceBox')).toContainText('You get a 6-second head start.');
  await page.click('[data-race="start"]');

  // place 1: the guest uses up 3 tries (a second tap on the same wrong place doesn't count), then the host finds it
  for(const p of [page, guest]) await expect(p.locator('#findQ')).toHaveText('Find France', {timeout: 15_000});
  await mapSettled(page); await mapSettled(guest);
  await tapPlace(guest, 'Germany');
  await expect(guest.locator('#feedback')).toContainText('2 tries left');
  await guest.waitForTimeout(400);
  await tapPlace(guest, 'Germany');
  await expect(guest.locator('#feedback')).toContainText('Germany again');
  await tapPlace(guest, 'Poland'); await guest.waitForTimeout(400);
  await tapPlace(guest, 'Norway');
  await expect(guest.locator('#feedback')).toContainText('Out of tries');
  await expect(page.locator('#sub')).toContainText('out of tries');
  await tapPlace(page, 'France');
  await expect(guest.locator('#feedback')).toContainText(/It's France\. You missed it/);
  await expect(page.locator('#tally')).toContainText('You 2');

  // place 2: only the guest finds it; the host's catch-up time runs out
  for(const p of [page, guest]) await expect(p.locator('#findQ')).toHaveText('Find Spain', {timeout: 15_000});
  await mapSettled(guest); await tapPlace(guest, 'Spain');
  await expect(page.locator('#selLabel')).toContainText('Hurry!');
  await expect(page.locator('#sub')).toContainText('found it!');
  await expect(page.locator('#feedback')).toContainText(/It's Spain\. You missed it/, {timeout: 10_000});

  // place 3: both find it, the host first, but the guest's head start makes the guest fastest
  for(const p of [page, guest]) await expect(p.locator('#findQ')).toHaveText('Find Italy', {timeout: 15_000});
  await mapSettled(page); await mapSettled(guest);
  await tapPlace(page, 'Italy'); await tapPlace(guest, 'Italy');

  await expect(guest.locator('#raceBox h2')).toHaveText('You won, 4 to 3!', {timeout: 15_000});
  await expect(page.locator('#raceBox h2')).toHaveText('🐼 won, 4 to 3!');
  await expect(page.locator('#raceBox')).toContainText('Together you found 4 of 6!');
  await expect(page.locator('#raceBox .racelist tbody tr')).toHaveCount(3);
  await expect(page.locator('[data-race="practice"]')).toHaveText('Practice these (1)');
  await expect(guest.locator('[data-race="practice"]')).toHaveText('Practice these (1)');

  // racing counts as practice: the host found France on the first try
  const learned = await page.evaluate(async () => (await DB.all('items')).filter(r => r.pid === player.id && r.topic === 'eu-countries' && r.last === 'right').map(r => r.item).sort());
  expect(learned).toEqual(['France', 'Italy']);

  // a rematch: the guest starts it, the host joins it from the end screen
  await guest.click('[data-race="rematch"]');
  await expect(guest.locator('#raceBox .racecode')).toBeVisible();
  await expect(page.locator('[data-race="rematch"]')).toContainText('wants a rematch! Join');
  await page.click('[data-race="rematch"]');
  await expect(guest.locator('[data-race="start"]')).toBeEnabled();
  await expect(page.locator('#raceBox')).toContainText('to start the race');
  // nobody starts it: the player who didn't make it cancels, and the other one is told
  await page.click('[data-race="cancel"]');
  await expect(page.locator('#scrHome')).toBeVisible();
  await expect(guest.locator('#raceBox')).toContainText('canceled the race.');
  await guest.click('[data-race="home"]');
  await expect(guest.locator('#scrHome')).toBeVisible();
  expect(errors, 'errors on the second tab').toEqual([]);
});

test('a race that never starts can always be canceled: before anyone joins, by either player, and with the back button', async ({page}) => {
  await setup(page); await quick(page);
  const {p: guest, errors} = await secondTab(page); await quick(guest);

  // the host cancels before anyone joins: the code no longer works
  let code = await startHosting(page);
  await page.click('[data-race="cancel"]');
  await expect(page.locator('#scrHome')).toBeVisible();
  await expect(page.locator('.toast')).toContainText('Race canceled.');
  await joinWith(guest, code);
  await expect(guest.locator('#raceBox')).toContainText("There's no race with the code");
  await guest.click('[data-race="home"]');

  // the guest cancels after joining: the host is told
  code = await startHosting(page);
  await joinWith(guest, code);
  await expect(guest.locator('[data-race="cancel"]')).toBeVisible();
  await guest.click('[data-race="cancel"]');
  await expect(guest.locator('#scrHome')).toBeVisible();
  await expect(page.locator('#raceBox')).toContainText('canceled the race.');
  await expect(page.locator('[data-race="start"]')).toHaveCount(0);
  await page.click('[data-race="home"]');

  // started from a place's screen, then the host leaves with the phone's back button: canceled for the guest too
  await openTopic(page, 'Europe', 'eu-flags');
  await page.click('.racemode');
  await expect(page.locator('#raceBox .racecode')).toBeVisible();
  code = (await page.locator('#raceBox .racecode').textContent()).trim();
  await joinWith(guest, code);
  await expect(page.locator('[data-race="start"]')).toBeEnabled();
  await page.goBack();
  await expect(guest.locator('#raceBox')).toContainText('canceled the race.');
  await guest.click('[data-race="home"]');

  // nobody joins in time: the race runs out of time before it starts
  await page.click('#regionBack');
  await quick(page, {lobby: 1500});
  await startHosting(page);
  await expect(page.locator('#raceBox')).toContainText('ran out of time before it started', {timeout: 10_000});
  await expect(page.locator('[data-race="cancel"]')).toHaveCount(0);
  await page.click('[data-race="home"]');
  await expect(page.locator('#scrHome')).toBeVisible();

  // a code that was never made
  await joinWith(guest, 'Q2W3E4');
  await expect(guest.locator('#raceBox')).toContainText("There's no race with the code");
  expect(errors, 'errors on the second tab').toEqual([]);
});

test('a player who leaves in the middle of a race ends it for both, and a join link joins the race', async ({page}) => {
  await setup(page); await quick(page);
  const code = await startHosting(page);
  // the friend opens the link
  const guest = await page.context().newPage(), errors = [];
  guest.on('pageerror', e => errors.push(e.message));
  await guest.goto(`/?test&race=${code}`);
  await expect(guest.locator('#raceBox')).toContainText('Waiting for', {timeout: 15_000});
  expect(new URL(guest.url()).search, 'the code leaves the address once used').toBe('?test');
  await quick(guest);
  await expect(page.locator('[data-race="start"]')).toBeEnabled();
  await page.click('[data-race="start"]');
  await expect(guest.locator('#findQ')).toHaveText('Find France', {timeout: 15_000});
  // ← asks first
  await guest.click('#backHome');
  await guest.click('#dlgYes');
  await expect(guest.locator('#scrHome')).toBeVisible();
  await expect(page.locator('#raceBox h2')).toContainText('had to go');
  await expect(page.locator('[data-race="rematch"]')).toHaveCount(0);
  expect(errors, 'errors on the second tab').toEqual([]);
});

test('points: 2 for the fastest find after head starts, 1 for any other find, both 2 for a near tie', async ({page}) => {
  await openGame(page);
  const got = await page.evaluate(() => {
    const r = {items: ['A', 'B', 'C'], head: {a: 0, b: 4}, rounds: [
      {at: 0, end: 1, a: {found: true, ms: 3000}, b: {found: true, ms: 6500}}, // b: 6.5 s less a 4 s head start beats 3 s
      {at: 0, end: 1, a: {found: true, ms: 3000}, b: {found: true, ms: 7030}}, // 3.03 s against 3 s: a tie
      {at: 0, end: 1, a: {found: false, ms: 0}},                                // nobody found it
    ]};
    return raceScore(r).list.map(x => x.pts);
  });
  expect(got).toEqual([{a: 1, b: 2}, {a: 2, b: 2}, {a: 0, b: 0}]);
});
