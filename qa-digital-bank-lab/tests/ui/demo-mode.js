async function maybePause(page, ms = 2000) {
  if (process.env.DEMO_MODE === 'true') {
    await page.waitForTimeout(ms);
  }
}

module.exports = { maybePause };
