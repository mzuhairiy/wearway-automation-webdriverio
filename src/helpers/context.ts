import { browser } from '@wdio/globals';

export type AppContext = 'FLUTTER' | 'NATIVE_APP';

export async function discoverContexts(): Promise<string[]> {
  const contexts = await browser.getContexts();
  return contexts.map((context) => typeof context === 'string' ? context : context.id);
}

export async function selectContext(target: AppContext): Promise<void> {
  const available = await discoverContexts();
  if (!available.includes(target)) {
    throw new Error(`[FRAMEWORK] ${target} unavailable; discovered: ${available.join(', ')}. Verify the instrumented build and driver.`);
  }
  await browser.switchContext(target);
}

export async function requireContext(target: AppContext): Promise<void> {
  const current = await browser.getContext();
  if (current !== target) throw new Error(`[FRAMEWORK] Expected ${target}, got ${String(current)}; select the context explicitly`);
}

export async function inContext<T>(target: AppContext, action: () => Promise<T>): Promise<T> {
  const previous = await browser.getContext();
  if (typeof previous !== 'string') throw new Error('[FRAMEWORK] Cannot restore an unnamed context');
  await selectContext(target);
  let operationError: unknown;
  try {
    return await action();
  } catch (error) {
    operationError = error;
    throw error;
  } finally {
    try {
      await browser.switchContext(previous);
    } catch (restoreError) {
      if (operationError) throw new AggregateError([operationError, restoreError], '[FRAMEWORK] Operation and context restoration failed');
      throw new Error(`[FRAMEWORK] Could not restore ${previous}`, { cause: restoreError });
    }
  }
}
