import { BaseScreen } from './BaseScreen.js';
import { testKeys } from '../constants/testKeys.js';
import { enterText, tap, readText } from '../helpers/flutter.js';

class LoginScreen extends BaseScreen {
  constructor() { super(testKeys.loginScreen); }

  async enterCredentials(account: { email: string; password: string }): Promise<void> {
    await this.waitUntilReady();
    await enterText(testKeys.loginEmailInput, account.email);
    await enterText(testKeys.loginPasswordInput, account.password);
  }

  async submit(): Promise<void> { await tap(testKeys.loginSubmitButton); }
  async errorMessage(): Promise<string> { return readText(testKeys.loginErrorMessage); }
}

export const loginScreen = new LoginScreen();
