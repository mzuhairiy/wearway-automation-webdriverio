# Appium Flutter Driver — Readiness (Phase A)

Readiness of the **WearWay SUT** to be driven by Appium Flutter Driver (Android +
iOS). The automation framework (WebdriverIO + TypeScript + Appium 3) lives in a
**separate repo**; this doc only assesses the SUT side. See also `QA-HANDOFF.md` §11.

> **Implementation vs validation.** Implementation (entrypoint + dependency + docs)
> is **done**. **Android** validation was **actually run** on this dev machine
> (build + launch + driver connect + ValueKey smoke = PASS). **iOS** validation is
> `NOT EXECUTED` because the dev machine is Windows (needs macOS + Xcode).

_Last validated: 2026-10-31._

## 1. Validation environment

| Component | Value |
|---|---|
| Dev machine OS | Windows 11 Enterprise (25H2) |
| Flutter | **3.47.9** stable @ `D:\sdk\flutter` |
| Dart | **3.13.7** (satisfies `pubspec` `sdk: ^3.12.2`) |
| JDK | Microsoft OpenJDK **17.0.21** (`C:\Program Files\Microsoft\jdk-17.0.21.21-hotspot`) |
| Android SDK | `D:\sdk\Android` — platform-tools, build-tools 35 & 36, platforms android-35 & android-36, emulator 37.2.x |
| System image | `system-images;android-35;google_apis;x86_64` |
| Emulator (AVD) | `wearway_pixel` (Pixel 7, API 35, x86_64) |
| adb server port | **5038** (`ANDROID_ADB_SERVER_PORT`, persisted) — see Blocker #1 |
| Xcode | N/A (Windows) → iOS NOT EXECUTED |

> Flutter 3.47.9 is newer than the version the repo was built with (3.44.7). The
> newer toolchain surfaced 2 lint/format drifts in existing code — already fixed
> (see Blocker #4). All static gates are now clean.

## 2. Readiness matrix

| Requirement | Android | iOS |
|---|---|---|
| SDK configured | **PASS** | NOT EXECUTED |
| Instrumented build succeeds | **PASS** | NOT EXECUTED |
| Application launches | **PASS** | NOT EXECUTED |
| Flutter Driver extension accessible | **PASS** | NOT EXECUTED |
| ValueKey smoke interaction | **PASS** | NOT EXECUTED |
| Native permission compatibility | PASS (declared) / runtime not yet exercised | BLOCKED (see Blocker #3) |

### Evidence (Android)

- **SDK configured** — `flutter doctor`: Android toolchain + licenses accepted;
  `adb devices` → `emulator-5554 device`, `sys.boot_completed = 1`.
- **Instrumented build** — `flutter build apk --debug --target=lib/main_automation.dart`
  → `√ Built build\app\outputs\flutter-apk\app-debug.apk` (exit 0).
- **App launches + Driver extension + ValueKey smoke** — `flutter drive` with the
  automation entrypoint:
  ```
  VMServiceFlutterDriver: Connecting to Flutter application at http://127.0.0.1:52614/...
  VMServiceFlutterDriver: Connected to Flutter application.   ← ext.flutter.driver OK
  00:03 +1: All tests passed!
  ```
  The smoke waits for `bottom_nav_bar`, then `tap(byValueKey('nav_cart'))` →
  `waitFor(byValueKey('cart_screen'))` succeeds. (Same mechanism as Appium.)
- **Native permission — Android** — `AndroidManifest.xml` already declares
  `ACCESS_FINE/COARSE_LOCATION` + `POST_NOTIFICATIONS`. The runtime permission
  dialog was not tapped in this smoke (needs a native UiAutomator2 context, in the
  automation repo).

### Why iOS is NOT EXECUTED

Dev machine is Windows; an iOS build needs macOS + Xcode. This is not a failure —
it simply can't run here. Run the iOS commands (§3) on macOS to fill in the column.

## 3. Commands (reproducible)

```bash
# Dependencies + codegen
flutter pub get
dart run build_runner build --delete-conflicting-outputs

# Static gates + tests
dart format --output=none --set-exit-if-changed .    # 0 changed
flutter analyze                                       # No issues found!
flutter test                                          # 79 pass

# Instrumented build
flutter build apk --debug --target=lib/main_automation.dart            # Android ✅
flutter build ios --simulator --debug --target=lib/main_automation.dart  # iOS (macOS) — pending

# Launch + driver verification (Android, emulator 'wearway_pixel')
flutter emulators --launch wearway_pixel
flutter run --debug --target=lib/main_automation.dart -d emulator-5554
```

Artifacts:
- Android APK: `build/app/outputs/flutter-apk/app-debug.apk` ✅ present
- iOS Simulator app: `build/ios/iphonesimulator/Runner.app` (→ `appium:app`) — not built yet

### Driver smoke verification script (Flutter Driver) — reference

Used once to prove the driver, then **removed** to keep the SUT minimal (the
automation framework lives in a separate repo). Put it at `test_driver/<name>.dart`
and run `flutter drive --target=lib/main_automation.dart --driver=<file> -d <dev>`:

```dart
import 'package:flutter_driver/flutter_driver.dart';
import 'package:test/test.dart';

void main() {
  late FlutterDriver driver;
  setUpAll(() async => driver = await FlutterDriver.connect());
  tearDownAll(() async => driver.close());

  test('ext.flutter.driver + ValueKey', () async {
    // app.main() runs async init (Hive/seed) BEFORE runApp() → wait for a
    // ValueKey first.
    await _waitForAppReady(driver, 'bottom_nav_bar');
    await driver.tap(find.byValueKey('nav_cart'));
    await driver.waitFor(find.byValueKey('cart_screen'));
  });
}

Future<void> _waitForAppReady(FlutterDriver d, String key) async {
  for (var i = 0; i < 40; i++) {
    try {
      await d.waitFor(find.byValueKey(key),
          timeout: const Duration(seconds: 2));
      return;
    } on Object {
      await Future<void>.delayed(const Duration(milliseconds: 500));
    }
  }
  throw StateError('ValueKey "$key" never appeared');
}
```

## 4. Blockers & SUT issues found

1. **adb port 5037 clash** (RESOLVED, needs automation-repo attention). Port 5037
   (adb default) is held by a local LoopUp service
   (`LoopUp.CloudTelephony.DataUsageMediationApi`, HTTP) → `adb` errors
   `protocol fault (status HTTP)`. Worked around with `ANDROID_ADB_SERVER_PORT=5038`
   (persisted to user env). **The automation repo must use the same adb port** (or
   ensure 5037 is free at run time).
2. **Pre-`runApp()` race** (SUT handoff — important). `app.main()` runs heavy async
   init (Hive, open 8 boxes, seed, notifications) **before** `runApp()`, while
   `enableFlutterDriverExtension()` is already active. Driver commands sent before
   `runApp()` → `No root widget is attached`. **Automation (including Appium) must
   wait for a known ValueKey** (e.g. `bottom_nav_bar` / `app_shell`) before acting.
   Not an app bug; a startup trait.
3. **iOS Info.plist has no permission usage-description strings** (OPEN, Phase B).
   `ios/Runner/Info.plist` lacks `NSLocationWhenInUseUsageDescription` etc. → the
   iOS permission dialog won't appear correctly. Not changed in Phase A (don't
   alter production permission behavior).
4. **Toolchain 3.47.9 > 3.44.7** (RESOLVED). Surfaced 2 drifts in existing code:
   `unnecessary_unawaited` in `hero_banner.dart` & formatting of the checkout test.
   Fixed minimally; `analyze` + `format` are now clean.
5. **iOS Simulator ≠ physical-device IPA** (INFO). A simulator build is not a signed
   artifact for a physical device (needs Apple provisioning).

## 5. Summary

| Area | Status |
|---|---|
| Automation entrypoint (`lib/main_automation.dart`) | ✅ created |
| Dependency `flutter_driver` (dev) | ✅ `pub get` resolves clean |
| `build_runner` codegen | ✅ 55 outputs |
| `dart format` | ✅ 0 changed |
| `flutter analyze` | ✅ No issues found! |
| `flutter test` | ✅ 79 pass |
| Instrumented APK build (Android) | ✅ app-debug.apk |
| Launch + `ext.flutter.driver` + ValueKey smoke (Android) | ✅ flutter drive PASS |
| ValueKey contract / seed / test credentials | ✅ unchanged |
| iOS validation | ⛔ NOT EXECUTED (Windows) |
