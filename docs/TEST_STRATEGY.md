# Test strategy

WearWay is a local Hive application. There is no API/backend to seed or mock.
The initial release gate is a real Flutter Driver connection followed by shared
Home → Categories → Home navigation. Contract failures remain failing assertions.
Diagnostic passes do not replace that gate. B2 passed on Android after the SUT
owner attached the missing screen key on 2026-11-03. B3 now covers both personas,
guest login entry, invalid password, logout and session persistence. Shopping
and protected-checkout coverage are intentionally deferred.

## Risk priorities and test levels

| Priority | Risk | Coverage approach |
|---|---|---|
| P0 | Wrong build, missing extension, native/Flutter context confusion | Real session, known ValueKey readiness, native round trip |
| P0 | Broken navigation or inaccessible contract keys | Shared navigation smoke, on-device evidence |
| P0 | Login/logout and protected checkout permit wrong state | B3 personas, explicit guest setup, independent scenarios |
| P1 | Hive session/cart/order contamination | Dedicated emulator, deliberate reset boundaries, restart persistence tests |
| P1 | Totals, stock, order creation and guest cart transfer | Later risk-based shopping/checkout flows; no real payments |
| P1 | OS permissions, app termination, notification navigation | Per-platform native adapters; manual discovery before selectors are codified |
| P2 | Swipe deletion, refresh, zoom, theme persistence | Later gesture and lifecycle suites on both platforms |

SUT unit/widget results in the handoff are upstream evidence, not tests run by
this repository. This project validates configuration/types and exercises
cross-layer behavior through Appium. No external API test layer is invented.

## State and isolation

- Default sessions set `noReset=true`, `fullReset=false`; the app is relaunched.
  Navigation explicitly returns to Home and does not depend on login state.
- A **fresh install** means the package is absent before installation. Uninstall
  removes app-owned Hive data and can reset permissions; it is an explicit
  dedicated-device operation, never a shared hook.
- Android **clear-data** uses targeted `adb -s <udid> shell pm clear
  com.wearway.wearway_flutter` while no session is running. The next launch seeds
  Hive. This is destructive to that app's data and must be deliberately chosen.
- iOS has no portable Android-style `pm clear`. On a dedicated Simulator,
  `xcrun simctl uninstall <udid> <bundleId>` followed by `simctl install` recreates
  the app container. Keychain/system permissions may need their own explicit
  setup; Simulator erase is not a default reset.
- **Restart preserving state** terminates then activates the app through Flutter
  Driver so it reconnects to the new VM. No clear-data/reinstall during a session
  or cart persistence scenario. Lifecycle helpers are implemented but must earn
  their own device validation before coverage is claimed.
- **Login/logout** changes auth state without claiming to reset carts, addresses,
  settings or orders. B3 explicitly calls `prepareGuest` in each spec: reload the
  session/app without clearing Hive, open Profile, and log out when needed.
  This also discards an earlier in-memory auth error or Login route. Assertions
  verify the chosen persona's email. Each test runs without previous cleanup.
  Secondary login verifies identity only; it does not assume the existing
  emulator still has zero orders/addresses without a deliberate seed reset.
- Dev Menu reset remains manual. Avatar access is in the logged-in view and
  reset confirmation is not yet runtime-verified. No long-press coordinate hack.

Run one worker per device. Dedicated devices prevent interference with manual
data. No test retries hide product failures; reruns have distinct run directories.

## Mobile and cross-platform boundaries

The same behavior specs run on Android and iOS. System dialogs use NATIVE_APP
with verified OS/version selectors. Future gesture adapters must make Android
UiAutomator2 and iOS XCUITest differences explicit. Use widget-relative Flutter
scrolling where supported; avoid absolute screen coordinates for widget taps.

Permissions require separate allow/deny and previously-decided states. Do not
auto-grant all permissions. Location usage descriptions are missing in the iOS
handoff; review with the SUT owner before iOS permission coverage.

Order status timers run in-process. A Dev Menu speed toggle may accelerate
foreground tests after verification; no assumption that timers survive process
death. Test notification delivery separately from notification-tap routing and
foreground in-app updates. Background/foreground durations are scenario inputs,
not synchronization sleeps.

Limitations: iOS requires macOS/Xcode and a Simulator build. Network fallback
images, accessibility, performance, devices beyond the audited emulator, and
full shopping/checkout flows are not certified by the initial smoke.
