import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { SevereServiceError } from 'webdriverio';
import { projectRoot, server, validateTarget, verifyServerOwnership, type Platform } from './environment.js';

// Inherited by WDIO workers; each invocation keeps separate diagnostic evidence.
process.env.WEARWAY_RUN_ID ??= `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
export const runDirectory = resolve(projectRoot, 'artifacts', 'runs', process.env.WEARWAY_RUN_ID);
export const smokeSpec = resolve(projectRoot, 'test/specs/smoke/navigation.spec.ts');
export const diagnosticSpec = resolve(projectRoot, 'test/specs/diagnostics/session.spec.ts');
export const authenticationSpec = resolve(projectRoot, 'test/specs/smoke/authentication.spec.ts');

export function sharedConfig(platform: Platform): WebdriverIO.Config {
  return {
    capabilities: [],
    runner: 'local',
    hostname: server.host,
    port: server.port,
    path: server.path,
    specs: [smokeSpec, authenticationSpec],
    suites: {
      smoke: [smokeSpec, authenticationSpec], navigation: [smokeSpec],
      authentication: [authenticationSpec], diagnostics: [diagnosticSpec],
    },
    maxInstances: 1,
    logLevel: 'warn',
    outputDir: runDirectory,
    framework: 'mocha',
    mochaOpts: { ui: 'bdd', timeout: 90_000 },
    waitforTimeout: 15_000,
    connectionRetryTimeout: 120_000,
    connectionRetryCount: 0,
    specFileRetries: 0,
    reporters: [
      'spec',
      ['allure', {
        outputDir: resolve(projectRoot, 'artifacts/allure-results'),
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: false,
      }],
    ],
    services: server.managed ? [['appium', {
      logPath: runDirectory,
      appiumStartTimeout: 120_000,
      // The service detects readiness from Appium's INFO listener-started message.
      args: {
        address: server.host, port: server.port, basePath: server.path, logLevel: 'info',
        useDrivers: 'flutter', logFilters: resolve(projectRoot, 'config/appium-log-filters.json'),
      },
    }]] : [],
    async onPrepare() {
      mkdirSync(runDirectory, { recursive: true });
      let artifact: string;
      try {
        artifact = validateTarget(platform);
        await verifyServerOwnership();
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        writeFileSync(resolve(runDirectory, 'blocked.json'), JSON.stringify({
          timestamp: new Date().toISOString(), platform, status: 'BLOCKED', reason,
        }, null, 2));
        // Ordinary onPrepare errors are logged and ignored by WDIO 10.
        throw new SevereServiceError(reason);
      }
      writeFileSync(resolve(runDirectory, 'run.json'), JSON.stringify({
        runId: process.env.WEARWAY_RUN_ID, startedAt: new Date().toISOString(),
        platform, hostOS: process.platform, node: process.version, artifact,
        statePolicy: 'preserve: noReset=true, fullReset=false; no hidden data reset',
      }, null, 2));
    },
    onComplete(exitCode) {
      mkdirSync(runDirectory, { recursive: true });
      writeFileSync(resolve(runDirectory, 'completion.json'), JSON.stringify({
        timestamp: new Date().toISOString(), platform, exitCode,
      }, null, 2));
    },
    async before() {
      const { browser } = await import('@wdio/globals');
      const { selectContext } = await import('../src/helpers/context.js');
      const { waitForWidget } = await import('../src/helpers/flutter.js');
      const { testKeys } = await import('../src/constants/testKeys.js');
      await selectContext('FLUTTER');
      await waitForWidget(testKeys.bottomNavBar, 30_000);
      writeFileSync(resolve(runDirectory, `session-${browser.sessionId}.json`), JSON.stringify({
        sessionId: browser.sessionId, timestamp: new Date().toISOString(),
        contexts: await browser.getContexts(), capabilities: browser.capabilities,
      }, null, 2));
    },
    async afterTest(test, _context, { error, passed }) {
      const { captureFailure, recordResult } = await import('../src/helpers/diagnostics.js');
      recordResult(runDirectory, test.title, passed, error);
      if (!passed) await captureFailure(runDirectory, test.title);
    },
    async onReload(oldSessionId, newSessionId) {
      const { browser } = await import('@wdio/globals');
      writeFileSync(resolve(runDirectory, `session-${newSessionId}.json`), JSON.stringify({
        sessionId: newSessionId, previousSessionId: oldSessionId,
        timestamp: new Date().toISOString(), capabilities: browser.capabilities,
        contexts: await browser.getContexts(), statePolicy: 'preserve Hive during session reload',
      }, null, 2));
    },
    async afterHook(_test, _context, { error, passed }) {
      if (passed) return;
      const { captureFailure, recordResult } = await import('../src/helpers/diagnostics.js');
      recordResult(runDirectory, 'framework hook', false, error);
      await captureFailure(runDirectory, 'framework-hook');
    },
  };
}
