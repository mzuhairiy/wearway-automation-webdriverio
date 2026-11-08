# QA decision log

## 2026-11-03 — B2 resolved; B3 implemented and exercised

The SUT owner added the existing Categories key to the root Scaffold and rebuilt/
installed the APK. The one-line user change is present but uncommitted; HEAD is
still `4073126`. The automation agent preserved that diff and did not rebuild
or edit the SUT during this follow-up. The exact navigation test passed with
managed Appium. D002 below is historical and now resolved on this Android build.

The user's startup timeout was reproduced in existing run logs. The installed
WDIO service defaults to 30 seconds; a new successful run took about 25 seconds
between preflight and worker start. Increase `appiumStartTimeout` to 120 seconds,
retain INFO readiness logging, and select only Flutter for Appium startup.
The underlying OS/startup delay cause is not conclusively diagnosed; this is a
bounded startup-margin improvement. No sleep, automatic test retry, global
tool change or second server was introduced. External-server mode remains an
explicit alternative when the caller already owns a server.

B3 adds Login/Profile screen interactions and explicit guest fixtures. Each
test reloads the session with noReset/forceAppLaunch, then uses UI logout if
needed. This isolates routes/in-memory errors while preserving local Hive.
No shared reset hook, Dev Menu reset or clear-data command was added. The
secondary persona test checks identity, not unverified empty order/address data.

Invalid login checks the keyed wrong-password message read from SUT source,
then relaunches and verifies the guest prompt. The persistence test checks the
same primary email on both sides of relaunch; it never clears data between.
Managed Appium filters text-entry payloads; saved text diagnostics additionally
redact configured passwords. The initial auth run's server log contained zero
literal seeded-password occurrences. Raw screenshots/artifacts remain local.

The first full authentication run passed all six tests. Final independent runs,
artifact hash and validation details are in `EXECUTION_RESULTS.md`. iOS remains
unexecuted on Windows; protected checkout and broader commerce remain deferred.

## 2026-11-02 — Separate repository and bounded scope

The current workspace initially held only local `.qodo` state and was not a Git
repository. Initialized a separate repository, preserving that directory and
ignoring it. Read the clean sibling SUT and copied four contract documents with
commit provenance. No SUT source/dependency edits, automation inside the SUT,
Git commits or pushes. Building the existing automation target changes only
generated/ignored build files; SUT Git status remains clean.

Implement only B1/B2 screens and necessary foundation. B3 is conditional on B2
passing; do not inflate portfolio coverage by generating unverified shopping
or authentication scenarios. The test matrix makes that boundary visible.

## D001 — Wrong installed build (resolved for Android session)

Initial Appium sessions reached Dart VM isolates, but the extension list lacked
`ext.flutter.driver`. The original APK filename and Phase A readiness document
were insufficient runtime evidence. Default `noReset=true` can reuse an existing
same-version app, so this observation does not independently prove whether the
original on-disk APK or just the installed binary was wrong.

Built the existing `lib/main_automation.dart` with `--debug --no-pub`, then used
explicit `adb install -r` on the selected emulator. This preserves Hive data.
Subsequent Appium sessions connected and successfully executed ValueKey
commands. Record both artifact hashes in the execution report; never equate
the presence of an APK with verified instrumentation.

## D002 — categories_screen contract defect (historical; resolved 2026-11-03)

SUT commit `4073126`: `TestKeys.categoriesScreen = 'categories_screen'` exists
at `lib/utils/test_keys.dart:17`, but `rg categoriesScreen lib` finds no widget
attachment. `lib/features/categories/categories_screen.dart` builds a Scaffold
and keyed category grid, without the required screen key. The router directly
constructs CategoriesScreen and adds no wrapper key.

Android Appium runtime confirms the contract failure. Home → nav_categories
works; `category_grid_item_tshirt` is reachable; Home is offstage, then restored
by nav_home. The required `categories_screen` lookup times out. This is a
testability/contract defect, not evidence that category navigation itself is
broken. The smoke fails explicitly, even though it executes the return-home
step before reporting the missing key.

Required SUT-owner action: attach the existing ValueKey to the runtime Categories
screen root, rebuild the automation entrypoint, install that exact artifact and
rerun WW-NAV-001. No SUT change was made here. `category_grid` is not an acceptable
silent fallback because Home and Categories both use that key. B3 remains gated.

## D003 — Handoff driver-name mismatch

The final handoff paragraph uses `FlutterIntegration`, while its entrypoint
registers `ext.flutter.driver`. Official driver/package metadata confirms
`automationName: Flutter`. Follow the requested stack and actual instrumentation;
preserve the copied handoff verbatim and explain the discrepancy here.

## D004 — Toolchain and package boundaries

Existing Node 25.0.0 satisfies selected package engines; global npm 8 does not
satisfy Appium's npm >=10 requirement. Bootstrap npm 11.21.1 locally, leaving
global tools alone. Select latest compatible 3.x Flutter driver rather than
unrequested 4.x. Its published shrinkwrap uses UiAutomator2 8.4.0 internally,
despite 8.7.3 also being directly installed. Runtime logs, not just the driver
list, establish the actual proxy version.

The driver doctor flags missing HOME plus optional bundletool/ffmpeg/GStreamer.
Record the doctor failure; do not claim a clean doctor result from a passing
session. Native video/AAB tooling is outside initial scope.

`npm audit fix` without force could not remove bundled/shrinkwrapped advisories.
Its forced recommendation would downgrade Appium to 2.0.1, violating the stack.
Retain the verified versions and disclose the remaining audit failure; no
unreviewed major overrides or forced downgrades.

## D005 — WDIO server readiness and preflight errors (resolved)

Appium service detects its startup INFO message. Setting Appium logs to WARN
caused a startup timeout despite a listening server. INFO is required; WDIO
client logs remain WARN. Removed only the orphan server created by this task,
after checking its process command line; unrelated servers/tools were untouched.

WDIO 10 logs ordinary onPrepare exceptions and continues. Preflight now wraps
invalid OS/device/build/port prerequisites in the official
`webdriverio.SevereServiceError`, which stops the runner before Appium launch.
Static config loading remains possible without a device/build; execution gates
run in onPrepare. A Windows iOS preflight is BLOCKED, not an application failure.

## D006 — Screenshot support (native capture used)

The Flutter screenshot command returned `Could not capture image screenshot`
on this toolchain. Render-tree capture succeeded. Failure capture now switches
temporarily to NATIVE_APP for the OS screenshot and restores the prior context.
Attachment failures never replace the original assertion error. The B2 screenshot
shows Home because the test deliberately completes the return-home step before
asserting its retained Categories observation.

## Manual verification and future work (updated 2026-11-03)

B3 now exercises the profile/login input and button keys, both seed identities,
wrong-password error, logout, guest setup and persistent-session relaunch.
Next add protected-checkout redirect and the separately planned commerce flows.

On macOS, supply an instrumented Simulator build, run XCUITest doctor and the
shared smoke. SUT readiness notes missing iOS location usage-description strings;
do not implement speculative permission selectors or bypass OS prompts. Dev Menu
reset/confirmation, speed toggle, notification interactions and multi-touch
gestures still require runtime discovery. No timer-survival claim after process
termination, no real accounts and no backend API assumptions.
