import { BaseScreen } from './BaseScreen.js';
import { testKeys } from '../constants/testKeys.js';
import { tap, readText, widgetExists, waitForWidget } from '../helpers/flutter.js';

class ProfileScreen extends BaseScreen {
  constructor() { super(testKeys.profileScreen); }
  async openLogin(): Promise<void> { await tap(testKeys.loginPromptButton); }
  async email(): Promise<string> { return readText(testKeys.profileEmail); }
  async isGuest(): Promise<boolean> { return widgetExists(testKeys.loginPromptButton, 1_000); }
  async hasLogout(): Promise<boolean> { return widgetExists(testKeys.logoutButton, 1_000); }
  async logout(): Promise<void> {
    await tap(testKeys.logoutButton);
    await waitForWidget(testKeys.loginPromptButton);
  }
}

export const profileScreen = new ProfileScreen();
