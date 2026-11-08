# SUT contract provenance

Copied without editing from the clean sibling checkout `../wearway`, Git commit
`4073126f91d3050c04779338b675fd5e0bedc68b`, on 2026-11-02 UTC:

- `QA-HANDOFF.md` (primary contract)
- `PROJECT_PLAN.md`
- `NOTES.md`
- `docs/APPIUM_READINESS.md` (copied here as `APPIUM_READINESS.md`)

Upstream repository: https://github.com/mzuhairiy/wearway

These snapshots are evidence from the SUT, not Phase B execution results. The
handoff contains older Java plans and a final `FlutterIntegration` example;
this repository follows the requested TypeScript stack and the installed
Appium Flutter Driver's `Flutter` automation name. The existing entrypoint
registers `ext.flutter.driver`, not the separate Flutter Integration Driver.

The original 3.44.7/3.12.2 toolchain statements describe earlier development.
The audited machine has Flutter 3.47.9 / Dart 3.13.7. Runtime locator results and
the app actually executed are recorded in `../EXECUTION_RESULTS.md`.

On 2026-11-03, the user supplied a one-line, uncommitted SUT change attaching
`ValueKey(TestKeys.categoriesScreen)` to the Categories root Scaffold (line 32).
HEAD remains `4073126`; the working tree is therefore no longer the pristine
snapshot above. This change was read and preserved, not authored by this repo.
The updated APK SHA-256 is
`22DDEC07A056A99B0722124AAFA2551141AFF993F6A4B171422F298C35D0A813`.
Runtime auth keys were checked against their actual Login/Profile widget
attachments. The expected wrong-password message (`Password salah.`) was read
from `lib/data/repositories/user_repository.dart:72`; it is asserted as content,
not used as a locator. Historical snapshots remain unmodified.
