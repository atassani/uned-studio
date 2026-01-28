const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Set environment variables to enable auth
  await context.addInitScript(() => {
    window.process = {
      env: {
        NEXT_PUBLIC_DISABLE_AUTH: 'false',
        NEXT_PUBLIC_AREAS_FILE: 'areas-mcq-tests.json',
      },
    };
  });

  console.log('Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  console.log('Page loaded, taking screenshot');
  await page.screenshot({ path: 'debug-1-initial.png' });

  console.log('Looking for anonymous button');
  const anonymousButton = page.getByText('Continuar como Anónimo');
  const isVisible = await anonymousButton.isVisible();
  console.log('Anonymous button visible:', isVisible);

  if (isVisible) {
    console.log('Clicking anonymous button');
    await anonymousButton.click();

    console.log('Waiting for navigation');
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    console.log('Taking screenshot after click');
    await page.screenshot({ path: 'debug-2-after-click.png' });

    const url = page.url();
    console.log('Current URL:', url);

    const pageContent = await page.textContent('body');
    console.log('Page content preview:', pageContent.substring(0, 500));
  }

  await browser.close();
})();
