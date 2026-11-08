import { config as loadEnv } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { createServer } from 'node:net';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
loadEnv({ path: resolve(projectRoot, '.env'), quiet: true });

export function optionalEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function portEnv(name: string, fallback: number): number {
  const value = Number(optionalEnv(name) ?? fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`[CONFIG] ${name} must be an integer between 1 and 65535`);
  }
  return value;
}

const managedValue = optionalEnv('APPIUM_MANAGED') ?? 'true';
if (!['true', 'false'].includes(managedValue)) {
  throw new Error('[CONFIG] APPIUM_MANAGED must be true or false');
}
export const server = {
  host: optionalEnv('APPIUM_HOST') ?? '127.0.0.1',
  port: portEnv('APPIUM_PORT', 4723),
  path: optionalEnv('APPIUM_BASE_PATH') ?? '/',
  managed: managedValue === 'true',
};
if (!server.path.startsWith('/')) throw new Error('[CONFIG] APPIUM_BASE_PATH must start with /');

export type Platform = 'android' | 'ios';

export function appPath(platform: Platform): string | undefined {
  const value = optionalEnv(`${platform.toUpperCase()}_APP_PATH`);
  return value ? resolve(projectRoot, value) : undefined;
}

export function validateTarget(platform: Platform): string {
  if (platform === 'ios' && process.platform !== 'darwin') {
    throw new Error('[ENVIRONMENT BLOCKED] iOS Simulator execution requires macOS and Xcode');
  }
  const prefix = platform.toUpperCase();
  const artifact = appPath(platform);
  if (!artifact || !existsSync(artifact)) {
    throw new Error(`[ENVIRONMENT BLOCKED] ${prefix}_APP_PATH must resolve to an instrumented app`);
  }
  const isValid = platform === 'android'
    ? artifact.endsWith('.apk') && statSync(artifact).isFile()
    : artifact.endsWith('.app') && statSync(artifact).isDirectory() && existsSync(resolve(artifact, 'Info.plist'));
  if (!isValid) throw new Error(`[ENVIRONMENT BLOCKED] Expected ${platform === 'android' ? '.apk file' : 'Simulator .app bundle'}: ${artifact}`);
  if (!optionalEnv(`${prefix}_UDID`) && !optionalEnv(`${prefix}_DEVICE_NAME`)) {
    throw new Error(`[CONFIG] Set ${prefix}_UDID or ${prefix}_DEVICE_NAME to select the test device`);
  }
  if (platform === 'ios' && !optionalEnv('IOS_UDID') && !optionalEnv('IOS_PLATFORM_VERSION')) {
    throw new Error('[CONFIG] Set IOS_PLATFORM_VERSION when selecting a Simulator by name');
  }
  return artifact;
}

export async function verifyServerOwnership(): Promise<void> {
  if (!server.managed) return;
  await new Promise<void>((resolvePromise, reject) => {
    const probe = createServer();
    probe.once('error', (error) => reject(new Error(
      `[ENVIRONMENT BLOCKED] Cannot own Appium at ${server.host}:${server.port}. Use a free port or APPIUM_MANAGED=false for your existing server.`,
      { cause: error },
    )));
    probe.listen(server.port, server.host, () => probe.close((error) => error ? reject(error) : resolvePromise()));
  });
}
