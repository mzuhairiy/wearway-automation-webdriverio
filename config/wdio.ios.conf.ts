import { sharedConfig } from './wdio.shared.conf.js';
import { appPath, optionalEnv } from './environment.js';

const app = appPath('ios');
const udid = optionalEnv('IOS_UDID');
const version = optionalEnv('IOS_PLATFORM_VERSION');
const bundleId = optionalEnv('IOS_BUNDLE_ID');

export const config: WebdriverIO.Config = {
  ...sharedConfig('ios'),
  capabilities: [{
    platformName: 'iOS',
    'appium:automationName': 'Flutter',
    'appium:deviceName': optionalEnv('IOS_DEVICE_NAME') ?? udid ?? 'iOS Simulator',
    ...(app ? { 'appium:app': app } : {}),
    ...(udid ? { 'appium:udid': udid } : {}),
    ...(version ? { 'appium:platformVersion': version } : {}),
    ...(bundleId ? { 'appium:bundleId': bundleId } : {}),
    'appium:noReset': true,
    'appium:fullReset': false,
    'appium:forceAppLaunch': true,
    'appium:shouldTerminateApp': true,
    'appium:newCommandTimeout': 120,
  }],
};
