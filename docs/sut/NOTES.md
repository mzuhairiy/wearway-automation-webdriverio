# Engineering Notes — WearWay Flutter

Catatan quirk / keputusan teknis yang menyimpang dari `PROJECT_PLAN.md`,
supaya tidak "silent workaround" (sesuai CLAUDE.md workflow rule 4).

## Environment (Prompt 1)

- Flutter **3.44.7 stable**, Dart **3.12.2** (di-install via `brew install --cask flutter`).
- Target: Android (emulator Pixel 8). iOS shell ikut di-generate (bonus).

## Deviasi dependency dari PROJECT_PLAN (dipaksa ekosistem, Juli 2026)

Semua deviasi di bawah disebabkan Dart 3.12 **menghapus fitur eksperimen
`macros`**, sehingga analyzer versi 6.5–7.2 (yang depend ke package `_macros`
dari SDK) jadi tidak bisa di-install. Semua tooling wajib pakai `analyzer >=7.3`.

### 1. Hive → **Hive CE** (Community Edition)
- Plan: `hive`, `hive_flutter`, `hive_generator`.
- Aktual: `hive_ce`, `hive_ce_flutter`, `hive_ce_generator`.
- Alasan: `hive_generator` (2.0.1) tidak dirawat lagi & pin analyzer lama →
  bentrok dengan codegen modern. `hive_ce` adalah fork aktif, API-compatible
  (`Hive.initFlutter`, box, `@HiveType`/`@HiveField` sama persis).

### 2. Riverpod v2 → **v3** (codegen)
- Plan: "Riverpod v2 (codegen)".
- Aktual: `flutter_riverpod ^3.3.2` + `riverpod_annotation ^4.0.3` +
  `riverpod_generator ^4.0.4` (versi stable terbaru yang ditarik `pub add`).
- Alasan: v3 = penerus stabil v2; API `@riverpod` codegen identik untuk
  kebutuhan kita (Notifier, function provider). Signature ref generic sekarang
  cukup `Ref` (bukan `FooRef` per-provider).

### 3. Drop `custom_lint` + `riverpod_lint` (sementara)
- Plan: dev deps termasuk `custom_lint`, `riverpod_lint`.
- Aktual: dihapus dulu.
- Alasan: `riverpod_generator 4.0.4` sudah pindah ke `analyzer ^12`, tapi
  `custom_lint`/`riverpod_lint` rilis terbaru masih di `analyzer ^8` →
  version solving gagal. Keduanya cuma plugin lint opsional, tidak dibutuhkan
  untuk build / codegen / kriteria "analyze bersih" (di-cover `very_good_analysis`).
- Rencana: tambahkan lagi begitu plugin lint sudah support analyzer 12.

### 4. `lucide_icons` → **`lucide_icons_flutter`**
- Plan: `lucide_icons`.
- Aktual: `lucide_icons_flutter ^3.1.15`.
- Alasan: `lucide_icons` 0.257.0 `extends IconData`, padahal di Flutter 3.44
  `IconData` sudah `final class` → gagal compile. `lucide_icons_flutter` adalah
  fork aktif; nama ikon identik (`LucideIcons.home`, `.shirt`, dst.), cuma
  path import beda.

## Deviasi & keputusan (Prompt 2 — Data layer)

### 5. Image produk: `picsum.photos` (bukan `source.unsplash.com`)
- Plan (Prompt 2 item 7): placeholder via `https://source.unsplash.com/...`.
- Aktual: `https://picsum.photos/seed/{productId}/600/600`.
- Alasan: endpoint random `source.unsplash.com` sudah **dimatikan Unsplash**
  (sejak 2023) → tidak akan render. `picsum.photos` masih hidup, deterministic
  by seed (konsisten per productId), jadi image beneran muncul saat manual
  verify. Real asset lokal tetap masuk di **Prompt 8** (sesuai plan).

### 6. `SEED_VERSION` → `seedVersion`, `SEED_REFERENCE_DATE` → `seedReferenceDate`
- Plan pakai SCREAMING_CASE. Lint Dart `constant_identifier_names` minta
  lowerCamelCase → di-rename. Nilai & makna identik.
- `seedReferenceDate = DateTime.utc(2026)` (pakai **UTC**) supaya
  `millisecondsSinceEpoch` deterministic lintas timezone mesin.

### 7. Hive CE: registrasi adapter via `hive_registrar.g.dart`
- Model tetap pakai anotasi klasik `@HiveType`/`@HiveField` (persis
  PROJECT_PLAN section 5). hive_ce_generator meng-generate adapter per model
  **plus** file `lib/hive_registrar.g.dart` berisi extension
  `Hive.registerAdapters()` → registrasi 8 adapter dalam satu panggilan di
  `main.dart` (lebih rapi dari registrasi manual satu per satu).

### 8. Password hashing: SHA256 + salt (format `salt:hash`)
- Seed user pakai **salt fixed** (`wearway_seed_salt_v1`) → hash deterministic
  (rule: no random di seed). Registrasi user asli pakai salt **acak**
  (`Random.secure`). Keduanya diverifikasi dengan fungsi `verify` yang sama.
- Catatan: SHA256+salt cukup untuk local mock app (bukan backend production).

### 9. Stateful Notifier (cart/auth) di-defer ke prompt masing-masing
- Prompt 2 item 5 menyebut "Notifier untuk stateful (cart notifier, auth
  notifier)". Tapi `auth_notifier` adalah scope **Prompt 3** dan `cart_notifier`
  scope **Prompt 5**. Untuk hindari tabrakan + scope creep, Prompt 2 hanya
  membuat **repository provider + read provider (Stream/Future)**. Notifier
  stateful dibangun di prompt-nya sendiri di atas repository ini.

## Deviasi & keputusan (Prompt 3 — Auth + navigation guard)

### 10. Riverpod v3: `valueOrNull` → `value`, `copyWithPrevious` internal
- Di riverpod 3.3, `AsyncValue.valueOrNull` tidak ada → pakai `.value`
  (nullable, aman, tidak throw). `.hasValue` tetap ada.
- `copyWithPrevious` sekarang `@internal` (warning `invalid_use_of_internal_member`)
  → tidak dipakai. Konsekuensi: splash restore tidak bisa mengandalkan
  "loading tapi punya value lama".

### 11. Splash pakai `appBootstrapProvider` terpisah (bukan authState)
- Splash (restore session pertama) nge-gate `appBootstrap` FutureProvider yang
  sekali jalan (`await authController.future`), **bukan** `authController`
  langsung. Alasan: login/logout men-set `AsyncLoading` di authController; kalau
  splash nge-gate itu, splash muncul lagi tiap login. `appBootstrap` tidak
  tersentuh mutasi auth → splash hanya sekali saat cold start.

### 12. `restoreSession` implicit di `AuthController.build()`
- PROJECT_PLAN minta `restoreSession()` dipanggil di main/app. Di sini restore
  = isi `build()` AsyncNotifier (baca `current_user_id` dari box meta),
  dipicu saat provider pertama dibaca (via appBootstrap). Method
  `restoreSession()` eksplisit tetap ada untuk re-check manual.

### 13. Router guard: `refreshListenable` dari auth + redirect dua arah
- `goRouter` provider `ref.listen(authControllerProvider)` → update
  `ValueNotifier` → `refreshListenable` re-evaluasi redirect saat login/logout
  (mis. logout di screen protected auto balik).
- Redirect: guest+protected → `/auth/login?from=...`; sudah login + buka
  `/auth/*` → balik ke `from`/`/home`. Protected prefix diperluas ke
  `/order-history` & `/profile/addresses` (forward-compat; route-nya dibangun
  Prompt 6/7).

### 14. Guest-cart transfer di-wire sekarang (repo dari Prompt 2)
- `AuthController.login/register` memanggil `cartRepository.transferGuestToUser`.
  Ini titik yang disebut PROJECT_PLAN Prompt 5 ("call di auth_notifier"), dan
  repo-nya sudah ada sejak Prompt 2 → dipasang sekarang (satu baris, aman).

### 15. Password `Customer123!` (CLAUDE.md), bukan `custom123` (PROJECT_PLAN §3)
- Ada konflik kredensial antara CLAUDE.md dan PROJECT_PLAN. CLAUDE.md yang
  dipakai (override): `customer@example.com` / `Customer123!`.

## Deviasi & keputusan (Prompt 4 — Home + Categories + Product Detail)

### 16. Cart provider minimal dibangun sekarang (bukan tunggu Prompt 5)
- Prompt 4 butuh add-to-cart + badge. Dibuat `cart_providers.dart`:
  `cartItemsProvider` (stream), `cartCountProvider` (badge), `CartController`
  dengan `addToCart`. Sisanya (updateQty/remove/promo/clear + Cart screen
  penuh) tetap scope **Prompt 5**. addToCart pakai id komposit
  `cart_{owner}_{productId}_{size}_{color}` → repo gabung qty otomatis.

### 17. Route Category Products: `/categories/:slug` (top-level)
- Ditambah sebagai GoRoute top-level (parentNavigatorKey root → full screen +
  back), bukan nested di branch categories. Alasan: dipanggil dari Home
  (branch home) DAN Categories → top-level menghindari kerumitan pindah branch.
  Path tetap sesuai spec.

### 18. `CurrencyFormatter` dibuat lebih awal (dipakai Prompt 4)
- PROJECT_PLAN menaruh CurrencyFormatter di Prompt 8. Karena harga tampil mulai
  Prompt 4, util-nya dibuat sekarang (format `Rp 199.000`) + unit test dasar.
  Prompt 8 tinggal menambah edge case bila perlu.

### 19. Icon kategori: map `iconName` → Lucide (clothing pakai `shirt`)
- Lucide tidak punya ikon hoodie/pants → `tshirt/hoodie/pants` semua ke
  `LucideIcons.shirt`; `shoes→footprints`, `bags→shoppingBag`,
  `accessories→watch`. Icon final bisa diganti saat asset Prompt 8.

## Deviasi & keputusan (Prompt 5 — Search + Cart + swipe-to-delete)

### 20. Cart notifier disatukan di `cart_providers.dart` (bukan file baru)
- CartController (dari Prompt 4) diperluas: `updateQty`, `removeItem`,
  `clearCart` (+ `addToCart`). Promo dipisah ke `PromoController`
  (state `code`+`error`); ringkasan biaya di `cartSummaryProvider`
  (subtotal → diskon → ongkir → total). Ongkir Rp 15.000, gratis kalau
  subtotal > Rp 300.000.

### 21. Bug fix — Dismissible swipe-to-delete "nyangkut"
- Awalnya `confirmDismiss` (dialog) + `onDismissed` (removeItem). Kalau data
  belum sinkron saat rebuild, widget Dismissible ke-"dismissed" tapi item
  masih ada di data → tile jadi invisible ( zero-size) dan tak bisa dihapus.
- Fix: hapus item DI DALAM `confirmDismiss` lalu **return false** → item
  hilang lewat update data (stream Hive), Dismissible tak pernah masuk state
  dismissed. Pola ini menghindari kelas bug "dismissed Dismissible still in
  tree". Tombol trash (backup) tetap panggil `removeItem` langsung.

### 22. Bug fix — "BoxConstraints forces an infinite width" di cart
- FilledButton sebagai child non-flex di `Row` (dalam Card ringkasan) di-ukur
  dengan lebar tak terbatas → assert `_RenderInputPadding`. Fix: layout promo
  jadi **vertikal** (field lalu tombol full-width, pola sama dgn tombol
  Checkout yang aman), plus `crossAxisAlignment: stretch` di Column ringkasan.

### 23. Bug fix — ProductCard overflow (Prompt 4 carry-over)
- ProductCard `Column` (gambar AspectRatio 1:1 + teks) overflow di container
  tinggi tetap (featured row / grid). Fix: gambar dibungkus `Expanded`
  (mengisi sisa tinggi) → anti-overflow di berbagai tinggi kartu.

### 24. Promo code case-insensitive
- `wearway10` / `WEARWAY10` sama-sama valid (di-normalisasi uppercase).
  Promo: WEARWAY10 (10%, min Rp 100rb), WELCOMEBACK (Rp 20rb, min Rp 150rb).

### 25. AddressModel `isSaved` + seed v2 (Prompt 6)
- Field baru `isSaved` (@HiveField 9, default true) → membedakan alamat yang
  tampil di Address Book (`true`) vs snapshot alamat checkout yang tak disimpan
  user (`false`). Snapshot tetap dipersist supaya `order.addressId` bisa
  mereferensi (integritas order untuk Order Detail Prompt 7), tapi
  `AddressRepository.list/watch` memfilter `isSaved` → tak muncul di daftar.
- `seedVersion` dinaikkan 1 → 2 (SeedManager clear + re-seed otomatis).

### 26. Bug fix — konfirmasi order tak tampil (navigasi setelah placeOrder)
- `placeOrder()` mengosongkan cart → `CheckoutScreen` beralih ke empty-state →
  `_CheckoutBottomBar` (pemilik `context`) ikut unmount, jadi `context.mounted`
  jadi false dan `context.go('/order-confirmation/...')` di-skip. User nyangkut
  di checkout kosong padahal order sudah dibuat.
- Fix: ambil `GoRouter.of(context)` & `ScaffoldMessenger.of(context)`
  **sebelum** await. GoRouter (keepAlive) tetap hidup meski widget unmount.
  Ini kelas bug "BuildContext across async gap" yang halus (widget dipindahkan
  oleh perubahan state, bukan pop biasa). Ditemukan saat verifikasi emulator.

### 27. Profile → Address Book pakai `push` (bukan `go`)
- `context.go('/profile/addresses')` ke route top-level tak meninggalkan
  history → AppBar Address Book tanpa tombol back (user nyangkut). Diubah ke
  `context.push` supaya back berfungsi. (Link Riwayat Pesanan & Pengaturan
  masih placeholder Prompt 7/8 — dibiarkan.)

### 28. Runtime permission — verifikasi 3 state lokasi
- Path **granted** (mock geocode) & **notifikasi Android 13+** diverifikasi
  live di emulator. Path **denied** (SnackBar) & **permanentlyDenied** (dialog
  buka Settings) sudah di-wire di `StepAddress` tapi belum diuji live
  (butuh revoke izin manual). `PermissionService` di-mock-kan untuk unit test.

### 29. flutter_local_notifications v22 — API named-parameter (Prompt 7)
- v22 mengubah `initialize` & `show` ke named parameter:
  `initialize(settings: ...)` (bukan positional) dan
  `show(id:, title:, body:, notificationDetails:, payload:)`. Kode disesuaikan.
- Channel `order_updates` (importance DEFAULT/3) dibuat di
  `NotificationService.init()` (idempotent). Diverifikasi via
  `adb shell dumpsys notification` — channel + 3 notif (Diproses/Dikirim/Tiba)
  muncul dengan `contentIntent=startActivity` (deep link on tap).

### 30. NotificationService DI via provider override (Prompt 7)
- `notificationServiceProvider` sengaja `throw UnimplementedError` dan
  **di-override di `main()`** dengan instance yang sudah `init()` (init plugin
  harus sekali, sebelum runApp). Widget test override dengan
  `createNoopNotificationService()`. Pola sama dengan PermissionService (mudah
  di-fake, tak menyentuh plugin di test).
- Navigasi tap notifikasi diikat di `app.dart` via
  `attachNavigation((id) => router.go('/order/$id'))` — idempotent, dan
  tap yang datang sebelum router siap (cold launch) di-flush via microtask.

### 31. Scheduler: orderNumber diambil saat runtime (Prompt 7)
- `scheduleOrderStatusUpdates(orderId)` tidak menerima orderNumber (beda dari
  saran prompt) — tiap tahap membaca order dari Hive dan pakai
  `current.orderNumber`. Call site di checkout jadi 1 argumen; sekaligus
  guard: kalau order sudah `cancelled`/hilang, timer berikutnya berhenti.
- Timer disimpan `Map<orderId, List<Timer>>` → bisa `cancel(orderId)`.
  Interval 30/60/90s hardcoded (dev menu Prompt 8 akan percepat via
  `stepInterval`). Timer in-process → hilang saat hot restart (wajar utk demo).

### 32. Verifikasi Prompt 7 di emulator (full lifecycle)
- Order baru **ORD-20260723-00008** dibuat → 30s **Diproses** (timeline update
  live reaktif) → 60s **Dikirim** → 90s **Tiba** (4 step ✓). 3 notifikasi
  muncul di tray, tap notif → Order Detail order yang benar (deep link OK).
- Izin notifikasi Android 13+: **granted** (tak muncul dialog karena sudah
  di-grant saat test Prompt 6; path request tetap dipanggil sebelum order).
- Order History menampilkan 8 order (5 seed + 3 hasil test), terurut terbaru,
  badge status warna, thumbnail produk pertama.

### 33. Real assets — infra + fallback dulu (Prompt 8)
- Keputusan user: setup infra + placeholder fallback (gambar asli belum ada).
  `ProductImage` (`lib/shared/widgets/`) memilih `Image.asset` (asset path),
  `CachedNetworkImage` (http, kompat lama), atau placeholder (kosong/error).
  Seed pakai `assets/products/{id}.jpg`; sampai file ditambah, semua produk
  tampil placeholder (ikon kaos) — tidak crash. `assets/*/README.md` = panduan.
- **Kategori tetap lucide icon** (bukan gambar) — sudah rapi & vektor; migrasi
  ke `assets/categories/` di-skip (deviasi sadar dari item 2 prompt).
- seedVersion 2 → 3 (imageUrls berubah → clear + re-seed otomatis).

### 34. Splash programmatic — tanpa gambar (Prompt 8)
- Keputusan user: `flutter_native_splash` warna brand saja (no image) —
  `dart run flutter_native_splash:create` menulis styles.xml Android +
  Info.plist iOS. In-app splash (restore session) diberi wordmark WearWay.
- Launcher icon tetap default Flutter (belum ada logo) — di luar scope ronde.

### 35. Theme persist + dev flags via SettingsRepository (Prompt 8)
- `ThemeModeController.build()` baca `SettingsRepository.getTheme()`,
  `setMode` tulis balik → tema instan & persist. Konsekuensi: build() controller
  baca Hive settings → **unit/widget test harus buka box settings atau override
  provider** (auth_controller_test buka box; widget test pakai
  `_FakeThemeController`).
- Dev flags baru: `speedUpOrders`, `skipLogin` di box settings.

### 36. Dev menu wiring (Prompt 8)
- Speed-up: `orderStatusSchedulerProvider` baca `getSpeedUpOrders()` (5s/30s).
  Bukan reaktif ke Hive → dev menu `ref.invalidate(orderStatusSchedulerProvider)`
  setelah toggle supaya order berikut pakai interval baru (timer berjalan tak
  terpengaruh).
- Skip-login: `AuthController.build()` — kalau tak ada sesi & flag aktif,
  auto-login `customer@example.com` (creds seed publik, jalur dev saja).
- Reset: `seedManagerProvider.resetSeed()` + `cancelAll` notif + invalidate
  auth/theme/katalog + `go('/home')`. Diverifikasi live (snackbar + logout +
  tema balik + re-seed).

### 37. Verifikasi Prompt 8 di emulator
- Placeholder fallback tampil (produk grey + ikon kaos, badge -10% tetap).
- Hero banner auto-play berputar (dots indicator).
- Dark mode instan & cohesive (Profile/Settings), persist.
- Dev menu: Reset (konfirmasi → reset → home + snackbar) **verified live**.
  Toggle speed-up & skip-login render + persist + wired; siklus 5s live &
  auto-login-on-restart belum diuji live (dicatat jujur).
- flutter_native_splash mengubah file native → butuh full rebuild (bukan hot
  reload). 79 test hijau, analyze bersih.

### 38. Toast pakai toastr_flutter, posisi atas (polish)
- Semua `SnackBar` diganti `toastr_flutter` (v2.5.1) via wrapper
  `AppToast.success/error/warning/info` (`lib/shared/utils/app_toast.dart`).
  Posisi global **topCenter** di-set `Toastr.configure(...)` di `main()`;
  `MaterialApp.router` pakai `builder: Toastr.builder` (butuh untuk go_router).
- Toast context-free → hilangkan capture `ScaffoldMessenger` sebelum async gap
  (checkout, dev menu, order cancel jadi lebih ringkas).
- Mapping: add-to-cart & clear-notif & reset = success; checkout gagal = error;
  order dibatalkan = info; izin lokasi ditolak = warning.
- **Dampak Appium**: `add_to_cart_snackbar` ValueKey **pensiun** (toast overlay
  tak gampang bawa key findable). Assertion add-to-cart pakai `cart_badge`
  (increment) — konstanta lama tetap di test_keys sbg referensi.

### 39. Gambar hybrid: asset → fallback network (polish)
- Keputusan user: `ProductImage` coba `Image.asset`; kalau file belum ada →
  foto network **picsum deterministic** (seed = nama file, mis. `prod_x`);
  kalau gagal → placeholder. Jadi foto asli tampil sekarang tanpa download,
  dan otomatis pakai file lokal begitu di-drop ke `assets/products/`.
- Hero banner sama: `banner_N.jpg` → picsum landscape (1200×600) → gradient.
- Trade-off: butuh internet selama file lokal belum ada (locator Appium tetap
  by ValueKey, jadi konten gambar tak pengaruh ke test).

### 40. Bugfix batch: cart qty, back di order detail, tombol beli langsung

- **Cart qty/hapus senyap gagal** (root cause): `CartController` dulu
  `@riverpod` (autoDispose) tapi dibaca via `.notifier` di `_CartItemTile` lalu
  dipakai **belakangan** (di callback tombol / setelah dialog konfirmasi).
  Tanpa `watch`, notifier keburu di-dispose → `ref.read(cartRepository)` di
  dalamnya lempar *"Ref used after disposed"* yang ditelan async callback (UI
  diam, tak ada perubahan). Fix: `CartController` → `@Riverpod(keepAlive: true)`
  (konsisten dengan `PromoController` di file yang sama). Bukan bug hit-test /
  Hive — sudah dibuktikan via log runtime.
- **Order Detail tak bisa back** dari layar konfirmasi: tombol "Lihat Detail
  Pesanan" pakai `context.go('/order/:id')` (replace stack) → AppBar tak punya
  back. Fix: ganti ke `context.push(...)` (route `/order/:id` top-level di root
  navigator) → back button muncul, kembali ke konfirmasi.
- **Beli langsung** di detail produk: `_AddToCartBar` sekarang dua CTA —
  "Keranjang" (outlined) + "Beli Sekarang" (filled, `buy_now_button`). Buy-now
  add-to-cart lalu `push('/checkout')` (guard login tetap berlaku untuk guest).
- Diverifikasi live di emulator (add/+/-/hapus, back dari order detail, buy-now
  → checkout 4 step → order sukses). `flutter analyze` bersih, 79 test hijau.

### 41. Logo & splash baru (huruf W + lingkaran hijau)

- **Logo**: huruf "W" putih dalam lingkaran hijau (seed `#2E7D53`).
- **Splash** (native + in-app `_SplashView`): background **putih**, logo di
  tengah **timbul/3D** — lingkaran gradient (atas terang → bawah gelap) + drop
  shadow. In-app pakai widget `WearWayLogo` (gradient + `BoxShadow`), bukan aset.
- **App icon**: sama tapi **flat** (tanpa gradient/shadow). Android adaptive:
  `adaptive_icon_background: #FFFFFF` + foreground lingkaran hijau (safe zone).
- **Aset di-generate** oleh script Python stdlib (supersampled AA, tanpa install
  Pillow/ImageMagick): `assets/icon/icon.png`, `assets/icon/icon_foreground.png`,
  `assets/splash/splash_logo.png`. Tool tak tersedia di mesin → generator murni
  stdlib (zlib PNG). Re-generate ikon/splash: `dart run flutter_launcher_icons`
  & `dart run flutter_native_splash:create`.
- Diverifikasi di emulator: native splash (putih + logo 3D) + launcher icon
  (lingkaran hijau + W) tampil benar.

### 42. Appium Flutter Driver instrumentation (Phase A)

- **Automation entrypoint** `lib/main_automation.dart`: minimal wrapper that calls
  `enableFlutterDriverExtension()` then `app.main()` (from `main.dart`). No
  bootstrap duplication — all init (Hive, seed, ProviderScope, notifications,
  toastr, lifecycle, router, theme, session restore) stays single-sourced in
  `main.dart`.
- **Dependency** `flutter_driver: sdk: flutter` added to `dev_dependencies` (not
  `dependencies`) — used only by the automation entrypoint, never in release.
- **Lint quirk**: `lib/main_automation.dart` imports `flutter_driver` (a
  dev_dependency) from `lib/` → `very_good_analysis` triggers
  `depend_on_referenced_packages`. Added `// ignore: depend_on_referenced_packages`
  on the import line (standard Appium/WebdriverIO automation-entrypoint pattern).
- **Android validation: PASS** (toolchain installed on this machine: Flutter
  3.47.9, Dart 3.13.7, JDK 17, Android SDK + emulator API 35). `pub get` resolves
  clean (`flutter_driver` pulls `sync_http`+`webdriver`, no conflict), `build_runner`
  55 outputs, `dart format` 0 changed, `flutter analyze` clean, `flutter test`
  79 pass, instrumented `app-debug.apk` built, `flutter drive` PASS (driver connect
  + `byValueKey` smoke). iOS NOT EXECUTED (Windows). Matrix:
  `docs/APPIUM_READINESS.md`.
- **Quirk — adb port 5037 clash**: adb's default port is taken by a local LoopUp
  service (`...DataUsageMediationApi`, HTTP) → `adb` errors `protocol fault (status
  HTTP)`. Worked around with `ANDROID_ADB_SERVER_PORT=5038` (persisted to user
  env). The automation repo must use the same adb port.
- **Quirk — pre-`runApp()` race**: `app.main()` does heavy async init before
  `runApp()`, while the driver extension is already live → driver commands sent
  before `runApp()` fail with `No root widget is attached`. Automation must wait
  for a ValueKey (e.g. `bottom_nav_bar`) before acting. Not a bug; startup trait.
- **Toolchain drift (3.47.9 > 3.44.7)**: the newer formatter/linter surfaced 2
  issues in existing code → fixed minimally: removed a redundant `unawaited()` in
  `hero_banner.dart` (`animateToPage` is now `@awaitNotRequired`), and reformatted
  `test/unit/checkout/checkout_controller_test.dart`.
- **SUT issue found (OPEN, Phase B)**: `ios/Runner/Info.plist` has no permission
  usage-description strings (`NSLocationWhenInUseUsageDescription`, etc.). Not
  changed in Phase A (don't alter production permission behavior).

## Catatan lain

- `flutter_lints` dihapus (digantikan `very_good_analysis`).
- `public_member_api_docs` dinonaktifkan di `analysis_options.yaml` — rule ini
  untuk published package, bukan aplikasi. Rule strict lainnya tetap aktif.
- Rule `sort_pub_dependencies` ikut mengurutkan SDK dep (`flutter`,
  `flutter_test`), jadi posisinya ditaruh alfabetis di antara dep lain.
