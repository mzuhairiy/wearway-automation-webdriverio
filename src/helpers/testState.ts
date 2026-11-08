import { selectContext } from './context.js';
import { waitForWidget } from './flutter.js';
import { bottomNavigation } from '../components/BottomNavigation.js';
import { testKeys } from '../constants/testKeys.js';
import { browser } from '@wdio/globals';
import { profileScreen } from '../screens/ProfileScreen.js';

/** Explicit navigation precondition; works with either persona or guest. No data reset. */
export async function prepareNavigation(): Promise<void> {
  await selectContext('FLUTTER');
  await waitForWidget(testKeys.bottomNavBar, 30_000);
  await bottomNavigation.home();
  await waitForWidget(testKeys.homeScreen);
}

/** Explicit fresh process/session, preserving Hive; clears only in-memory route/auth errors. */
export async function relaunchPreservingData(): Promise<void> {
  await browser.reloadSession(); // Platform configs retain noReset=true and forceAppLaunch=true.
  await selectContext('FLUTTER');
  await waitForWidget(testKeys.bottomNavBar, 30_000);
}

/** An explicit auth fixture, never a shared hook. Does not reset cart/settings/seed data. */
export async function prepareGuest(): Promise<void> {
  await relaunchPreservingData();
  await bottomNavigation.profile();
  await profileScreen.waitUntilReady();
  if (await profileScreen.hasLogout()) await profileScreen.logout();
  await waitForWidget(testKeys.loginPromptButton);
}
