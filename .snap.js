const { chromium } = require('playwright');
const path = require('path');
const url = 'file:///' + path.resolve('d:/blog-mdm/index.html').replace(/\\/g, '/');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2000);

  // Force reveals so screenshots show real content (bypass IO transitions)
  await page.addStyleTag({ content: `
    .print-reveal, .archive-plate, .chart-block, .comparison-matrix { opacity:1 !important; transform:none !important; }
    .line-draw { stroke-dashoffset:0 !important; }
    .bar-grow, .area-reveal { transform:scaleX(1) !important; clip-path:none !important; }
    .bar-up { transform:scaleY(1) !important; }
    .donut-ring { stroke-dashoffset: var(--target, 0) !important; }
    .point-fade, .waffle-cell { opacity:1 !important; transform:none !important; }
  `});

  // Slow scroll through to trigger image loads
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= h; y += 800) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(350);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(4000);

  // Full-page screenshot desktop
  try {
    await page.screenshot({ path: 'd:/blog-mdm/.screenshots/full-desktop.png', fullPage: true });
  } catch (e) {
    // fallback: viewport-only if page too tall
    await page.screenshot({ path: 'd:/blog-mdm/.screenshots/full-desktop.png' });
  }

  // Per-section screenshots
  const sections = [
    ['hero', '#hero'],
    ['v1-hero-chart', '.chart-hero-section'],
    ['era1', '#era1'],
    ['era2', '#era2'],
    ['era3', '#era3'],
    ['era4', '#era4'],
    ['era5', '#era5'],
  ];
  for (const [name, sel] of sections) {
    const el = await page.$(sel);
    if (el) {
      try { await el.screenshot({ path: `d:/blog-mdm/.screenshots/${name}.png` }); }
      catch (e) { console.log('skip', name, e.message); }
    }
  }

  await browser.close();
  console.log('DONE');
})();
