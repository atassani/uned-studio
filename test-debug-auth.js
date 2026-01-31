// Toggle debug logging here
const DEBUG_LOG = false;
function debugLog(...args) {
  if (DEBUG_LOG) console.log(...args);
}
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set environment variables to enable auth
  await context.addInitScript(() => {
    window.process = {
      env: {
        NEXT_PUBLIC_AREAS_FILE: 'areas-mcq-tests.json',
      },
    };
  });

  debugLog('Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  debugLog('Page loaded, taking screenshot');
  await page.screenshot({ path: 'debug-1-initial.png' });

  debugLog('Looking for anonymous button');
  const anonymousButton = page.getByText('Continuar como Anónimo');
  const isVisible = await anonymousButton.isVisible();
  debugLog('Anonymous button visible:', isVisible);

  if (isVisible) {
    debugLog('Clicking anonymous button');
    await anonymousButton.click();

    debugLog('Waiting for navigation');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    debugLog('Taking screenshot after click');
    await page.screenshot({ path: 'debug-2-after-click.png' });

    const url = page.url();
    debugLog('Current URL:', url);

    const pageContent = await page.textContent('body');
    debugLog('Page content preview:', pageContent.substring(0, 500));
  }

  await browser.close();
})();
