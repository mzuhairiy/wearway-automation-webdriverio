# Execution results

Updated **2026-11-03 UTC**. Earlier failures remain in
[the 2026-11-02 report](EXECUTION_RESULTS_2026-11-02.md); they are not current B2 status.

## Current milestones

| Milestone | Android | iOS |
|---|---|---|
| B1 session/Flutter readiness | PASS | BLOCKED: Windows/no Simulator build |
| B2 required Home → Categories → Home | PASS after SUT owner's Categories key attachment | IMPLEMENTED / BLOCKED |
| B3 guest/login/invalid login/logout | IMPLEMENTED / PASS | IMPLEMENTED / BLOCKED |
| Session identity after relaunch | IMPLEMENTED / PASS | IMPLEMENTED / BLOCKED |
| B4 foundation | IMPLEMENTED; navigation/auth/context/reporting exercised | Configuration parsed only |

Protected checkout, shopping, order creation, cart persistence, gestures,
permissions and notification coverage remain NOT EXECUTED. Secondary login
checks identity; no fresh order/address count is claimed on a stateful emulator.

## SUT and environment

The user attached ValueKey(TestKeys.categoriesScreen) to the Categories root
Scaffold at line 32, rebuilt/installed the instrumented APK, and reported a
passing smoke plus clean flutter analyze. This follow-up independently verified
the smoke and B3; it did not rerun Flutter analyze or rebuild/edit the SUT.

- SUT HEAD: 4073126f91d3050c04779338b675fd5e0bedc68b **plus the user's uncommitted
  one-line Categories key change**. That change is preserved.
- APK: D:/GitHub/wearway/build/app/outputs/flutter-apk/app-debug.apk.
- SHA-256: **22DDEC07A056A99B0722124AAFA2551141AFF993F6A4B171422F298C35D0A813**.
- Device: emulator-5554, AVD wearway_pixel; Android 15/API 35.
- Host: Windows 11; Node 25.0.0; local npm 11.21.1; Java 17.0.21.
- Stack unchanged: WDIO 10.1.0, Appium 3.9.0, Flutter Driver 3.10.1;
  internal UiAutomator2 proxy 8.4.0. See [verified setup](ENVIRONMENT_SETUP.md).
- All executions in this follow-up use the managed Appium service. No separate
  manual server was needed.

## Actual runtime evidence

| UTC | Test | Result | Evidence |
|---|---|---|---|
| 02:35:21 | WW-NAV-001, unchanged required screen keys | PASS | b2-recheck-20261103.log; session 7d57047c-4e60-4e8b-beaf-1a287f039c7e |
| 02:37:54 | WW-AUTH-001 guest → login form | PASS | b3-first-20261103.log; results.jsonl |
| 02:38:17 | WW-AUTH-002 primary seeded login | PASS | same run |
| 02:38:39 | WW-AUTH-003 secondary seeded login | PASS | same run |
| 02:39:17 | WW-AUTH-004 invalid password and guest after relaunch | PASS | same run; final independent run additionally asserts exact wrong-password message |
| 02:39:39 | WW-AUTH-005 logout | PASS | same run |
| 02:40:22 | WW-LIFE-001 identity preserved across relaunch | PASS | same run |
| 02:42:02 | WW-NAV-001 after startup configuration changes | PASS | navigation-final-20261103.log; session 61bf21ae-def4-49d9-ae30-9541f3d46ec0 |

Log paths above are relative to the ignored artifacts directory.
Initial authentication run:
artifacts/runs/2026-11-03T02-37-01-906Z-0b5d4696/
(six passing tests; no automatic test retries).
Each result contains its actual session ID, including session reloads.
Final configuration also writes a metadata file for every reloaded session.

## Isolation and independent execution

Every auth test explicitly calls prepareGuest: reload the session with
noReset=true/fullReset=false/forceAppLaunch=true, open Profile, and log out if
necessary. Hive is never cleared. This resets in-memory route/auth errors,
not catalog/cart/order data. The persistence test checks the primary email
before and after an additional relaunch and then logs out.

Independent verification uses separate CLI invocations in reverse order:
WW-LIFE-001, WW-AUTH-005, WW-AUTH-004, WW-AUTH-003, WW-AUTH-002, WW-AUTH-001.
Each uses the authentication suite with --mochaOpts.grep and produces
artifacts/<ID>-independent-20261103.log. All six independent invocations exited 0:

| UTC | Scenario | Result | Final session ID |
|---|---|---|---|
| 02:43:27 | WW-LIFE-001 | PASS | 9346edc0-3b68-4814-aa91-00d90cf181d6 |
| 02:44:26 | WW-AUTH-005 | PASS | e3e51fcb-fd80-4787-86eb-aa2e5932a2b7 |
| 02:45:46 | WW-AUTH-004 | PASS, exact wrong-password message and guest after relaunch | 15a598c1-1295-4556-9f3b-f99890789b22 |
| 02:46:50 | WW-AUTH-003 | PASS | 6ea19324-ba69-40fb-a4ba-e073d6e3935c |
| 02:47:52 | WW-AUTH-002 | PASS | 6e319a85-daa9-447c-87c4-3bf4d3642b23 |
| 02:48:58 | WW-AUTH-001 | PASS | fc7591f7-7b6f-49ef-87a1-590ed3530b5a |

Navigation plus six auth/persistence scenarios: **7 distinct Android scenarios
PASS** in the final independent checks. This is not a claim of iOS execution.

## Appium startup investigation

Existing artifacts include the user's timed-out managed startup on 2026-11-03.
The installed WDIO Appium service has a 30-second default. A fresh successful
recheck took about 25 seconds between preflight and worker start, leaving
little margin. The configuration now allows **120 seconds** and asks Appium to
load only Flutter initially; the native proxy still loads for each session.
INFO logging is retained because WDIO detects readiness from its startup marker.

The initial B3 suite and subsequent navigation run passed with this configuration.
This is a verified startup-margin improvement, not proof that the original
intermittent delay's underlying cause has been eliminated. No sleeps, retries,
global changes, or duplicate servers were introduced. APPIUM_MANAGED=false
remains available for a caller-owned server.

## Validation and reporting

- TypeScript strict check: PASS.
- Real WDIO parsers and all four suite mappings for Android/iOS: PASS.
- Allure HTML regenerated successfully after the independent runs, exit 0:
  artifacts/allure-report/index.html; console evidence in
  artifacts/allure-generation-20261103.log. The accumulated report also retains
  earlier failures/reruns; use the dated results here for current acceptance.
- B3 text entry, error text retrieval, profile identity keys and logout:
  exercised through the real Flutter Driver.
- Managed-server log filtering: initial auth log had 10 redacted text-entry
  lines and zero literal seeded-password occurrences.
- Final independent logs also contained 10 redacted entries, zero literal
  seeded-password occurrences, and eight recorded session-reload transitions.
- Saved text diagnostics redact configured passwords. External servers should
  use config/appium-log-filters.json as well. Raw artifacts stay ignored.
- Expected absent-widget probes can log Flutter TimeoutException responses;
  assertion outcomes distinguish these from failed tests.
- Prior native screenshot/render-tree validation remains in the historical
  report; no failure capture was triggered by the passing B3 scenarios.

## Remaining limitations

iOS is still BLOCKED by this Windows host and missing Simulator build. Direct
terminate/activate helpers, native dialog taps, scroll and widget diagnostics
are not certified by the session-reload persistence test. Future permissions
must account for the SUT's iOS usage-description issue.

No dependencies were changed or security audit rerun in this follow-up. The
2026-11-02 audit remains **76 findings: 64 moderate, 9 high, 3 critical**;
the driver doctor's missing HOME/optional tools also remain documented.
No clean security-audit or doctor result is claimed.

No SUT source/dependency edits, commits or pushes were made by the automation
agent. The user's existing SUT change remains uncommitted.
