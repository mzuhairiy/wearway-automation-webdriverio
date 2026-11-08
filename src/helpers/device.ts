import { browser } from '@wdio/globals';
import { inContext, selectContext } from './context.js';
import { waitForWidget } from './flutter.js';
import { testKeys } from '../constants/testKeys.js';

/** Requires the package/bundle identifier of the test app; never clears Hive data. */
export async function restartPreservingData(appId: string): Promise<void> {
  if (!appId.trim()) throw new Error('[CONFIG] A package/bundle identifier is required');
  await inContext('NATIVE_APP', async () => {
    await browser.terminateApp(appId);
  });
  // Flutter driver's activateApp reconnects to the new Dart VM. Native activation alone does not.
  await selectContext('FLUTTER');
  await browser.activateApp(appId);
  await waitForWidget(testKeys.bottomNavBar, 30_000);
}

export async function backgroundAndResume(seconds: number): Promise<void> {
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('[CONFIG] Background duration must be positive');
  await inContext('NATIVE_APP', () => browser.background(seconds));
  await selectContext('FLUTTER');
  await waitForWidget(testKeys.bottomNavBar);
}
