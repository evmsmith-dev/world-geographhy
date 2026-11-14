// Every place on every map can be tapped with a finger: a whole game of Find it on each map, answered by tapping.
// Capitals and flags use the same maps, so for those a few questions check that the question and the tap work.
import { test, expect, newPlayer, goHome, openTopic, startMode, tapPlace, findTarget, REGIONS } from './helpers.js';

test.describe.configure({timeout: 300_000}); // a whole map of taps takes a while

async function playFindIt(page, topicId, limit = Infinity){
  const problems = [];
  let answered = 0;
  while(answered < limit){
    const before = await page.evaluate(() => document.getElementById('findQ').innerHTML);
    if(!(await page.textContent('#findQ')).trim()) break; // no question left: the game is over
    const target = await findTarget(page, topicId);
    expect(target, `the question "${before}" names a place`).toBeTruthy();
    await tapPlace(page, target);
    // wait for the next question (or the end); a wrong tap says "Try again" instead
    await page.waitForFunction(b => { const q = document.getElementById('findQ'); const fb = document.getElementById('feedback').textContent;
      return q.innerHTML !== b || /try again|not quite|already/i.test(fb); }, before, {timeout: 8000});
    const fb = await page.textContent('#feedback');
    if(/try again|not quite|already/i.test(fb)) { problems.push(`${target}: ${fb.trim()}`); break; }
    answered++;
  }
  expect(problems, 'taps that landed on the wrong place').toEqual([]);
  return answered;
}

for(const region of REGIONS){
  test(`${region.name}: every place can be tapped in Find it`, async ({page}) => {
    await newPlayer(page);
    const mapTopics = region.topics.filter(id => !/-(capitals|flags)$/.test(id));
    for(const id of mapTopics){
      await goHome(page);
      await openTopic(page, region.name, id);
      await startMode(page, 'find');
      const count = await page.evaluate(id => window.WGQ_TEST.TOPIC[id].count, id);
      expect(await playFindIt(page, id), `${id}: places found`).toBe(count);
      await expect(page.locator('#tally')).toContainText(`${count} / ${count}`);
    }
    for(const id of region.topics.filter(id => /-(capitals|flags)$/.test(id))){
      await goHome(page);
      await openTopic(page, region.name, id);
      await startMode(page, 'find');
      expect(await playFindIt(page, id, 4), `${id}: questions answered`).toBe(4);
    }
  });
}
