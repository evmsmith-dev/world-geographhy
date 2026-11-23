// The offer to install the game: a card on the home screen and a button in Settings, until the game is installed.
// (Other tests don't see the card: in ?test it shows only when a test sets window.WGQ_INSTALL_TEST.)
import { test, expect, newPlayer, openGame } from './helpers.js';

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';
const testing = page => page.addInitScript(() => { window.WGQ_INSTALL_TEST = true; });
// what Chrome sends when the game can be installed: its own prompt, kept for the Install button
const offer = page => page.evaluate(() => {
  const e = new Event('beforeinstallprompt', {cancelable: true});
  e.prompt = () => { window.__prompted = (window.__prompted || 0) + 1; };
  e.userChoice = Promise.resolve({outcome: 'accepted', platform: 'web'});
  dispatchEvent(e);
  return e.defaultPrevented;
});

test.describe('on Android and computers', () => {
  test.use({userAgent: ANDROID});
  test('the card shows once the browser can install, and Install opens the browser\'s own prompt', async ({page}) => {
    await testing(page); await newPlayer(page);
    await expect(page.locator('#installCard')).toBeHidden(); // nothing to offer until the browser says it can install
    expect(await offer(page), 'the browser\'s own mini bar is replaced by the card').toBe(true);
    await expect(page.locator('#installCard')).toBeVisible();
    await page.click('#installBtn');
    expect(await page.evaluate(() => window.__prompted)).toBe(1);
    await expect(page.locator('#installCard')).toBeHidden(); // a prompt can only be used once
    // installed: nothing left to offer, here or in Settings
    await page.evaluate(() => dispatchEvent(new Event('appinstalled')));
    await page.click('#homeSettings');
    await expect(page.locator('.panel h2')).toHaveText('Settings');
    await expect(page.locator('#doInstall')).toHaveCount(0);
  });
});

test.describe('on iPhone and iPad', () => {
  test.use({userAgent: IPHONE});
  test('the card shows the Add to Home Screen steps; Not now hides it for good, and Settings still offers it', async ({page}) => {
    await testing(page); await newPlayer(page);
    await expect(page.locator('#installCard')).toBeVisible();
    await page.click('#installBtn');
    await expect(page.locator('.installsteps')).toContainText('Add to Home Screen');
    await page.click('#installOk');
    await expect(page.locator('.installsteps')).toHaveCount(0);
    await page.click('#installLater');
    await expect(page.locator('#installCard')).toBeHidden();
    await openGame(page); // opening the game again: still hidden
    await expect(page.locator('#scrHome')).toBeVisible();
    await expect(page.locator('#installCard')).toBeHidden();
    await page.click('#homeSettings');
    await page.click('#doInstall');
    await expect(page.locator('.installsteps')).toBeVisible();
  });

  test('once the game is installed (opened from the home screen), nothing offers to install it', async ({page}) => {
    await testing(page);
    await page.addInitScript(() => { const mm = window.matchMedia.bind(window); window.matchMedia = q => /display-mode: standalone/.test(q) ? {matches: true, media: q, addEventListener(){}, removeEventListener(){}, addListener(){}, removeListener(){}} : mm(q); });
    await newPlayer(page);
    await expect(page.locator('#installCard')).toBeHidden();
    await page.click('#homeSettings');
    await expect(page.locator('.panel h2')).toHaveText('Settings');
    await expect(page.locator('#doInstall')).toHaveCount(0);
  });
});
