import { waitForWidget, widgetExists } from '../helpers/flutter.js';

export class BaseScreen {
  constructor(readonly key: string) {}
  async waitUntilReady(): Promise<void> { await waitForWidget(this.key); }
  async isPresent(): Promise<boolean> { return widgetExists(this.key); }
}
