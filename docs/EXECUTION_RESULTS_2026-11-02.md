# Execution results

Execution date: **2026-11-02 UTC**. These are actual local observations, separate
from the upstream SUT handoff's historical results.

## Milestone status

| Milestone | Android | iOS |
|---|---|---|
| B1 environment/session/home ValueKey | PASS after explicit instrumented build/install | BLOCKED: Windows, no Xcode/Simulator app |
| B2 required Home → Categories → Home contract smoke | IMPLEMENTED / FAIL: categories_screen absent | IMPLEMENTED / BLOCKED |
| B3 authentication | BLOCKED by B2; not implemented | BLOCKED; not implemented |
| B4 configuration, screens, helpers, data, reporting, docs | IMPLEMENTED; core navigation/context/reporting exercised | IMPLEMENTED; configuration loaded only |

**B2 is not accepted.** The exact required test remains red. Diagnostics prove
that navigation works through a distinct Categories item, but do not replace
the `categories_screen` assertion. No SUT source changes were made to obtain
a green result. Text entry, text/diagnostic reads, scrolling, lifecycle helpers,
native dialog selectors and all planned authentication/commerce scenarios
remain NOT EXECUTED.

## Audited environment

| Item | Observed value |
|---|---|
| Host | Windows 11 Enterprise, 10.0.26200, 64-bit |
| Workspace | D:\GitHub\wearway-automation-webdriverio; separate Git repository |
| Node | 25.0.0 |
| Global npm | 8.19.4, below Appium installation requirement |
| Local npm used for dependency installation | 11.21.1 |
| Java | Microsoft OpenJDK 17.0.21.0.2 |
| Android SDK | D:\sdk\Android; platforms/build-tools 35 and 36 |
| ADB | 1.0.41; platform-tools 37.0.1-15733141; server port 5038 |
| Emulator | emulator-5554; AVD wearway_pixel; sdk_gphone64_x86_64 |
| Android OS | 15, API 35 (queried with getprop) |
| Flutter / Dart | 3.47.9 stable / 3.13.7 |
| WDIO / Appium / Flutter Driver | 10.1.0 / 3.9.0 / 3.10.1 |
| Native drivers | Direct UiAutomator2 8.7.3; Flutter's actual Android proxy 8.4.0 (server 10.6.0); XCUITest 11.17.7 installed |
| iOS | No macOS/Xcode, no available Simulator `.app`; no iOS scenario executed |
| SUT commit | 4073126f91d3050c04779338b675fd5e0bedc68b |
| SUT tracked working tree | Clean before and after build/install/testing |

No global Appium was initially found. All Appium packages/drivers were installed
in this automation project. Existing machine-wide developer tools were preserved.

## App artifact and Phase A verification

APK: `D:\GitHub\wearway\build\app\outputs\flutter-apk\app-debug.apk`.
Package `com.wearway.wearway_flutter`, versionName **1.0.0**, versionCode **1**,
activity `com.wearway.wearway_flutter.MainActivity`, min SDK 24, target SDK 36.

- Initially available APK SHA-256:
  `F2B4D3E71EC8E5C15EFFE22E8F966A32B09146FD7079BAC1C9F72FDD36B6A187`.
- Initial Appium sessions reached Dart VM but the running process lacked
  `ext.flutter.driver`. A same-version installed app may have been reused under
  `noReset`; this does not conclusively identify the original disk APK's contents.
- Executed in the SUT checkout:
  `flutter build apk --debug --target=lib/main_automation.dart --no-pub`.
  **PASS**, exit 0, Gradle reported 117.0s. No SUT source or dependency edits.
- Explicit `adb -s emulator-5554 install -r <apk>`: **PASS**, `Success`.
  No uninstall or data clear was performed.
- Executed rebuilt APK SHA-256:
  `D102E466D1FFB5BA118F00E8A19D20501F61DB653730E5E6CD644E8182C32BAC`.
- Real Appium sessions then established FLUTTER/NATIVE_APP contexts and issued
  successful ValueKey commands. This verifies the extension on Android for
  this installed build; it does not verify iOS Phase A.

Build output is retained locally in `artifacts/instrumented-build.log`.

## Actual scenario results

| UTC observation | Scenario / command | Result | Evidence |
|---|---|---|---|
| 03:18:13 run start | `test:diagnostics:android` | PASS: 2 tests | `artifacts/diagnostics-console-3.log`; session 2cd745a2-58d8-47ca-ad9d-7c60548fc8b7 |
| 03:19:48 | First WW-NAV-001 after build replacement | FAIL: categories_screen=false | `artifacts/smoke-console.log`; session e4b9daf4-315c-45ef-be64-28e15543a1e6 |
| 03:22:49 | Final Windows iOS preflight | BLOCKED, exit 1, no worker/session launched | `artifacts/ios-preflight-final.log` |
| 03:23:56 | Independent WW-ENV-001, including restoration after intentional error | PASS: 1 test | `artifacts/context-independent.log`; session db49a610-3666-4e87-8ae1-8442dc07b6a2 |
| 03:24:39 | Independent WW-DIAG-001 | PASS: 1 test | `artifacts/navigation-independent.log`; session 02d404df-5222-4162-b573-60b63675c4c6 |
| 03:25:18 | Final independent WW-NAV-001 | FAIL: application contract assertion; exit 1 | `artifacts/smoke-final.log`; session 6bf3b2c5-c74b-405b-8d27-cf865cf737de |
| 03:28:44 | Android command without APK environment variable | BLOCKED as expected before server launch | `artifacts/missing-apk-preflight.log` |

Independent commands:

```sh
npm run test:diagnostics:android -- --mochaOpts.grep WW-ENV-001
npm run test:diagnostics:android -- --mochaOpts.grep WW-DIAG-001
npm run test:smoke:android
```

Android runs set process-local `ANDROID_APP_PATH` to the APK above,
`ANDROID_UDID=emulator-5554`, `ANDROID_DEVICE_NAME=wearway_pixel`, and inherited
ADB port 5038. No populated `.env` was committed or required for these runs.

The smoke observed Home, tapped nav_categories, found no categories_screen,
returned via nav_home and verified Home. It then failed on the retained
Categories observation. Separate diagnostics found `category_grid_item_tshirt`
and verified Home was offstage while Categories was open. Source inspection
also found the key only in its declaration. See D002 in the decision log.

## Quality gates and artifacts

| Gate | Status | Evidence / limits |
|---|---|---|
| Dependency install and top-level dependency tree | PASS | npm install; npm list --depth=0; exact versions and lockfile |
| Strict TypeScript | PASS | `npm run typecheck`, exit 0 |
| Both real WDIO config parsers / suite paths | PASS | `npm run config:check`, exit 0; does not launch iOS |
| Required drivers discoverable | PASS | flutter 3.10.1, uiautomator2 8.7.3, xcuitest 11.17.7 via npm |
| Flutter driver doctor | FAIL | Missing HOME required check; optional bundletool, ffmpeg, GStreamer absent |
| Android artifact resolution and explicit installation | PASS | APK path, build log, hashes, adb install success |
| iOS artifact resolution | BLOCKED | Simulator app not available; macOS needed |
| Android Appium / FLUTTER / home_screen | PASS | Actual sessions and ValueKey commands |
| Required B2 smoke | FAIL | SUT categories_screen contract defect |
| Independent execution | PASS for diagnostics; FAIL reproduced for smoke | Three separate final sessions above |
| Native failure screenshot | PASS | 1,314,387-byte PNG from final smoke |
| Flutter render-tree failure attachment | PASS | 2,269,852-byte text artifact from final smoke |
| Allure HTML generation | PASS | `npm run report:generate`, exit 0; artifacts/allure-report/index.html |
| Git hygiene / SUT isolation | PASS | artifacts ignored; SUT clean; no commits/pushes |
| npm audit | FAIL | 76 reported dependency vulnerabilities; details below |

Final smoke evidence folder:
`artifacts/runs/2026-11-02T03-24-44-498Z-be6d1d18/`.
It contains `run.json`, session capabilities/contexts, `results.jsonl`
(`failureKind: APPLICATION_ASSERTION`), `completion.json`, Appium/WDIO logs,
native PNG and render tree. The final screenshot depicts Home because return
navigation is deliberately completed before the retained assertion is evaluated.

The original Flutter screenshot API failed on this toolchain; native capture
was implemented and successfully validated. Allure includes accumulated attempts
and manual reruns as historical results, not only the final run; use this table and
run folders for the final state. Raw logs/attachments are local and gitignored.

## Remaining package findings and blockers

Final `npm audit --json`: **64 moderate, 9 high, 3 critical**, total **76**.
Full output: `artifacts/npm-audit-final.json`. Normal `npm audit fix` was tried;
bundled/shrinkwrapped dependencies could not all be updated. The suggested
forced change to Appium 2.0.1 is incompatible and was not applied. Critical
dependency entries include `@appium/support`, `shell-quote` and `proxy-addr`;
this is a tooling dependency audit, not a proven WearWay application exploit.
Do not claim a vulnerability-free portfolio dependency stack.

Open acceptance blockers:

1. **B2:** SUT owner must attach the existing `categories_screen` key and provide
   a rebuilt instrumented app. This repository deliberately does not edit SUT
   source or disguise the failure.
2. **iOS:** macOS/Xcode/Simulator and instrumented `.app` required. XCUITest
   package installation on Windows does not establish iOS readiness.
3. **B3:** deferred until B2 passes. Seed accounts are verified and centralized;
   no login/logout, invalid-credential, protected-checkout or session-persistence
   test is claimed implemented or passing.

Other unverified areas: native permission flows, SUT iOS location descriptions,
Dev Menu reset/speed controls, gestures, notification lifecycle, shopping,
checkout, and devices/OS versions beyond this emulator. Doctor prerequisites
and npm advisories remain documented separately from the Android runtime pass.
