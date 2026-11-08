import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { browser } from '@wdio/globals';
import { addAttachment } from '@wdio/allure-reporter';
import { inContext } from './context.js';
import { accounts, invalidLogin } from '../data/accounts.js';

function redactPasswords(content: string): string {
  for (const value of [invalidLogin.password, accounts.primary.password, accounts.secondary.password]) {
    content = content.replaceAll(value, '[REDACTED]');
  }
  return content;
}

export function recordResult(directory: string, title: string, passed: boolean, error?: Error): void {
  mkdirSync(directory, { recursive: true });
  appendFileSync(resolve(directory, 'results.jsonl'), `${JSON.stringify({
    timestamp: new Date().toISOString(), sessionId: browser.sessionId, title,
    status: passed ? 'PASS' : 'FAIL',
    failureKind: passed ? null : error && (
      'matcherResult' in error || error.name === 'AssertionError' || error.message.startsWith('expect(')
    ) ? 'APPLICATION_ASSERTION' : 'FRAMEWORK_OR_ENVIRONMENT',
    error: error ? redactPasswords(error.message) : undefined,
  })}\n`);
}

export async function captureFailure(directory: string, title: string): Promise<void> {
  const name = `${Date.now()}-${title.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 80)}`;
  // Best-effort attachments must not replace the original test failure.
  for (const capture of [
    async () => {
      // Native screenshot works even when the Dart VM cannot capture a Flutter image.
      const screenshot = await inContext('NATIVE_APP', () => browser.takeScreenshot());
      writeFileSync(resolve(directory, `${name}.png`), Buffer.from(screenshot, 'base64'));
      addAttachment('Failure screenshot', Buffer.from(screenshot, 'base64'), 'image/png');
    },
    async () => {
      const tree = await inContext('FLUTTER', () => browser.execute('flutter:getRenderTree'));
      const content = redactPasswords(typeof tree === 'string' ? tree : JSON.stringify(tree, null, 2));
      writeFileSync(resolve(directory, `${name}-render-tree.txt`), content);
      addAttachment('Flutter render tree', content, 'text/plain');
    },
  ]) {
    try { await capture(); } catch {
      console.warn('[DIAGNOSTICS] An attachment was unavailable; original result retained.');
    }
  }
}
