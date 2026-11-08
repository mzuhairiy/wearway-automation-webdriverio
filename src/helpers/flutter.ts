import { browser } from '@wdio/globals';
import { byValueKey } from 'appium-flutter-finder';
import { requireContext } from './context.js';

export const finder = (key: string): string => byValueKey(key);
const message = (error: unknown): string => error instanceof Error ? error.message : String(error);
const isFlutterWaitTimeout = (error: unknown): boolean => /TimeoutException/.test(message(error));

/** Flutter waitFor excludes offstage widgets; it is not a pixel-visibility assertion. */
export async function waitForWidget(key: string, timeout = 15_000): Promise<void> {
  await requireContext('FLUTTER');
  // The extension can answer before asynchronous bootstrap has attached runApp().
  await browser.waitUntil(async () => {
    try {
      await browser.execute('flutter:waitFor', finder(key), 1_000);
      return true;
    } catch (error) {
      if (isFlutterWaitTimeout(error) || /No root widget is attached/.test(message(error))) return false;
      throw error;
    }
  }, { timeout, interval: 250, timeoutMsg: `[WIDGET] ValueKey "${key}" not discoverable within ${timeout}ms` });
}

/** Only a driver-confirmed wait timeout means false; transport/context errors propagate. */
export async function widgetExists(key: string, timeout = 5_000): Promise<boolean> {
  await requireContext('FLUTTER');
  try {
    await browser.execute('flutter:waitFor', finder(key), timeout);
    return true;
  } catch (error) {
    if (isFlutterWaitTimeout(error)) return false;
    throw error;
  }
}

export async function tap(key: string): Promise<void> {
  await waitForWidget(key);
  await browser.execute('flutter:waitForTappable', finder(key), 10_000);
  await browser.elementClick(finder(key));
}

export async function enterText(key: string, text: string): Promise<void> {
  await tap(key);
  // Replaces focused EditableText contents; no native keyboard assumptions.
  await browser.execute('flutter:enterText', text);
}

export async function readText(key: string): Promise<string> {
  await waitForWidget(key);
  return browser.getElementText(finder(key));
}

export async function widgetDiagnostics(key: string): Promise<unknown> {
  await waitForWidget(key);
  return browser.execute('flutter:getWidgetDiagnostics', finder(key), { includeProperties: true, subtreeDepth: 1 });
}

export async function scrollUntilVisible(scrollableKey: string, targetKey: string, dyScroll = -300): Promise<void> {
  await requireContext('FLUTTER');
  await browser.execute('flutter:scrollUntilVisible', finder(scrollableKey), {
    item: finder(targetKey), dyScroll, dxScroll: 0, waitTimeoutMilliseconds: 15_000,
  });
  await waitForWidget(targetKey);
}
