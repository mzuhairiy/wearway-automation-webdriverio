import { expect } from '@wdio/globals';
import { accounts, invalidLogin } from '../../../src/data/accounts.js';
import { prepareGuest, relaunchPreservingData } from '../../../src/helpers/testState.js';
import { loginScreen } from '../../../src/screens/LoginScreen.js';
import { profileScreen } from '../../../src/screens/ProfileScreen.js';
import { homeScreen } from '../../../src/screens/HomeScreen.js';
import { bottomNavigation } from '../../../src/components/BottomNavigation.js';
import { widgetExists } from '../../../src/helpers/flutter.js';
import { testKeys } from '../../../src/constants/testKeys.js';

describe('WearWay authentication smoke', () => {
  it('WW-AUTH-001 | Guest can open the login form', async () => {
    await prepareGuest();
    expect(await profileScreen.isGuest()).toBe(true);
    await profileScreen.openLogin();
    expect(await loginScreen.isPresent()).toBe(true);
    expect(await widgetExists(testKeys.loginEmailInput)).toBe(true);
    expect(await widgetExists(testKeys.loginPasswordInput)).toBe(true);
  });

  for (const [id, persona] of [['WW-AUTH-002', 'primary'], ['WW-AUTH-003', 'secondary']] as const) {
    it(`${id} | ${persona} seeded persona can log in`, async () => {
      await prepareGuest();
      await profileScreen.openLogin();
      await loginScreen.enterCredentials(accounts[persona]);
      await loginScreen.submit();
      await homeScreen.waitUntilReady();
      await bottomNavigation.profile();
      expect(await profileScreen.email()).toBe(accounts[persona].email);
      expect(await profileScreen.isGuest()).toBe(false);
    });
  }

  it('WW-AUTH-004 | Invalid password is rejected', async () => {
    await prepareGuest();
    await profileScreen.openLogin();
    await loginScreen.enterCredentials(invalidLogin);
    await loginScreen.submit();
    // SUT user_repository.dart: wrongPassword; text is an assertion, never a locator.
    expect(await loginScreen.errorMessage()).toBe('Password salah.');
    expect(await loginScreen.isPresent()).toBe(true);
    // A cold start verifies no authenticated identity was persisted by the rejected login.
    await relaunchPreservingData();
    await bottomNavigation.profile();
    expect(await profileScreen.isGuest()).toBe(true);
  });

  it('WW-AUTH-005 | Logged-in customer can log out', async () => {
    await prepareGuest();
    await profileScreen.openLogin();
    await loginScreen.enterCredentials(accounts.primary);
    await loginScreen.submit();
    await homeScreen.waitUntilReady();
    await bottomNavigation.profile();
    expect(await profileScreen.email()).toBe(accounts.primary.email);
    await profileScreen.logout();
    expect(await profileScreen.isGuest()).toBe(true);
    expect(await widgetExists(testKeys.profileEmail, 1_000)).toBe(false);
  });

  it('WW-LIFE-001 | Session identity survives app relaunch', async () => {
    await prepareGuest();
    await profileScreen.openLogin();
    await loginScreen.enterCredentials(accounts.primary);
    await loginScreen.submit();
    await homeScreen.waitUntilReady();
    await bottomNavigation.profile();
    expect(await profileScreen.email()).toBe(accounts.primary.email);
    await relaunchPreservingData();
    await bottomNavigation.profile();
    expect(await profileScreen.email()).toBe(accounts.primary.email);
    expect(await profileScreen.isGuest()).toBe(false);
    await profileScreen.logout();
  });
});
