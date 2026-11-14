// Screen layout: nothing important is hidden, cut off or pushed off the screen, on phone and iPad.
import { test, expect, newPlayer, goHome, openTopic, startMode } from './helpers.js';

const box = (page, sel) => page.locator(sel).first().boundingBox();

test('the place screen: tabs fit, and the column is centered', async ({page}) => {
  await newPlayer(page);
  await openTopic(page, 'Europe', 'eu-countries');
  const cut = await page.$$eval('#regionTabs button', bs => bs.filter(b => b.scrollWidth > b.clientWidth + 1).map(b => b.textContent));
  expect(cut, 'tab names that are cut off').toEqual([]);
  const m = await page.evaluate(() => { const r = document.getElementById('regionTabs').getBoundingClientRect(); return {left: r.left, right: innerWidth - r.right}; });
  expect(Math.abs(m.left - m.right), 'space left and right of the tabs').toBeLessThan(3);
});

for(const [region, topic] of [['Europe', 'eu-countries'], ['South America', 'sa-countries'], ['North America', 'na-geo'], ['Asia', 'as-flags']]){
  test(`${region}: during Find it the whole game fits on the screen and the zoom buttons don't cover the map`, async ({page}) => {
    await newPlayer(page);
    await openTopic(page, region, topic);
    await startMode(page, 'find');
    await page.waitForTimeout(500); // the map sizes itself to the screen
    const map = await box(page, '#map'), zoom = await box(page, '.zoom'), bar = await box(page, '#play');
    expect(zoom.y, 'zoom buttons start below the map').toBeGreaterThanOrEqual(map.y + map.height - 1);
    const vh = page.viewportSize().height;
    expect(map.y + map.height, 'the map ends on the screen').toBeLessThanOrEqual(vh);
    expect(bar.y, 'the question starts on the screen').toBeLessThan(vh);
    const extra = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    expect(extra, 'pixels the page can scroll').toBeLessThanOrEqual(10);
  });
}
