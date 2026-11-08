# WearWay mobile automation

Separate QA automation repository for the [WearWay Flutter SUT](https://github.com/mzuhairiy/wearway).
TypeScript strict mode, WebdriverIO 10, Mocha/WDIO Expect, Appium 3,
Appium Flutter Driver 3.x, Screen Objects and Allure. No Flutter application
source or binaries are stored here.

**Current status (2026-11-03):** Android B1/B2 **PASS** with the SUT owner's
Categories key fix. B3 authentication and session persistence **PASS**: six
scenarios cover guest login entry, both seeded personas, invalid password,
logout and identity after relaunch. B4 foundations are **IMPLEMENTED**; unused
helpers still require device validation. iOS is **BLOCKED** on this Windows host.
See [actual results](docs/EXECUTION_RESULTS.md).

## Install

Use Node satisfying the package engines (a current compatible LTS is preferred)
and npm >=10. On a configured machine:

```sh
npm ci
npm run typecheck
npm run config:check
npm run drivers:list
```

The audited Windows machine has npm 8 globally. Bootstrap a local npm without
changing global tools:

```sh
npx --yes --package=npm@11.21.1 npm ci
```

Appium and all three drivers are project dependencies. Do not separately
install global drivers. The verified stack and official compatibility sources
are in [environment setup](docs/ENVIRONMENT_SETUP.md).

## Android

1. Start a dedicated emulator/device and confirm `adb devices -l`.
2. Obtain a debug/profile APK built from the SUT's existing
   `lib/main_automation.dart`. A normal debug build does not expose the extension.
3. For an existing install, explicitly run `adb -s <udid> install -r <apk>` to
   replace the binary while preserving data. Default sessions use `noReset=true`.
4. Copy `.env.example` to `.env`. Fill `ANDROID_APP_PATH`, `ANDROID_UDID` and/or
   `ANDROID_DEVICE_NAME`. Use the same ADB server port in the shell and config.
5. Run the diagnostic suite, then the contract gate:

```sh
npm run test:diagnostics:android
npm run test:smoke:android
```

`npm run test:android` and the smoke suite run navigation plus authentication.
For navigation only, use `npm run test:android -- --suite navigation`.
For authentication only, use `npm run test:android -- --suite authentication`.
The installed build must include the SUT owner's Categories screen key fix.

## iOS

Requires macOS, Xcode, a booted Simulator and an instrumented Simulator `.app`.
Set `IOS_APP_PATH`, plus `IOS_UDID` or `IOS_DEVICE_NAME`/`IOS_PLATFORM_VERSION`.

```sh
npm run test:diagnostics:ios
npm run test:smoke:ios
```

`npm run test:ios` runs the same shared navigation/authentication smoke. Windows execution stops with a
clear BLOCKED preflight error. A physical-device IPA is outside this setup.

## Independent runs and state

```sh
npm run test:diagnostics:android -- --mochaOpts.grep WW-ENV-001
npm run test:diagnostics:android -- --mochaOpts.grep WW-DIAG-001
npm run test:android -- --spec ./test/specs/smoke/navigation.spec.ts
npm run test:android -- --suite authentication --mochaOpts.grep WW-AUTH-004
```

Navigation explicitly selects Flutter and returns to Home. Each auth test calls
`prepareGuest`: reload the app/session preserving Hive, open Profile and log out
if needed. Session persistence checks perform another relaunch after login.
No shared hook clears app data. Use a dedicated device and the explicit reset
policies in [test strategy](docs/TEST_STRATEGY.md).
The two verified seed personas are centralized in `src/data/accounts.ts` with
optional environment overrides. Only synthetic local test accounts are allowed.

## Reporting and troubleshooting

```sh
npm run report:generate
npm run report:open
```

Java is needed to generate Allure HTML. Allure results accumulate under
`artifacts/allure-results`; archive/clear that directory deliberately before a
new reporting batch. Run-specific logs, session metadata, result JSONL,
screenshots and render trees live under `artifacts/runs/`. Generated content
and local environment files are ignored by Git.

WDIO owns the Appium server by default. If one is already running, either choose
a free port or use `APPIUM_MANAGED=false` with matching server settings. Do not
launch a duplicate server. Managed startup now allows 120 seconds and loads only
Flutter. INFO logging retains the service's readiness message; text-entry
payloads are filtered. An external server should also use
`--log-filters ./config/appium-log-filters.json`.
Missing `ext.flutter.driver` means verify the actual
installed binary/entrypoint before increasing timeouts. Native selectors need
NATIVE_APP; ValueKey finders need FLUTTER. See the
[decision log](docs/QA_DECISION_LOG.md) for investigated failures.

Dependency installation is verified, but npm audit still reports upstream and
bundled advisories; this is not a clean security audit. Details and limits are
in the execution report. No forced downgrade to Appium 2 was applied.

## Portfolio documentation

- [Test strategy](docs/TEST_STRATEGY.md)
- [Test case matrix](docs/TEST_CASE_MATRIX.md)
- [Architecture and command semantics](docs/AUTOMATION_ARCHITECTURE.md)
- [Environment and verified stack](docs/ENVIRONMENT_SETUP.md)
- [Execution results](docs/EXECUTION_RESULTS.md)
- [QA decisions and defects](docs/QA_DECISION_LOG.md)
- [SUT handoff snapshot](docs/sut/QA-HANDOFF.md) and [provenance](docs/sut/PROVENANCE.md)

No commits or pushes are created by setup or test scripts.
