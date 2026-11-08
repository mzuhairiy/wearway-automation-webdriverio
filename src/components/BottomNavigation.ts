import { tap } from '../helpers/flutter.js';
import { testKeys } from '../constants/testKeys.js';

export const bottomNavigation = {
  home: () => tap(testKeys.navHome),
  categories: () => tap(testKeys.navCategories),
  profile: () => tap(testKeys.navProfile),
};
