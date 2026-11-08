# Environment setup

## Verified package selection (2026-11-02 UTC)

| Component | Pinned version / requirement |
|---|---|
| WebdriverIO / @wdio packages | 10.1.0; Node >=22.19 |
| Appium | 3.9.0; Node ^20.19 / ^22.12 / >=24, npm >=10 |
| Appium Flutter Driver | 3.10.1, latest 3.x returned by npm; Appium ^3 |
| Flutter finder | 0.3.0 (ESM, named byValueKey export) |
| UiAutomator2 (direct) | 8.7.3 |
| UiAutomator2 used internally by Flutter | 8.4.0 from its published npm-shrinkwrap.json |
| XCUITest | 11.17.7 |
| TypeScript / tsx | 7.0.2 / 4.23.15 |
| dotenv | 18.0.9 |
| Allure CLI | 2.46.1; Java required for HTML generation |
| Project-local npm | 11.21.1 |

Versions/engines/peers were queried from the official npm registry before
installation. Flutter 4.1.0 was the latest overall, but the requested major is
3.x. Native driver 9.x/13.x and npm 12 require a newer runtime range than the
audited Node 25.0.0; the selected versions satisfy this runtime and Flutter 3.x.
Appium's published Flutter shrinkwrap intentionally retains its own UiAutomator2
dependency. The direct installed-driver list alone does not identify the proxy
version actually used in FLUTTER sessions. Both are recorded, not conflated.

All direct dependencies are exact; `package-lock.json` pins transitives. No
global Appium installation or separate global driver installation is needed.
Use a supported Node LTS for a new machine, satisfying all package engines.
Node 25.0.0 is the existing audited machine version, not a recommendation to
install an old non-LTS version.

Official references reviewed:

- [WDIO Flutter introduction](https://webdriver.io/docs/flutter-testing/introduction/)
- [WDIO Flutter configuration](https://webdriver.io/docs/flutter-testing/base-appium-configuration/)
- [WDIO Flutter commands](https://webdriver.io/docs/flutter-testing/writing-tests/)
- [WDIO mobile platforms](https://webdriver.io/docs/platforms/mobile)
- [WDIO Appium service](https://webdriver.io/docs/appium-service/)
- [Appium Flutter Driver](https://github.com/appium/appium-flutter-driver)
- [Appium requirements](https://appium.io/docs/en/latest/quickstart/requirements/)
- [Project-local extensions](https://appium.io/docs/en/latest/guides/managing-exts/)

The requested `/docs/flutter-testing/` URL returned 404; the official child
pages above were accessible. Current upstream main can describe Flutter 4.x;
commands were also verified against the installed 3.10.1 package README/code.

## Install the automation project

With npm >=10:

```sh
npm ci
npm run typecheck
npm run config:check
npm run drivers:list
```

If this machine still resolves global npm 8, bootstrap without replacing it:

```sh
npx --yes --package=npm@11.21.1 npm ci
node node_modules/npm/bin/npm-cli.js --version
```

Use `node node_modules/npm/bin/npm-cli.js ci` for later reproducible installs.
Ordinary `npm run <script>` only invokes the installed binaries; global npm 8
was sufficient for those run commands here, but not for dependency installation.
If `APPIUM_HOME` is already set to an unrelated global installation, run in a
shell without that override so Appium discovers the project-local drivers.
Do not install unpinned drivers globally over this stack.

## Windows Android

Install/configure JDK 17+, Android SDK platform-tools, build-tools and an emulator
system image. Export `JAVA_HOME` and `ANDROID_HOME` pointing to those tools and
put `adb` on PATH. Start the dedicated WearWay emulator in Android Studio or
with `emulator -avd <name>`. Confirm `adb devices -l` shows exactly the intended
device; set `ANDROID_UDID` when multiple devices are connected.

This machine already uses `ANDROID_ADB_SERVER_PORT=5038` because 5037 belongs to
another service. The config passes the same value as `appium:adbPort`; do not
kill the unrelated service. On other machines leave it unset for 5037.

Copy `.env.example` to `.env` and set the APK path and device selection. Relative
paths resolve from this automation repository. To build the existing entrypoint
in the separate SUT checkout (with its dependencies already resolved):

```sh
flutter build apk --debug --target=lib/main_automation.dart --no-pub
```

An APK filename does not prove instrumentation. Verify a real Appium session.
For an already-installed WearWay package, explicitly replace the binary while
preserving Hive data before testing:

```sh
adb -s <udid> install -r <instrumented-apk>
```

`noReset=true` can reuse an installed same-version app; merely changing
`ANDROID_APP_PATH` is insufficient proof that the emulator runs that build.
Keep a hash of the installed artifact. Never uninstall automatically in shared
hooks. `ANDROID_APP_PACKAGE` and `ANDROID_APP_ACTIVITY` are optional because
the driver normally reads the APK; configure them for nonstandard launches.

```powershell
$env:SKIP_IOS='1'
./node_modules/.bin/appium.cmd driver doctor flutter
npm run test:diagnostics:android
npm run test:smoke:android
```

The audited doctor reports missing `HOME` (required by its check), and optional
bundletool, ffmpeg and GStreamer. They were not installed globally for this
task. The actual session gate is recorded separately. APK testing does not
need the optional AAB/video/streaming tools.

## macOS Android

Use the same Node/npm stack, JDK and Android SDK requirements. Set `ANDROID_HOME`
to the SDK path configured in Android Studio. Start an appropriate emulator,
build/provide the instrumented APK, and fill Android variables in `.env`.
Run `SKIP_IOS=1 npx --no-install appium driver doctor flutter`, then the same
Android scripts. No Android implementation depends on PowerShell paths.

## macOS iOS Simulator

Install Xcode, its command-line tools, a Simulator runtime and the SUT's existing
iOS build dependencies. Verify `xcodebuild -version` and
`xcrun simctl list devices available`. Select/boot the Simulator, then build
the existing automation entrypoint from the separate SUT checkout:

```sh
flutter build ios --simulator --debug --target=lib/main_automation.dart --no-pub
```

Set `IOS_APP_PATH` to `build/ios/iphonesimulator/Runner.app`, and set `IOS_UDID`
or both `IOS_DEVICE_NAME` and `IOS_PLATFORM_VERSION`. Set `IOS_BUNDLE_ID` if
needed; it can normally be read from Info.plist. A Simulator `.app` is not a
physical-device IPA. This framework rejects iOS execution on Windows.

```sh
SKIP_ANDROID=1 npx --no-install appium driver doctor flutter
npm run test:diagnostics:ios
npm run test:smoke:ios
```

XCUITest is installed locally, but installation on Windows does not verify WDA,
Xcode compatibility, Simulator launch or permissions. Review the SUT's known
missing location usage descriptions before attempting permission scenarios.

## Server ownership and troubleshooting

The default is a local server managed by `@wdio/appium-service` at 127.0.0.1:4723
with base path `/`. Do not start a second server manually. For an existing
server set `APPIUM_MANAGED=false` and matching host/port/base path. It must use
the same local drivers. Include `--log-filters ./config/appium-log-filters.json`
for external-server auth runs to redact text-entry payloads.

The service allows up to 120 seconds for startup (its upstream default is 30),
and loads only `flutter` at startup. Flutter still loads the platform-native
proxy when a session starts. This is a bounded readiness timeout, not a sleep
or automatic test retry. It addresses the observed tight startup margin;
the exact cause of the user's intermittent timeout is not proven.

If a session cannot connect to Dart, inspect the Appium log for
`ext.flutter.driver` before changing timeouts. Confirm debug/profile mode and
the correct installed entrypoint. If readiness says no root widget is attached,
wait for `bottom_nav_bar`; the app initializes Hive before `runApp()`.
If Categories fails, check that the installed build includes the SUT owner's
2026-11-03 key attachment; see the resolved locator defect in the decision log.

Appium service readiness requires INFO logging; WARN-only logging hides its
startup marker. Keep raw artifacts local. Dependency audit results and remaining
upstream advisories are recorded in the execution report, not treated as passed.
