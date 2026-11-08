# Automation architecture

## Layers

`config` owns environment validation, W3C capabilities, server ownership,
serial execution and reporting. Platform files differ only where device and
native driver capabilities differ. `APPIUM_MANAGED=false` connects to a server
the caller owns; the managed mode refuses an occupied endpoint.

Specs express preconditions, interactions and assertions. Screen Objects own
screen readiness; the reusable BottomNavigation component owns tab actions.
Home and Categories support B2. Login and Profile support B3 credential entry,
submission, profile identity and logout. Product, cart and checkout objects
remain deferred until those scenarios are implemented.

Helpers provide small protocol-aware operations: Flutter finders/commands,
context switching, native taps, lifecycle and explicit navigation setup.
Test data contains only the verified synthetic personas. Category slug `tshirt`
comes from the handoff and its actual InkWell attachment was source-reviewed.

## Flutter contract

`src/constants/testKeys.ts` is the automation inventory, copied selectively from
the SUT `lib/utils/test_keys.dart`. It is not generated from guessed names.
`byValueKey` produces the encoded finder passed to `elementClick`,
`getElementText` and `flutter:*` commands. Standard `$()` is reserved for native
selectors in NATIVE_APP. Commands were checked against the installed 3.10.1
README and implementation under `build/lib/commands`.

`waitForWidget` tolerates only a Flutter wait timeout and the documented
pre-runApp root-widget race. Other errors propagate. `widgetExists` returns
false only for a Flutter TimeoutException; it cannot convert a broken transport
into a passing absence assertion. All waits are bounded. `waitFor` discovers
onstage widgets; it is not proof of pixel visibility or button enablement.
Taps additionally use `waitForTappable`. Use diagnostics for widget properties
instead of inventing native `isEnabled` semantics for arbitrary Flutter widgets.

`categories_screen` is the B2 assertion. The SUT owner attached its key on
2026-11-03 and the exact smoke passed. Diagnostics use `category_grid_item_tshirt`, a distinct
Categories item; `category_grid` exists on both Home and Categories and would be
an ambiguous substitution. Never call the diagnostic a passing B2 scenario.

## Context and native operations

`selectContext` discovers names and reports missing contexts. `inContext`
restores the previous context on success or error; if restoration also fails,
both errors survive in an AggregateError. Flutter helpers reject native context.
`tapNative` requires explicit Android and iOS selector mappings from the caller.
No locale-dependent universal permission button or arbitrary XPath is provided.

`restartPreservingData` terminates natively then activates in FLUTTER, allowing
Flutter Driver to attach to the replacement VM. Native activation alone would
leave a stale connection. Future state-mutating scenarios must choose their
reset policy explicitly; the current shared hooks never clear data.

Authentication specs explicitly call `prepareGuest`: reload the Appium session
with noReset/forceAppLaunch, open Profile and log out if authenticated. This
restores the initial route and clears in-memory auth errors while retaining Hive.
Each test makes its own precondition; there is no dependency on earlier cleanup.
`relaunchPreservingData` is also used by the session-persistence test, which
asserts the same email before and after relaunch without a data reset.

## Reports and failure classification

Spec and Allure reporters capture test results. Protocol steps are disabled in
Allure so future credential entry is not duplicated there. WDIO logs are WARN;
Appium is INFO because its startup message is required by the WDIO service.
The managed server filters Flutter text-entry payloads with
`config/appium-log-filters.json`. External servers must use the same filter.
Other Appium INFO messages may include command payloads: only synthetic test data is allowed,
and raw logs/screenshots remain ignored local artifacts. Do not publish them
without review. Full capabilities can include paths and device identifiers.

Each run creates `artifacts/runs/<UTC timestamp>-<id>/` with metadata, session
capabilities/contexts, Appium/WDIO logs, JSONL results, and best-effort screenshot
and Flutter render-tree attachments. Flutter page source is unsupported.
Reloaded sessions get their own metadata file linking the previous session ID.
Expected negative `widgetExists` probes may produce driver TimeoutException
entries in protocol logs; the spec result distinguishes expected absence from
an assertion failure. Transport/context errors are never treated as absence.
Session creation failures are visible in WDIO/Appium logs even before hooks.
Assertion failures are distinct from setup/transport failures in reports.

Allure accumulates results in `artifacts/allure-results`; generating HTML uses
the accumulated set. Archive or deliberately clear that generated directory
before a clean reporting batch. This does not reset device data.
