import { sharedConfig } from './wdio.shared.conf.js';
import { appPath, optionalEnv, portEnv } from './environment.js';

const app = appPath('android');
const udid = optionalEnv('ANDROID_UDID');
const appPackage = optionalEnv('ANDROID_APP_PACKAGE');
const appActivity = optionalEnv('ANDROID_APP_ACTIVITY');

export const config: WebdriverIO.Config = {
  ...sharedConfig('android'),
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'Flutter',
    'appium:deviceName': optionalEnv('ANDROID_DEVICE_NAME') ?? udid ?? 'Android',
    ...(app ? { 'appium:app': app } : {}),
    ...(udid ? { 'appium:udid': udid } : {}),
    ...(appPackage ? { 'appium:appPackage': appPackage } : {}),
    ...(appActivity ? { 'appium:appActivity': appActivity } : {}),
    'appium:adbPort': portEnv('ANDROID_ADB_SERVER_PORT', 5037),
    'appium:noReset': true,
    'appium:fullReset': false,
    'appium:forceAppLaunch': true,
    'appium:newCommandTimeout': 120,
  }],
};
