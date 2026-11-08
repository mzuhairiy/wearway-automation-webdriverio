# Test case matrix

Updated 2026-11-03 UTC. IMPLEMENTED describes code; PASS/FAIL describe actual
execution. BLOCKED identifies a prerequisite preventing acceptance or execution.
NOT EXECUTED makes no behavior claim.

| ID | Feature | Scenario | Platform | Priority | Expected result | Implementation | Execution |
|---|---|---|---|---|---|---|---|
| WW-ENV-001 | Session/context | Flutter readiness, native window query, restoration after success and error | Android | P0 | Both contexts available; Home discoverable after restoration | IMPLEMENTED | PASS |
| WW-ENV-001 | Session/context | Same shared scenario | iOS | P0 | Same behavior with XCUITest | IMPLEMENTED | BLOCKED: macOS/build unavailable |
| WW-NAV-001 | Navigation | Home → Categories → Home using required screen ValueKeys | Android | P0 | home_screen, categories_screen, home_screen discoverable in sequence | IMPLEMENTED | PASS after SUT owner's key fix |
| WW-NAV-001 | Navigation | Same shared smoke | iOS | P0 | Same required screen keys | IMPLEMENTED | BLOCKED: macOS/build unavailable |
| WW-DIAG-001 | Diagnostic navigation | Open unique category_grid_item_tshirt, Home offstage, return Home | Android | P0 | Category content found, Home restored | IMPLEMENTED | PASS; does not satisfy WW-NAV-001 |
| WW-DIAG-001 | Diagnostic navigation | Same diagnostic | iOS | P0 | Same content reachable | IMPLEMENTED | BLOCKED: macOS/build unavailable |
| WW-AUTH-001 | Authentication | Guest Profile → Login | Both | P0 | Login form and keyed input fields visible | IMPLEMENTED | Android PASS; iOS BLOCKED |
| WW-AUTH-002 | Authentication | Login primary seeded persona | Both | P0 | Profile email matches primary account | IMPLEMENTED | Android PASS; iOS BLOCKED |
| WW-AUTH-003 | Authentication | Login secondary seeded persona independently | Both | P0 | Secondary identity; no claim about existing address/order counts | IMPLEMENTED | Android PASS; iOS BLOCKED |
| WW-AUTH-004 | Authentication | Valid email and invalid password | Both | P0 | Keyed wrong-password error; guest after relaunch | IMPLEMENTED | Android PASS; iOS BLOCKED |
| WW-AUTH-005 | Authentication | Logout from explicit logged-in precondition | Both | P0 | Guest login prompt, identity removed | IMPLEMENTED | Android PASS; iOS BLOCKED |
| WW-AUTH-006 | Authorization | Guest cart → protected checkout | Both | P0 | Redirect to Login; no checkout access | Planned | NOT EXECUTED |
| WW-LIFE-001 | Persistence | Login, reload session with forced app relaunch, no clear-data | Both | P1 | Same authenticated identity restored from Hive | IMPLEMENTED | Android PASS; iOS BLOCKED |
| WW-LIFE-002 | Persistence | Cart survives restart | Both | P1 | Items/quantities retained | Planned | NOT EXECUTED |
| WW-GEST-001 | Gestures | Swipe cart item/address and confirm deletion | Both | P1 | Only selected item removed | Planned | NOT EXECUTED |
| WW-GEST-002 | Gestures | Pull refresh and product-image pinch | Both | P2 | Content refreshes; zoom changes within bounds | Planned | NOT EXECUTED |
| WW-PERM-001 | Permissions | Location allow/deny | Android/iOS | P1 | Correct native dialog and app fallback | Native utility only | NOT EXECUTED; iOS plist issue in handoff |
| WW-PERM-002 | Permissions | Notification authorization | Android 13+/iOS | P1 | Correct prompt handling for each OS | Planned | NOT EXECUTED |
| WW-NOTIF-001 | Notifications | Accelerated order change, notification tap | Both | P1 | Notification and correct Order Detail route | Planned | NOT EXECUTED |
| WW-SHOP-001 | Commerce | Stock, variants, quantities, promo and totals | Both | P1 | Deterministic local catalog and totals | Planned | NOT EXECUTED |
| WW-ORDER-001 | Checkout | Address/delivery/payment/review/place order | Both | P1 | Correct persisted local order | Planned | NOT EXECUTED |

Android session/context diagnostics retain their 2026-11-02 results. Navigation
and authentication results are from 2026-11-03; see the execution report for run
IDs and independent execution. Protected checkout, shopping, gestures and
permission suites remain planned; no empty feature directories or screen stubs.
