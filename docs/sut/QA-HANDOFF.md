# QA Handoff — WearWay (wearway_flutter)

WearWay adalah aplikasi Flutter e-commerce fashion (customer app, **build from
scratch**) yang berperan sebagai **System Under Test (SUT)**; automation-nya
memakai **Appium Flutter Driver (Java)** di **repo terpisah**. Dokumen ini
adalah kontrak serah-terima QA: fakta build, persona, ValueKey, dan gotcha.

## 1. At a glance

| Aspek | Nilai |
|---|---|
| Platform | Android-first (emulator Pixel 8); iOS shell ikut ter-generate (bonus) |
| Framework | Flutter 3.44.7 · Dart 3.12.2 · Riverpod v3 (codegen) · go_router 17 · Hive CE |
| UI | Material 3 (light + dark, seed hijau "eco" `#2E7D53`) |
| Data | Hive CE lokal (8 box), **tanpa backend / API / Firebase** |
| Auth | Email + password, hash **SHA256 + salt** (format `salt:hash`) |
| Automation target | Appium Flutter Driver (Java), repo terpisah |
| Gate status | `flutter analyze` = 0 issue · `flutter test` = **79 pass** · `dart format` clean |
| State provider | Riverpod `@riverpod` codegen (bukan StateNotifier legacy) |
| Amount | `int` Rupiah (bukan double) |

## 2. Cara menjalankan

```bash
# Prasyarat: Flutter 3.24+ stable, Android Studio + SDK, emulator running.
flutter pub get
dart run build_runner build --delete-conflicting-outputs   # generate *.g.dart (Riverpod/Hive)
flutter run                                                 # ke device/emulator terkoneksi
```

Verifikasi cepat: `flutter analyze` (harus "No issues found!") dan `flutter test`.

**Reset data:** buka app → tab **Profile** → **long-press avatar** → dev menu →
**Reset all data** (konfirmasi). Ini clear cart/settings/meta + re-seed dari nol.

## 3. Personas & auth

| Email | Password | Kondisi |
|---|---|---|
| `customer@example.com` | `Customer123!` | Customer utama — 5 order history + 2 alamat (Rumah default, Kantor) |
| `customer2@example.com` | `Customer123!` | Akun fresh (tanpa order/alamat) |

- Kedua user seed di-hash dengan **salt fixed** (`wearway_seed_salt_v1`) →
  deterministic. Registrasi user asli pakai salt acak (`Random.secure`).
- **Session persist di Hive box `meta`** (menyimpan `current_user_id`, bukan
  password). Sesi bertahan saat app di-kill & re-open (splash restore sekali
  saat cold start).
- Guest cart otomatis di-transfer ke akun saat login/register.

## 4. Fitur & status

Feature-first di `lib/features/`: `auth`, `home`, `categories`, `product`,
`search`, `cart`, `checkout`, `address`, `order`, `profile`, `settings`, `dev`,
`shell`. Semua fitur di bawah **sudah selesai & diverifikasi di emulator**.

| Fitur | Status / catatan |
|---|---|
| Browse (Home + Categories) | Hero banner auto-play, grid kategori, produk unggulan, pull-to-refresh |
| Search + filter | Search bar debounce 300ms, filter sheet (kategori/ukuran/RangeSlider harga/in-stock) |
| Product detail | Carousel + **pinch-to-zoom** (InteractiveViewer), pilih size/color, qty stepper, add-to-cart & buy-now |
| Cart | Qty stepper, **swipe-to-delete** (Dismissible + dialog), promo code, ringkasan biaya |
| Checkout | Multi-step 4 tahap (Alamat → Kirim → Bayar → Ulas), butuh login, **izin lokasi** |
| Order tracking | Order Detail + timeline reaktif, simulasi status via **notifikasi lokal** |
| Address CRUD | Address Book: list, tambah/edit, swipe-to-delete, set default |
| Profile | Info user + menu + logout; guest → prompt login; long-press avatar → dev menu |
| Settings | Toggle tema Terang/Gelap/Sistem — instan & persist; **dark mode** di semua screen |

Promo code (case-insensitive): `WEARWAY10` (10%, min Rp 100rb) ·
`WELCOMEBACK` (Rp 20rb, min Rp 150rb). Ongkir Rp 15.000, gratis kalau
subtotal > Rp 300.000.

## 5. Rute (go_router)

`GoRouter` provider (`lib/core/router/app_router.dart`), `initialLocation:
'/home'`, `StatefulShellRoute.indexedStack` untuk bottom nav. Rute pakai **path
saja** (tanpa `name`).

Shell (bottom nav 4 tab): `/home` · `/categories` · `/cart` · `/profile`.

Top-level: `/search` · `/product/:id` · `/categories/:slug` · `/checkout` ·
`/order-confirmation/:id` · `/order-history` · `/order/:id` ·
`/profile/addresses` (+ `/new`, `/edit`) · `/auth/login` · `/auth/register` ·
`/settings`.

**Protected** (guest → redirect `/auth/login?from=...`, reaktif via
`refreshListenable`): prefix `/checkout`, `/order`, `/order-confirmation`,
`/order-history`, `/profile/addresses`.

## 6. ValueKey inventory (kontrak Appium Flutter Driver)

Sumber tunggal: `lib/utils/test_keys.dart` (`TestKeys`). Naming **snake_case**.
Locator utama = **`byValueKey(<string>)`**, JANGAN pakai text sebagai locator.

- **Nav / shell:** `nav_home`, `nav_categories`, `nav_cart`, `nav_profile`,
  `app_shell`, `bottom_nav_bar`, `cart_badge`.
- **Screen bodies:** `home_screen`, `categories_screen`, `cart_screen`,
  `profile_screen`, `search_screen`, `product_detail_screen`, `checkout_screen`,
  `order_detail_screen`, `login_screen`, `register_screen`, `settings_screen`,
  `category_products_screen`, `address_book_screen`, `address_form_screen`,
  `order_history_screen`, `order_confirmation_screen`, `splash_screen`.
- **State generik:** `loading_indicator`, `empty_state`, `error_state`.
- **Auth — login:** `login_email_input`, `login_password_input`,
  `login_submit_button`, `login_error_message`, `login_register_link`.
- **Auth — register:** `register_email_input`, `register_password_input`,
  `register_confirm_password_input`, `register_name_input`,
  `register_submit_button`, `register_error_message`.
- **Home:** `hero_banner`, `category_grid`, `featured_products_list`.
- **Product:** `product_image_carousel`, `product_name`, `product_price`,
  `product_price_original`, `product_discount_badge`, `stock_indicator`,
  `qty_stepper_decrement`, `qty_stepper_increment`, `qty_value`,
  `add_to_cart_button`, `buy_now_button`, `related_products_list`,
  `products_grid`. (`add_to_cart_snackbar` **pensiun** — lihat §7.)
- **Cart:** `cart_subtotal`, `cart_discount`, `cart_delivery_fee`, `cart_total`,
  `promo_code_input`, `promo_code_apply`, `promo_code_remove`,
  `promo_code_error`, `checkout_button`, `cart_empty_state`.
- **Checkout:** `checkout_step_indicator`, `checkout_step_address`,
  `checkout_step_delivery`, `checkout_step_payment`, `checkout_step_review`,
  `checkout_next_button`, `checkout_back_button`, `place_order_button`,
  `checkout_terms_checkbox`.
- **Address:** `address_form`, `address_recipient_input`, `address_phone_input`,
  `address_street_input`, `address_city_input`, `address_postal_input`,
  `address_label_input`, `address_save_checkbox`, `address_default_checkbox`,
  `location_permission_button`, `saved_address_dropdown`, `add_address_button`,
  `address_form_save_button`.
- **Order:** `order_status_timeline`, `order_summary`, `cancel_order_button`,
  `order_confirmation_number`, `view_order_detail_button`, `back_to_home_button`,
  `empty_order_history`.
- **Search:** `search_input`, `filter_button`, `filter_sheet`,
  `filter_price_min`, `filter_price_max`, `filter_in_stock`, `filter_apply`,
  `filter_clear`, `search_results`, `empty_search_state`.
- **Profile / settings / dev:** `profile_avatar`, `profile_email`,
  `profile_name`, `login_prompt_button`, `logout_button`,
  `profile_addresses_link`, `profile_orders_link`, `profile_settings_link`,
  `dev_menu_trigger`, `dev_speed_up_toggle`, `dev_skip_login_toggle`,
  `dev_clear_notif_button`, `dev_reset_button`, `theme_mode_light`,
  `theme_mode_dark`, `theme_mode_system`.

**Composite key (list item / varian)** — pola stabil, WAJIB dipakai Appium:
`product_card_{id}` · `category_item_{slug}` · `category_grid_item_{slug}` ·
`category_header_{slug}` · `product_image_{index}` · `size_selector_{size}` ·
`color_selector_{color}` · `filter_category_{slug}` · `filter_size_{size}` ·
`cart_item_{id}` · `cart_item_qty_{id}` · `cart_item_remove_{id}` ·
`use_saved_address_{addressId}` · `delivery_method_{id}` ·
`payment_method_{id}` · `address_item_{addressId}` (+`_edit`, +`_default`) ·
`order_status_{status}` · `order_item_{productId}` ·
`order_history_item_{orderId}`.

## 7. Automation gotchas (Appium Flutter Driver)

- **Finder = ValueKey.** Pakai `byValueKey(...)`. Text locator rapuh karena UI
  Indonesia + tema light/dark bisa mengubah teks/warna.
- **Hive persist antar-run.** Data tinggal di disk device antar sesi test →
  **reset dulu** (dev menu Reset all data, atau uninstall/clear app data) supaya
  test deterministic.
- **Runtime permission = native dialog** (bukan widget Flutter): izin **lokasi**
  muncul di step Alamat checkout, izin **notifikasi** (Android 13+) saat first
  place-order. Harus di-handle via Appium native/UiAutomator2 context, bukan
  Flutter finder.
- **Notifikasi lokal simulasi status order** di **30s / 60s / 90s**
  (Preparing → Shipped → Delivered). Dev menu bisa mempercepat ke ~5s
  (`dev_speed_up_toggle`) untuk memangkas waktu tunggu test. Tap notifikasi =
  deep-link internal ke `/order/:id` (bukan deep link OS).
- **Gesture:** swipe-to-delete = `Dismissible` (cart & address), pull-to-refresh
  = `RefreshIndicator` (home/category), pinch-to-zoom = `InteractiveViewer`
  (product image). Perlu W3C Actions / gesture Appium.
- **`add_to_cart_snackbar` pensiun.** Notifikasi in-app kini toast overlay
  (`toastr_flutter`, posisi atas) yang tak membawa ValueKey findable. Assertion
  add-to-cart pakai **`cart_badge`** (increment), bukan snackbar.
- **Setup driver:** butuh **Appium Flutter Driver** + app di-build **debug/profile**
  dengan Flutter driver extension aktif (bukan release build).

## 8. Data seed (deterministic)

Konstanta di `lib/data/seed/seed_constants.dart`:

- `seedVersion = 3` (idempotent: seed hanya jalan kalau versi di box `meta`
  berbeda; naikkan versi → SeedManager clear + re-seed otomatis).
- `seedReferenceDate = DateTime.utc(2026)` — **semua timestamp seed relatif ke
  sini**, pakai UTC (JANGAN `DateTime.now()` di seed) supaya deterministic.

Yang di-seed (`SeedManager._seedCatalog`):

- **6 kategori:** tshirt, hoodie, pants, shoes, bags, accessories.
- **60 produk** (10 per kategori, harga interpolasi linear; index 3 tiap
  kategori = out-of-stock; ada produk featured & diskon deterministic).
  ID pola `prod_{slug}_{color}_{NN}`, gambar `assets/products/{id}.jpg`
  (**60 gambar primary sudah tersedia** — foto fashion CC dari LoremFlickr;
  secondary `{id}_2.jpg` belum ada → carousel fallback ke foto network).
- **2 user** (§3).
- **2 alamat** untuk customer utama: `Rumah` (default, Jakarta Selatan 12140) &
  `Kantor` (12950).
- **5 order** untuk `customer@example.com`, mix status (1 placed, 1 preparing,
  1 shipped, 2 delivered). Nomor pola `ORD-YYYYMMDD-00001..00005`.

**Reset:** `resetSeed()` clear `cart_items` + `settings` + `meta`, lalu re-seed
katalog/user/alamat/order. `initSeed()` (tiap startup) hanya seed kalau versi
beda.

## 9. Risk matrix

| Risiko | Dampak automation | Status |
|---|---|---|
| Riverpod **v3** (plan awal v2 codegen) | API `@riverpod` identik utk kebutuhan; ref generic jadi `Ref`. | Terdokumentasi di NOTES.md; risiko rendah |
| **Hive CE** (fork, bukan Hive resmi) | API-compatible (`@HiveType`/`@HiveField` sama). | Terdokumentasi; risiko rendah |
| Gambar produk = foto CC LoremFlickr (bukan katalog Unsplash/Pexels) | 60 primary + 3 banner **sudah ada** (real, distinct, 600×600 / 1200×600). Tapi gaya lifestyle/street + ada watermark atribusi CC kecil, sebagian lisensi `cc-nc`. Cukup untuk visual test fungsional; bukan foto katalog bersih. | Terkelola — visual test bisa jalan; kalau butuh foto katalog rapi, ganti dgn aset Unsplash/Pexels berlisensi |
| Carousel secondary `{id}_2.jpg` belum ada | Slide ke-2 fallback ke foto network (butuh internet). | Terbuka — opsional; tambah 60 file `_2.jpg` kalau perlu |
| Seed clock (`DateTime.utc(2026)`) vs jam device | Tanggal order/produk relatif ke 2026, bisa beda dari jam device (hari ini 2026-07-28). | Sadar; asersi tanggal harus relatif, bukan absolut |
| Timer in-process (status order) | Hilang saat hot restart; hanya hidup selama app berjalan. | Wajar untuk demo |
| `custom_lint`/`riverpod_lint` di-drop sementara | Tidak memengaruhi runtime/test. | Terdokumentasi |

## 10. Batasan (scope limits)

- **Tanpa backend / API / Firebase** — semua data lokal Hive.
- **Customer-only** — tidak ada role admin / seller.
- **Tanpa real payment gateway** — metode bayar (COD/Transfer/GoPay/OVO) mock.
- **Tanpa deep link OS** — di-drop sejak v2; tap notifikasi = navigasi internal
  go_router saja.
- **Setup Appium/automation ADA DI REPO TERPISAH** — bukan di repo SUT ini.

Referensi lanjutan: `PROJECT_PLAN.md` (section 4 halaman/fitur, 5 Hive schema,
6 seed spec, 7 ValueKey, 8 fitur khas mobile, 10 build prompts) dan `NOTES.md`
(semua deviasi teknis + bug fix + verifikasi emulator).

## 11. Appium Flutter Driver Instrumentation (Phase A)

Instrumentation so this SUT can be driven by **Appium Flutter Driver**. The
automation framework (WebdriverIO + TypeScript + Appium 3) lives in a **separate
repo** — here we only add the SUT hooks. Full readiness matrix: [`docs/APPIUM_READINESS.md`](docs/APPIUM_READINESS.md).

### Two entrypoints (normal vs automation)

| | File | Flutter Driver extension | Used for |
|---|---|---|---|
| **Normal** | `lib/main.dart` | ❌ no | `flutter run`, release, manual QA |
| **Automation** | `lib/main_automation.dart` | ✅ `enableFlutterDriverExtension()` | Appium / instrumented debug build |

`main_automation.dart` **does not duplicate** the bootstrap — it calls the normal
`main.dart` (`app.main()`) as-is, so all init stays single-sourced: Hive + adapter
registration + 8 boxes, deterministic seed, `ProviderScope`, `NotificationService`,
Toastr, lifecycle observer (`Hive.close()`), router, theme, session restore. The
only difference is the single `enableFlutterDriverExtension()` line, called
**before** `app.main()` (before the Flutter binding is initialized).

> ⚠️ **Do not** enable the Flutter Driver extension in the release entrypoint.
> Release stays `lib/main.dart`. `flutter_driver` lives in `dev_dependencies`.

### Dependency

```yaml
dev_dependencies:
  flutter_driver:
    sdk: flutter   # version follows the installed Flutter stable, not pub.dev
```

### Build command

```bash
# Android — instrumented debug APK
flutter build apk --debug --target=lib/main_automation.dart

# Android — run directly on emulator/device (prints the VM Service URI)
flutter run --debug --target=lib/main_automation.dart

# iOS Simulator (macOS + Xcode ONLY) — produces the simulator Runner.app
flutter build ios --simulator --debug --target=lib/main_automation.dart
```

APK output: `build/app/outputs/flutter-apk/app-debug.apk`. iOS Simulator `.app`
output: `build/ios/iphonesimulator/Runner.app` (used as `appium:app` in the
automation repo's capabilities).

### Dart VM Service / Flutter Driver extension

The goal of this instrumentation = expose the **`ext.flutter.driver`** extension
on the Dart VM Service. Appium Flutter Driver attaches to it to locate widgets
via `byValueKey(...)` (the ValueKey contract in §6). Manual check: `flutter run
--debug --target=lib/main_automation.dart` → watch for `A Dart VM Service on ...
is available at: http://127.0.0.1:<port>/<token>/` → `ext.flutter.driver` is
registered once the app finishes init.

### Platform limitations (important)

- **iOS**: a Simulator build **≠** a signed physical-device IPA. A physical device
  needs separate signing/provisioning (Apple Developer account, `DEVELOPMENT_TEAM`,
  `codesign`) — not set up in this repo.
- **Runtime permissions are still native dialogs** (location at checkout,
  notifications on Android 13+). Not Flutter widgets → the automation repo must
  handle them via a **native context** (UiAutomator2 / XCUITest), not the Flutter
  finder. No fake permission bypass was added (on purpose, to keep production
  behavior intact).

### Verification status (as of Phase A — see `docs/APPIUM_READINESS.md`)

**Android: actually verified** (Flutter 3.47.9 · Dart 3.13.7 · emulator API 35):
`pub get` resolves clean · `build_runner` 55 outputs · `dart format` 0 changed ·
`flutter analyze` **No issues found!** · `flutter test` **79 pass** · instrumented
`app-debug.apk` built · `flutter drive` **PASS** (driver connect = `ext.flutter.driver`
reachable, smoke `byValueKey('nav_cart')` → `cart_screen`). **iOS: NOT EXECUTED**
(dev machine is Windows; needs macOS + Xcode).

Two important notes for the automation repo: (1) adb port 5037 clashes with a local
LoopUp service → use `ANDROID_ADB_SERVER_PORT=5038`; (2) `app.main()` runs async
init before `runApp()` → automation **must wait for a known ValueKey** (e.g.
`bottom_nav_bar`) before acting. Details in `docs/APPIUM_READINESS.md` §4.

### WebdriverIO repo integration (future)

The automation repo points `appium:app` at the build artifact above, using
`automationName: FlutterIntegration` (Appium Flutter Driver), primary locator
`byValueKey`. Deterministic initial state: see §8 (seed) + dev menu Reset All
Data (§2). DO NOT build the WebdriverIO framework in this SUT repo.
