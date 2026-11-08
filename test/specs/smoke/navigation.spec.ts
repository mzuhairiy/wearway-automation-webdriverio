import { expect } from '@wdio/globals';
import { prepareNavigation } from '../../../src/helpers/testState.js';
import { homeScreen } from '../../../src/screens/HomeScreen.js';
import { categoriesScreen } from '../../../src/screens/CategoriesScreen.js';
import { bottomNavigation } from '../../../src/components/BottomNavigation.js';

describe('WearWay navigation smoke', () => {
  it('WW-NAV-001 | Home → Categories → Home using the handoff ValueKeys', async () => {
    await prepareNavigation();
    expect(await homeScreen.isPresent()).toBe(true);
    await bottomNavigation.categories();
    // Retain the observation so return-home is exercised even when the key is missing.
    const categoriesPresent = await categoriesScreen.isPresent();
    await bottomNavigation.home();
    expect(await homeScreen.isPresent()).toBe(true);
    expect({ categories_screen: categoriesPresent }).toEqual({ categories_screen: true });
  });
});
