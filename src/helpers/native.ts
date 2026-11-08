import { browser } from '@wdio/globals';
import { inContext } from './context.js';

export function mobilePlatform(): 'android' | 'ios' {
  if (browser.isAndroid) return 'android';
  if (browser.isIOS) return 'ios';
  throw new Error('[FRAMEWORK] Native mobile operations require Android or iOS');
}

// Caller supplies verified OS/version-specific selectors. No generic "Allow" XPath.
export async function tapNative(selectors: { android: string; ios: string }): Promise<void> {
  const selector = selectors[mobilePlatform()];
  await inContext('NATIVE_APP', async () => {
    const element = await browser.$(selector);
    await element.waitForDisplayed({ timeout: 10_000 });
    await element.click();
  });
}
