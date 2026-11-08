import { browser, expect } from '@wdio/globals';
import { prepareNavigation } from '../../../src/helpers/testState.js';
import { discoverContexts, inContext } from '../../../src/helpers/context.js';
import { bottomNavigation } from '../../../src/components/BottomNavigation.js';
import { homeScreen } from '../../../src/screens/HomeScreen.js';
import { widgetExists } from '../../../src/helpers/flutter.js';
import { testKeys } from '../../../src/constants/testKeys.js';

describe('WearWay session diagnostics (does not replace the B2 smoke gate)', () => {
  it('WW-ENV-001 | Flutter readiness and safe native context round trip', async () => {
    await prepareNavigation();
    expect(await discoverContexts()).toEqual(expect.arrayContaining(['FLUTTER', 'NATIVE_APP']));
    await inContext('NATIVE_APP', async () => {
      const rect = await browser.getWindowRect();
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.height).toBeGreaterThan(0);
    });
    expect(await browser.getContext()).toBe('FLUTTER');
    await expect(inContext('NATIVE_APP', async () => {
      throw new Error('Intentional diagnostic error to verify context restoration');
    })).rejects.toThrow('Intentional diagnostic error');
    expect(await browser.getContext()).toBe('FLUTTER');
    expect(await homeScreen.isPresent()).toBe(true);
  });

  it('WW-DIAG-001 | Categories content is reachable and Home can be restored', async () => {
    await prepareNavigation();
    await bottomNavigation.categories();
    // Unique Categories InkWell; category_grid is duplicated on Home and Categories.
    expect(await widgetExists(testKeys.categoryGridItem('tshirt'))).toBe(true);
    expect(await homeScreen.isPresent()).toBe(false);
    await bottomNavigation.home();
    expect(await homeScreen.isPresent()).toBe(true);
  });
});
