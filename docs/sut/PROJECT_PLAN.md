# WearWay (Flutter Edition) — SUT Plan

> **Build dari nol dengan Flutter** — Material 3 + Riverpod + Hive + assets fashion open source.
> Target automation: **Appium Flutter Driver (Java)** — repo terpisah, dikerjain nanti.
>
> Domain: **e-commerce fashion generic** (rebrand dari medusa-mobile, tapi built from scratch).
> Role: **1 role — customer only**.
> Platform: **Android-first, iOS bonus**.

---

## 1. Project Brief

### Konteks

Build WearWay dari nol menggunakan **Flutter** (bukan React Native). Alasan lo pilih Flutter:
career investment — familiar dengan tech stack yang mungkin ditemui di real Flutter job (dev or QA).
Sekaligus showcase adaptability QA lintas framework.

### Kenapa build from scratch (bukan fork Flutter repo lagi)

- Kontrol penuh test surface & testability hook (`ValueKey` di setiap interactive widget)
- WearWay hasil fork sebelumnya udah bisa lo preserve/archive
- Learning curve Flutter lebih terstruktur kalau build sendiri dari nol
- Konsisten dengan pola Duitku (build from scratch, kontrol arsitektur)

### Prinsip

- **Build dari nol dengan Flutter SDK terbaru stable**
- **UI: Material 3 bawaan** — polished out-of-the-box, custom theme untuk brand
- **Combine dengan Shadcn-Flutter** untuk component tertentu (Card, Button, Sheet) kalau memberikan uplift visual
- **Data via Hive local storage** — deterministic seed, no backend
- **Testability first** — `ValueKey` di semua interactive widget (kontrak ke Appium Flutter Driver)
- **Fitur khas mobile:** verify gesture, tambah notification, tambah runtime permission
- **Assets fashion open source** (Unsplash, Pexels, Freepik dengan atribusi)

### Bukan scope

- ❌ Backend/API (Hive mock cukup)
- ❌ Real payment gateway (mock di checkout)
- ❌ Multi-role (customer only)
- ❌ Deep link (di-drop di v2, konsisten)
- ❌ Real Google Pay
- ❌ Firebase (no cloud dependency)

---

## 2. Tech Stack

| Layer | Choice | Alasan |
|---|---|---|
| Framework | **Flutter** (SDK terbaru stable) | Career investment, cross-platform |
| Language | Dart | Native Flutter |
| State management | **Riverpod** (v2 code generation) | Modern, testable, most-recommended 2024+ |
| UI base | **Material 3** widgets + custom theme | Polished bawaan, familiar Google design |
| UI accent | Optional: **Shadcn-Flutter** untuk komponen tertentu | Uplift visual di spot tertentu |
| Navigation | **go_router** | Modern, declarative, file-like routing |
| Local storage | **Hive** (v2, dengan hive_flutter) | Fast, type-safe, populer |
| HTTP mock | tidak perlu (semua data lewat Hive) | — |
| Chart | **fl_chart** | Populer, feature-rich |
| Icons | Material Icons + **lucide_icons** | Konsisten cross-project |
| Date | intl (bawaan) | — |
| Image loading | **cached_network_image** | Standard Flutter |
| Notification | **flutter_local_notifications** | Local (no FCM) |
| Permission | **permission_handler** | Standar |
| Testing (unit/widget) | flutter_test (bawaan) + mocktail | Standar |

**Dart**: SDK 3.5+ · **Flutter**: 3.24+ stable · **Android SDK**: sudah ada dari project sebelumnya

### Shadcn-Flutter integration strategy

Material 3 as base, Shadcn-Flutter untuk komponen di mana kelihatan lebih modern:
- **Card** (product card, order card) — cek visual, pilih yang lebih clean
- **Button** (CTA utama) — Shadcn-nya biasanya lebih minimalist
- **Bottom Sheet / Dialog** — Shadcn Sheet lebih modern
- **Input / Form field** — Material 3 udah cukup, mungkin skip

Rule: **default Material 3**, upgrade ke Shadcn-Flutter cuma kalau memberi uplift visual signifikan. Jangan mix asal-asalan.

---

## 3. Persona

**1 role: customer**. Auth state:

| State | Bisa |
|---|---|
| **Guest** | Browse, search, cart (in-memory Hive) |
| **Logged in** | Semua guest + checkout, order history, saved addresses |

Cart persist di Hive (gak hilang saat close app), transfer ke user saat login.

Seed credentials:
- `customer@example.com` / `custom123` — 5 order history, 2 saved address
- `customer2@example.com` / `custom123` — fresh, 0 order

---

## 4. Halaman & Fitur

### Bottom navigation (4 tab)

1. **Home** — hero banner, categories, featured products
2. **Categories** — grid semua kategori dengan product count
3. **Cart** — cart items, subtotal, checkout button
4. **Profile** — user info (kalau login) / login prompt (guest), order history, settings

### Screen di luar bottom nav

- **Search** — search bar + filter (kategori, harga range, size)
- **Product Detail** — image carousel (pinch zoom), title, price, size/color select, add to cart
- **Category Products** — list products per kategori
- **Checkout Flow** (multi-step): Address → Delivery → Payment → Review → Confirmation
- **Order History** — list past orders
- **Order Detail** — items, status timeline, total
- **Address Book** — CRUD alamat (add, edit, delete, set default)
- **Auth** — Login + Register
- **Settings** — theme (light/dark), currency, logout

---

## 5. Data Model (Hive schema)

Hive pake TypeAdapter untuk custom class. Setiap entity di-annotate `@HiveType`:

```dart
@HiveType(typeId: 0)
class ProductModel {
  @HiveField(0) final String id;
  @HiveField(1) final String slug;
  @HiveField(2) final String name;
  @HiveField(3) final String description;
  @HiveField(4) final int priceIdr;       // int, bukan double (no float)
  @HiveField(5) final int stock;
  @HiveField(6) final List<String> imageUrls;
  @HiveField(7) final String categoryId;
  @HiveField(8) final List<String> sizes;  // ["S", "M", "L", "XL"]
  @HiveField(9) final List<String> colors; // ["black", "white", "navy"]
  @HiveField(10) final bool isFeatured;
  @HiveField(11) final double rating;
  @HiveField(12) final int reviewCount;
  @HiveField(13) final List<String> badges; // ["New", "Sale", "Organic Cotton"]
  @HiveField(14) final int? discountPercent;
  @HiveField(15) final int createdAtMs;
}

@HiveType(typeId: 1)
class CategoryModel {
  @HiveField(0) final String id;
  @HiveField(1) final String name;
  @HiveField(2) final String slug;
  @HiveField(3) final String iconName;
  @HiveField(4) final int order;
}

@HiveType(typeId: 2)
class UserModel {
  @HiveField(0) final String id;
  @HiveField(1) final String email;
  @HiveField(2) final String passwordHash; // bcrypt via crypto package
  @HiveField(3) final String name;
  @HiveField(4) final String? phone;
  @HiveField(5) final int createdAtMs;
}

@HiveType(typeId: 3)
class AddressModel {
  @HiveField(0) final String id;
  @HiveField(1) final String userId;
  @HiveField(2) final String label;      // "Rumah", "Kantor"
  @HiveField(3) final String recipientName;
  @HiveField(4) final String phone;
  @HiveField(5) final String streetAddress;
  @HiveField(6) final String city;
  @HiveField(7) final String postalCode;
  @HiveField(8) final bool isDefault;
}

@HiveType(typeId: 4)
class CartItemModel {
  @HiveField(0) final String id;
  @HiveField(1) final String? userId;    // null = guest cart
  @HiveField(2) final String productId;
  @HiveField(3) final String selectedSize;
  @HiveField(4) final String selectedColor;
  @HiveField(5) final int quantity;
  @HiveField(6) final int addedAtMs;
}

@HiveType(typeId: 5)
enum OrderStatus {
  @HiveField(0) placed,
  @HiveField(1) preparing,
  @HiveField(2) shipped,
  @HiveField(3) delivered,
  @HiveField(4) cancelled,
}

@HiveType(typeId: 6)
class OrderModel {
  @HiveField(0) final String id;
  @HiveField(1) final String orderNumber; // "ORD-YYYYMMDD-XXXXX"
  @HiveField(2) final String userId;
  @HiveField(3) final String addressId;
  @HiveField(4) final int subtotalIdr;
  @HiveField(5) final int deliveryFeeIdr;
  @HiveField(6) final int discountIdr;
  @HiveField(7) final int totalIdr;
  @HiveField(8) final OrderStatus status;
  @HiveField(9) final String paymentMethod;
  @HiveField(10) final int placedAtMs;
  @HiveField(11) final int estimatedDeliveryMs;
  @HiveField(12) final List<OrderItemModel> items;
}

@HiveType(typeId: 7)
class OrderItemModel {
  @HiveField(0) final String productId;
  @HiveField(1) final String productName;   // snapshot
  @HiveField(2) final int pricePerUnitIdr;  // snapshot
  @HiveField(3) final String size;
  @HiveField(4) final String color;
  @HiveField(5) final int quantity;
  @HiveField(6) final int subtotalIdr;
}
```

Repository pattern di `lib/data/repositories/` — semua akses Hive lewat sini.

---

## 6. Seed Data — Deterministic

### Prinsip

- Fixed seed version constant (`SEED_VERSION = 1`)
- Init seed di app startup, cek Hive box `meta:seed_version`
- Reset via dev menu di Profile → long-press avatar

### Isi seed

| Data | Jumlah | Detail |
|---|---|---|
| Categories | 6 | T-Shirt, Hoodie, Pants, Shoes, Bags, Accessories |
| Products | 60 | 10 per kategori, mix harga (Rp 89rb – Rp 899rb), size S-XL, 3-5 warna |
| Users | 2 | customer@example.com + customer2@example.com |
| Addresses | 2 | Untuk customer@example.com (Rumah + Kantor) |
| Orders | 5 | Untuk customer@example.com, mix status (1 PLACED, 1 PREPARING, 1 SHIPPED, 2 DELIVERED) |
| Order items | ~15 | 2-4 item per order (snapshot data) |

### Assets

**Product images** — pakai Unsplash source URL (deterministic path):
```
https://source.unsplash.com/{width}x{height}/?tshirt,fashion&sig={productId}
```
Atau download 60 image dari **Unsplash / Pexels** (free stock, gratis komersial), simpan di `assets/products/`.

Rekomendasi: **download ke assets/** biar deterministic, offline-ready, dan gak ada API rate limit. Sekali download, commit ke repo.

### Deterministic notes

- Semua `id` = fixed string (`prod_tshirt_black_01`, bukan random UUID)
- Semua timestamp relatif ke `SEED_REFERENCE_DATE = DateTime(2026, 1, 1)`
- Price pattern: predictable (bukan pure random) — misal T-Shirt Rp 89-149rb, Shoes Rp 299-799rb
- Rating & review count: pattern by category (Shoes lebih banyak review dari Accessories)

---

## 7. Testability Hooks (kontrak ke Appium Flutter Driver)

### Konvensi

RN pake `testID` prop. **Flutter pake `ValueKey` widget property.** Naming tetap konsisten dengan
project lain — snake_case.

```dart
ElevatedButton(
  key: const ValueKey('add_to_cart_button'),
  onPressed: () { ... },
  child: const Text('Add to Cart'),
)
```

Appium Flutter Driver locate via:
```java
FlutterFinder finder = new FlutterFinder(driver);
WebElement button = driver.findElement(finder.byValueKey("add_to_cart_button"));
```

### Rules

- ✅ SEMUA interactive widget WAJIB `ValueKey`
- ✅ List items composite: `product_card_{productId}`, `cart_item_{cartItemId}`
- ✅ Naming: `snake_case` dengan konteks
- ✅ State indicator: `loading_indicator`, `empty_cart_message`
- ✅ Value-bearing widget: text yang punya angka penting (harga, total, order number) — assertable
- ✅ Centralize ValueKey constants di `lib/utils/test_keys.dart`

### ValueKey inventory (draft — sweep saat implementasi)

**Auth:** `login_screen` `login_email_input` `login_password_input` `login_submit_button` `login_error_message` · `register_screen` `register_email_input` `register_password_input` `register_name_input` `register_submit_button`

**Bottom nav:** `nav_home` `nav_categories` `nav_cart` `nav_profile` · `cart_badge`

**Home:** `home_screen` `hero_banner` `category_grid` `category_item_{slug}` · `featured_products_list` `product_card_{productId}`

**Categories:** `categories_screen` `category_grid_item_{slug}` · `category_products_screen` `category_header_{slug}` `products_grid`

**Search:** `search_screen` `search_input` `filter_button` `filter_sheet` `filter_category_{slug}` `filter_size_{size}` `filter_price_min` `filter_price_max` `filter_apply` `filter_clear` · `search_results` `empty_search_state`

**Product Detail:** `product_detail_screen` `product_image_carousel` `product_image_{index}` `product_name` `product_price` `product_price_original` `product_discount_badge` · `size_selector_{size}` `color_selector_{color}` `stock_indicator` · `qty_stepper_decrement` `qty_stepper_increment` `qty_value` · `add_to_cart_button` `add_to_cart_snackbar` · `related_products_list`

**Cart:** `cart_screen` `cart_item_{cartItemId}` `cart_item_qty_{cartItemId}` `cart_item_remove_{cartItemId}` · `cart_subtotal` `cart_discount` `cart_delivery_fee` `cart_total` · `promo_code_input` `promo_code_apply` `promo_code_remove` `promo_code_error` · `checkout_button` `cart_empty_state`

**Checkout:** `checkout_screen` · `checkout_step_indicator` `checkout_step_address` `checkout_step_delivery` `checkout_step_payment` `checkout_step_review` · `address_form` `address_recipient_input` `address_phone_input` `address_street_input` `address_city_input` `address_postal_input` · `location_permission_button` `use_saved_address_{addressId}` · `delivery_method_{id}` · `payment_method_{id}` · `place_order_button`

**Order:** `order_confirmation_screen` `order_number` `order_eta` `view_order_button` · `order_detail_screen` `order_status_timeline` `order_status_{status}` `order_item_{productId}` `order_summary` · `order_history_screen` `order_history_item_{orderId}` `empty_order_history`

**Profile & Address:** `profile_screen` `profile_email` `profile_name` `login_prompt_button` `logout_button` · `address_book_screen` `address_item_{id}` `add_address_button` · `address_form_screen`

**Settings:** `settings_screen` `theme_selector` `theme_light` `theme_dark` `theme_system` `currency_selector` · `dev_menu_trigger` (long-press profile avatar)

**Permission & Notification (system-level):** `notification_permission_dialog` (system, Appium handle via UiSelector) · `location_permission_dialog` (system)

---

## 8. Fitur Khas Mobile

Sama seperti v2 (RN version), 3 fitur:

### A. Push Notification — flutter_local_notifications

Order status update simulation:
- Setelah order placed, schedule 3 notification via `flutter_local_notifications`:
  - +30s → status Preparing
  - +60s → status Shipped
  - +90s → status Delivered
- Setiap notification: title `Order #{orderNumber}`, body `Status: {status}`
- Tap notification → navigate ke Order Detail (via go_router deep link internal)
- Handle **POST_NOTIFICATIONS permission** (Android 13+) — request kontekstual saat first checkout

### B. Runtime Permission — permission_handler

**Location permission** di checkout address:
- Tombol "Detect My Address" → request `Permission.location`
- 3 states: granted (mock geocode ke alamat Jakarta), denied (fallback manual), permanentlyDenied (dialog "Buka Settings" via `openAppSettings()`)

**Notification permission** (Android 13+):
- Request saat first checkout, kontekstual
- Kalau denied, order tetap create — notification skip, log warning

### G. Gesture — leverage Flutter widgets

- **Swipe-to-delete** di cart: `Dismissible` widget bawaan
- **Pull-to-refresh** di home & category: `RefreshIndicator` bawaan
- **Pinch-to-zoom** di product image: `InteractiveViewer` bawaan

Semua widget bawaan Flutter, gak butuh external package.

---

## 9. Struktur Folder

```
wearway_flutter/
├── lib/
│   ├── main.dart                         # App entry, Hive init, seed init
│   ├── app.dart                          # MaterialApp + theme + router
│   ├── core/
│   │   ├── theme/
│   │   │   ├── app_theme.dart            # Material 3 theme (light + dark)
│   │   │   ├── app_colors.dart
│   │   │   ├── app_typography.dart
│   │   │   └── app_spacing.dart
│   │   ├── router/
│   │   │   └── app_router.dart           # go_router config
│   │   ├── constants/
│   │   └── extensions/
│   ├── data/
│   │   ├── models/                       # Hive models (with @HiveType)
│   │   ├── adapters/                     # HiveTypeAdapter generated
│   │   ├── repositories/
│   │   │   ├── product_repository.dart
│   │   │   ├── category_repository.dart
│   │   │   ├── cart_repository.dart
│   │   │   ├── order_repository.dart
│   │   │   ├── user_repository.dart
│   │   │   ├── address_repository.dart
│   │   │   └── settings_repository.dart
│   │   └── seed/
│   │       ├── seed_manager.dart
│   │       ├── product_seed.dart
│   │       ├── category_seed.dart
│   │       ├── user_seed.dart
│   │       └── order_seed.dart
│   ├── features/                         # Feature-first organization
│   │   ├── auth/
│   │   │   ├── providers/                # Riverpod providers
│   │   │   ├── screens/
│   │   │   └── widgets/
│   │   ├── home/
│   │   ├── categories/
│   │   ├── search/
│   │   ├── product/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── order/
│   │   ├── profile/
│   │   ├── address/
│   │   └── settings/
│   ├── shared/
│   │   ├── widgets/                      # Reusable widgets (ProductCard, EmptyState, LoadingState)
│   │   └── providers/                    # Global providers (theme, connectivity, dll)
│   ├── notifications/
│   │   ├── notification_service.dart
│   │   └── order_status_scheduler.dart
│   ├── permissions/
│   │   └── permission_service.dart
│   └── utils/
│       ├── test_keys.dart                # Centralized ValueKey constants
│       ├── currency_formatter.dart
│       └── date_formatter.dart
├── assets/
│   ├── products/                         # 60 product images (Unsplash/Pexels download)
│   ├── categories/                       # Category icons/hero images
│   ├── banners/                          # Home hero banner
│   └── logo/
├── test/                                 # Unit + widget tests
│   ├── unit/
│   │   ├── repositories/
│   │   ├── utils/
│   │   └── notifications/
│   └── widget/                           # Widget test (smoke)
├── android/                              # Native shell
├── ios/                                  # Native shell
├── pubspec.yaml
├── analysis_options.yaml                 # Lint rules
├── CLAUDE.md
├── PROJECT_PLAN.md                       # File ini
└── README.md
```

---

## 10. Build Prompts

### Fase 0 — Foundation

**Prompt 1 — Scaffold Flutter + core setup**

```
Scaffold Flutter project "wearway_flutter":

1. flutter create wearway_flutter --org com.wearway --platforms android,ios
   (target platform Android primary, iOS bonus)
2. Verify Flutter version: flutter --version (harus 3.24+ stable)
3. Dependencies (pubspec.yaml):
   - flutter_riverpod, riverpod_annotation, riverpod_generator (v2 with codegen)
   - go_router
   - hive, hive_flutter
   - fl_chart
   - cached_network_image
   - flutter_local_notifications
   - permission_handler
   - lucide_icons
   - intl
   - crypto (untuk password hashing)
   
   Dev deps:
   - build_runner
   - hive_generator
   - riverpod_generator
   - custom_lint, riverpod_lint
   - mocktail
   - very_good_analysis (lint preset yang strict)

4. Setup Material 3 theme (lib/core/theme/):
   - Warna primary: eco theme (hijau segar) — sesuai brand WearWay
   - Dark mode support
   - Custom typography scale
   - Spacing constants (4/8/12/16/24/32)

5. Setup go_router (lib/core/router/):
   - Route utama: /home, /categories, /search, /product/:id, /cart, /checkout, /order/:id, /profile, /auth/login, /auth/register, /settings
   - ShellRoute untuk bottom nav (home, categories, cart, profile)
   - Redirect logic (kalau protected route + not logged in → /auth/login)

6. Setup Hive di main.dart:
   - Hive.initFlutter()
   - Register semua TypeAdapter (nanti setelah generate di Prompt 2)
   - Open box: 'products', 'categories', 'users', 'addresses', 'cart_items', 'orders', 'settings', 'meta'

7. Buat basic MaterialApp dengan bottom nav shell:
   - 4 tab dengan Icon + Label
   - Placeholder screen per tab
   - Semua interactive widget punya ValueKey (nav_home, nav_categories, nav_cart, nav_profile)

8. Setup analysis_options.yaml dengan very_good_analysis + custom rules:
   - avoid_print
   - prefer_const_constructors
   - always_declare_return_types

9. Struktur folder sesuai PROJECT_PLAN section 9

CATATAN untuk agent: user baru di Flutter (dari RN background). Kasih inline comment SINGKAT
(1-2 baris) di konsep kunci pertama muncul: StatelessWidget/StatefulWidget, ConsumerWidget
(Riverpod), Widget vs component (RN), key vs testID, MaterialApp, Scaffold, hot reload.
JANGAN paragraph tutorial.

Sebelum lapor selesai:
- flutter analyze bersih (0 warning)
- flutter run: app compile & install di emulator
- Bottom nav 4 tab switchable
- Theme Material 3 applied (bukan default look)
- Screenshot home placeholder
```

**Prompt 2 — Data layer: Hive models + repositories + deterministic seed**

```
Setup Hive data layer + repository pattern + deterministic seed.

1. Buat semua model di lib/data/models/ sesuai PROJECT_PLAN section 5:
   - product_model.dart, category_model.dart, user_model.dart, address_model.dart,
     cart_item_model.dart, order_model.dart, order_item_model.dart, order_status.dart
   - Semua dengan @HiveType + @HiveField annotations
   - typeId unique per class (0-7)

2. Run build_runner untuk generate TypeAdapter:
   flutter pub run build_runner build --delete-conflicting-outputs
   - Verify generated files: *.g.dart

3. Register semua adapter di main.dart sebelum openBox

4. Repository layer (lib/data/repositories/):
   - Setiap repo async, expose Future
   - product_repository.dart: list(filters?), getById, findByCategory, findFeatured, search
   - category_repository.dart: list, getById
   - user_repository.dart: register, login, logout, getCurrent, updateProfile
     - Password hashing pakai crypto SHA256 + salt (simple, untuk local only)
   - address_repository.dart: list(userId), getById, create, update, delete, setDefault
   - cart_repository.dart: list(userId?), add, updateQty, remove, clear, transferGuestToUser
   - order_repository.dart: list(userId), getById, create, updateStatus
   - settings_repository.dart: getTheme, setTheme, getCurrency, setCurrency

5. Riverpod providers untuk setiap repository (lib/features/*/providers/):
   - Gunakan @riverpod annotation (codegen)
   - StreamProvider untuk data yang reactive (product list, cart items, order list)
   - FutureProvider untuk one-shot fetch
   - Notifier untuk stateful (cart notifier, auth notifier)

6. Seed data (lib/data/seed/):
   - SEED_VERSION constant = 1
   - SEED_REFERENCE_DATE = DateTime(2026, 1, 1)
   - product_seed.dart: 60 produk fashion (10 per 6 categories)
     - Fixed IDs (prod_tshirt_black_01, prod_hoodie_gray_02, ...)
     - Deterministic price, size, color, rating, review count
     - Image path relative: 'assets/products/{productId}.jpg'
   - category_seed.dart: 6 categories (T-Shirt, Hoodie, Pants, Shoes, Bags, Accessories)
   - user_seed.dart: 2 user (customer@example.com + customer2@example.com)
   - order_seed.dart: 5 order untuk customer@example.com (mix status)
   - seed_manager.dart:
     - initSeed(): cek Hive box 'meta' key 'seed_version', kalau beda, clear + re-seed
     - resetSeed(): clear semua box + re-init
   - Panggil initSeed() di main.dart setelah Hive setup

7. Assets images:
   - Untuk sekarang, gunakan placeholder image via cached_network_image dengan Unsplash source URL:
     https://source.unsplash.com/400x400/?tshirt,fashion&sig={productId}
   - Nanti user download real assets di prompt terpisah

8. Unit test (test/unit/):
   - repositories: mock Hive box (mocktail), test CRUD operation
   - seed_manager: test idempotent (call 2x, count sama)
   - password hashing: hash != plaintext, verify works

Sebelum lapor selesai:
- build_runner generate sukses
- Seed jalan di first launch (log: "Seeded 60 products, 6 categories, 2 users, 5 orders")
- Re-run app: tidak duplikat (idempotent)
- Manual verify via debug log atau custom debug screen
- Unit test hijau
- flutter analyze bersih
```

**Prompt 3 — Auth flow + basic navigation**

```
Setup autentikasi (register/login/logout) + navigasi guard.

1. Auth screens (lib/features/auth/):
   - login_screen.dart: form email + password, validation, error inline, submit → auth notifier
   - register_screen.dart: email + password + confirm password + name, validation
   - Testability: semua input, button, error message dengan ValueKey

2. Auth state management (lib/features/auth/providers/):
   - auth_notifier.dart: AsyncNotifier<UserModel?>
   - Methods: login(email, pass), register(...), logout(), restoreSession()
   - Persist session di Hive 'meta' box (key: 'current_user_id')
   - restoreSession() dipanggil di main.dart / app.dart setelah Hive init

3. Router guard (lib/core/router/):
   - Redirect ke /auth/login kalau access protected route + not logged in
   - Protected routes: /checkout, /order/*, /profile/addresses, /order-history
   - Public routes: /home, /categories, /search, /product/*, /cart (guest cart OK)

4. Profile screen (lib/features/profile/):
   - Kalau logged in: tampilkan user info, "Manage Addresses" link, "Order History" link, "Settings" link, "Logout" button
   - Kalau guest: tampilkan "Login untuk mulai belanja" + button ke /auth/login
   - Dev menu trigger: long-press avatar → dev menu modal (implement kosong dulu, isi nanti)

5. Testability sesuai PROJECT_PLAN section 7 (Auth section)

6. Update main.dart:
   - restoreSession() sebelum go_router mount
   - Loading splash saat restore

Unit test:
- auth_notifier: login happy path, wrong password, register duplicate email
- password validation (min 8 char)

Sebelum lapor selesai:
- Fresh install → guest → browse → login → session persist saat kill & re-open app
- Logout works, kembali ke guest state
- Direct URL /checkout saat not logged in → redirect ke login
- flutter analyze bersih
```

### Fase 1 — Core Browse Experience

**Prompt 4 — Home + Categories + Product Detail**

```
Build browse experience: Home, Categories, Product Detail.

1. Home screen (lib/features/home/):
   - Hero banner (image dari assets/banners/ atau Unsplash — pilih 1-3 rotate)
   - Category grid (2 kolom, 6 kategori dengan icon + nama)
   - Featured products (LazyRow horizontal scroll, 8-10 products)
   - Pull-to-refresh (RefreshIndicator)
   - Tap category → navigate /categories/:slug
   - Tap product → navigate /product/:id
   - Loading state (skeleton dengan shimmer atau CircularProgressIndicator)

2. Categories tab (lib/features/categories/):
   - /categories: grid 2 kolom semua kategori (dengan product count)
   - /categories/:slug: list products di kategori itu (GridView 2 kolom)
   - Pull-to-refresh
   - Empty state kalau 0 products

3. Product Detail (lib/features/product/product_detail_screen.dart):
   - Image carousel (PageView) — pinch-to-zoom via InteractiveViewer
   - Product name, price (dengan discount jika ada — strikethrough original + red current)
   - Rating & review count
   - Size selector (Wrap dengan ChoiceChip)
   - Color selector (Wrap dengan ChoiceChip warna dot)
   - Quantity stepper (- 1 +)
   - Stock indicator ("Stok: 12" atau "Habis" kalau 0)
   - Add to Cart button (disabled kalau size/color/qty gak dipilih atau out of stock)
   - Success snackbar setelah add to cart
   - Related products (LazyRow, based on same category)

4. ProductCard shared widget (lib/shared/widgets/product_card.dart):
   - Image (cached_network_image, aspect ratio 1:1)
   - Name (max 2 lines, ellipsis)
   - Price (dengan discount if ada)
   - Rating dan review count
   - Badge (New/Sale) top-right
   - Tap → navigate /product/:id
   - ValueKey composite: product_card_{productId}

5. Bottom nav cart badge:
   - Watch cart_notifier via Riverpod, tampilkan count kalau > 0
   - Auto-update saat add to cart

Testability sesuai section 7 (Home, Categories, Product Detail sections).

UI polish notes:
- Gunakan Material 3 Card dengan elevation ringan
- Spacing generous (padding 16-24)
- Aspect ratio image konsisten
- Skeleton loading (shimmer package optional) — atau simple placeholder

Sebelum lapor selesai:
- Home → tap category → CategoryProducts → tap product → ProductDetail
- Add to cart flow works (pilih size, color, qty → add → badge update)
- Pinch-to-zoom di product image works
- Pull-to-refresh works di home & category
- flutter analyze bersih
```

**Prompt 5 — Search + Cart + Swipe-to-delete**

```
Build Search + Cart dengan gesture khas mobile.

1. Search screen (lib/features/search/):
   - Search bar di top (TextField, debounce 300ms)
   - Filter button → show ModalBottomSheet:
     - Category multi-select (Checkboxes)
     - Size multi-select (ChoiceChips)
     - Price range (RangeSlider)
     - Only in-stock toggle
     - Apply + Clear button
   - Search result GridView 2 kolom
   - Empty state ("Tidak ada hasil untuk '{query}'")
   - Loading skeleton
   - State via Riverpod (search notifier)

2. Cart screen (lib/features/cart/):
   - ListView cart items — setiap item:
     - Product image, name, selected size & color, price per unit, qty stepper, subtotal
     - Dismissible widget: swipe kiri → confirmation dialog → remove
     - Alternative: tombol trash icon (buat backup kalau gesture flaky di test)
   - Empty state: illustration + "Cart kosong" + "Mulai Belanja" button
   - Bottom summary Card:
     - Subtotal
     - Discount (kalau promo applied)
     - Delivery fee (Rp 15rb, atau Rp 0 kalau subtotal > Rp 300rb — free shipping)
     - Total
     - Promo code input (dengan Apply button, error message inline)
     - Checkout button (disabled kalau cart empty)

3. Cart notifier (lib/features/cart/providers/cart_notifier.dart):
   - Watch cart items (Stream dari cart repository)
   - Method: addToCart, updateQty, removeItem, applyPromo, removePromo, clearCart
   - Transfer guest cart to user saat login (call di auth_notifier setelah login sukses)

4. PromoService (lib/features/cart/services/promo_service.dart):
   - Hardcoded promo codes:
     - "wearway10" → 10% off
     - "WELCOMEBACK" → Rp 20.000 off
     - Kondisi minimum subtotal per promo
   - Method: validatePromo(code, subtotal) → PromoResult (isValid, discount, message)
   - Unit test comprehensive

5. Testability sesuai section 7 (Search, Cart sections)

Sebelum lapor selesai:
- Search + filter kombinasi works, ter-filter benar
- Swipe cart item → confirmation → remove works
- Promo code apply → discount muncul, total update
- Guest cart transfer saat login works
- Unit test promo service hijau
- flutter analyze bersih
```

### Fase 2 — Checkout + Fitur Khas Mobile

**Prompt 6 — Checkout multi-step + Runtime Permission**

```
Build checkout flow (multi-step) + runtime permission handling.

1. Checkout screen (lib/features/checkout/):
   - Stepper dengan 4 step: Address → Delivery → Payment → Review
   - Step indicator di top (ValueKey: checkout_step_indicator)
   - Butuh login (kalau guest, redirect ke login dengan return URL)

2. Step 1 — Address:
   - "Detect My Address" button → request Permission.location (permission_handler)
     - Granted: mock geocode ke alamat Jakarta dummy, isi form fields
     - Denied: SnackBar "Izin ditolak", focus ke manual input
     - PermanentlyDenied: AlertDialog "Buka Settings?" → openAppSettings()
   - Atau: "Use saved address" dropdown (kalau punya address book entry)
   - Manual form: recipient name, phone, street, city, postal code
   - Save address checkbox: "Simpan sebagai alamat baru"
   - Next button (disabled kalau field wajib kosong)

3. Step 2 — Delivery:
   - RadioButton per delivery option:
     - Regular (2-3 hari, Rp 15rb)
     - Express (Same day, Rp 35rb)
     - Free (>Rp 300rb subtotal, otomatis selected)
   - Estimated delivery date display

4. Step 3 — Payment:
   - RadioButton per payment method:
     - COD (Cash on Delivery)
     - Bank Transfer (mock, tampilkan instruction)
     - E-Wallet mock (GoPay, OVO — cuma display, gak beneran integrate)

5. Step 4 — Review:
   - Summary: alamat, delivery method, payment method, items list, total breakdown
   - Terms checkbox
   - Place Order button:
     - Request POST_NOTIFICATIONS permission (Android 13+, kontekstual)
     - Create Order + OrderItems via order_repository (transaction — batch write ke Hive)
     - Clear cart
     - Schedule notification (Prompt 7)
     - Navigate ke OrderConfirmation

6. OrderConfirmation screen:
   - Success animation (Lottie optional atau simple check icon)
   - Order number, ETA, "View Order Details" button
   - "Back to Home" button

7. Address Book (lib/features/address/):
   - /profile/addresses: ListView addresses, tap → edit, swipe → delete
   - Add button → address form (label, recipient, phone, street, city, postal, isDefault)
   - CRUD operations via address_repository

8. Permission service (lib/permissions/permission_service.dart):
   - requestLocation() → status
   - requestNotification() → status
   - openSettings() wrapper
   - Testable dengan mock

Testability sesuai section 7 (Checkout, Address sections).

Sebelum lapor selesai:
- Full checkout flow: address → delivery → payment → review → place order → confirmation
- Location permission 3 states handled
- Notification permission request muncul di Android 13+
- Address book CRUD works
- Order created di Hive setelah place order
- flutter analyze bersih
```

**Prompt 7 — Push Notification (order status simulation) + Order Detail**

```
Tambah local push notification untuk order status simulation + Order Detail screen.

1. Setup flutter_local_notifications:
   - Init di main.dart (before runApp)
   - Android channel: 'order_updates', importance DEFAULT
   - iOS setup (permission handling ada di package)
   - Notification tap handler: parse payload → navigate ke /order/:id via go_router

2. Notification service (lib/notifications/notification_service.dart):
   - showOrderStatusNotification(orderNumber, status, orderId)
   - Payload include orderId untuk navigation on tap

3. Order status scheduler (lib/notifications/order_status_scheduler.dart):
   - scheduleOrderStatusUpdates(orderId, orderNumber):
     - Timer 30s: update order.status = preparing di Hive + show notification
     - Timer 60s: status = shipped + notification
     - Timer 90s: status = delivered + notification
   - Timer disimpan di Map<orderId, List<Timer>> (biar bisa dibatalkan kalau perlu)
   - Panggil dari checkout setelah order created

4. Order Detail screen (lib/features/order/order_detail_screen.dart):
   - Header: order number, placed date
   - Status timeline (custom widget):
     - 4 step (Placed → Preparing → Shipped → Delivered) dengan checkmark yang update reactive
     - Watch order via Riverpod (reactive dari Hive box)
   - Items list (snapshot dari order.items)
   - Address summary
   - Payment method
   - Total breakdown
   - Cancel Order button (kalau status masih placed atau preparing — dev only, opsional)

5. Order History screen (lib/features/order/order_history_screen.dart):
   - ListView orders (sorted by placedAt DESC)
   - Setiap card: order number, placed date, total, status badge, first product image
   - Tap → /order/:id
   - Empty state kalau 0 order

6. Deep link dari notification:
   - Update go_router untuk handle URI: /order/:id
   - Tap notification saat app background → app buka → navigate ke order detail
   - Test di emulator: place order → background app → tunggu 30s → notification muncul → tap → order detail buka dengan status Preparing

Testability sesuai section 7 (Order sections) + system notification (ValueKey gak berlaku untuk system, Appium handle via native locator).

Sebelum lapor selesai:
- Place order → 30s → notification muncul + status update
- Tap notification → order detail dengan status Preparing
- Tunggu 60s → notification kedua, status Shipped
- Tunggu 90s → notification ketiga, status Delivered
- Kalau permission denied di Android 13+, order tetap create, notifikasi skip, log warning
- Order history menampilkan 5 seed order + 1 new order
- flutter analyze bersih
```

### Fase 3 — Assets + Polish + Handoff

**Prompt 8 — Real assets integration + polish + dev menu**

```
Integrate real fashion assets + polish semua screen + dev menu.

1. Assets integration:
   - User bakal download 60 product images (fashion) dari Unsplash/Pexels dan simpan di assets/products/
   - File naming sesuai productId: {productId}.jpg (misal prod_tshirt_black_01.jpg)
   - Update product_seed.dart: imageUrls pakai asset path 'assets/products/{productId}.jpg' (bukan URL)
   - Update pubspec.yaml assets section untuk include products, categories, banners, logo
   - Update ProductCard & ProductDetail: gunakan Image.asset (bukan cached_network_image) untuk product image
   - Fallback: kalau file gak ada, tampilkan placeholder

2. Category icons:
   - Download 6 category icons/hero (Unsplash search: tshirt, hoodie, pants, shoes, bags, accessories)
   - Simpan di assets/categories/
   - Update category_seed.dart

3. Hero banner:
   - 1-3 banner image fashion di assets/banners/
   - Rotate di home screen (PageView autoplay optional)

4. App logo & splash:
   - App icon: 1024x1024 (bisa AI generated dengan text "FM" atau fashion icon)
   - Android splash: flutter_native_splash package (recommended)
   - iOS splash

5. Dev menu (long-press profile avatar):
   - Modal bottom sheet dengan opsi:
     - Reset all data (call seed_manager.resetSeed())
     - Speed up order status simulation (toggle: 30s → 5s per step) — persist di settings
     - Clear scheduled notifications
     - Toggle skip login (auto-login as customer@example.com untuk dev testing)
     - Show seed version + build info
   - Save toggle state di Hive 'meta' box

6. UX Polish:
   - Semua empty state punya illustration + copy + CTA (Lottie optional)
   - Loading skeleton konsisten (shimmer atau simple Container)
   - Error boundary di semua async operation
   - Toast/SnackBar konsisten (Material 3 SnackBar dengan action)
   - Confirmation dialog untuk destructive actions

7. Theme dark mode:
   - Support di semua screen (tested visual)
   - Theme toggle di Settings works instantly (bukan restart)
   - Warna cohesive di light + dark

8. Currency formatting:
   - CurrencyFormatter utility (lib/utils/currency_formatter.dart)
   - Format: "Rp 199.000" (titik ribuan, no decimal)
   - Unit test edge cases (0, negative, million+)
   - Konsisten di seluruh app

9. Accessibility:
   - Semua image punya semanticLabel (kecuali dekoratif — explicit empty)
   - Kontras WCAG AA
   - Font scaling (respect device settings)

10. Smoke widget test (test/widget/):
    - Test bottom nav switch antar tab
    - Test add to cart → cart badge update
    - Test login flow
    - Ini pre-Appium sanity check

Sebelum lapor selesai:
- Real product image tampil di home, category, product detail, cart, order (bukan lagi Unsplash URL)
- Dark mode: semua screen tested visual (screenshot before/after)
- Dev menu functional (reset, speed up mode, skip login)
- Smoke widget test hijau
- flutter analyze bersih
```

**Prompt 9 — QA-HANDOFF.md draft**

```
Buat QA-HANDOFF.md sesuai pola cross-project (lihat QA-HANDOFF.md di CoursePlatform).

Sections:
1. At a glance — stack, target automation (Appium Flutter Driver + Java), status app
2. Cara jalankan lokal:
   - flutter pub get
   - flutter run (Android emulator)
   - Reset seed via dev menu
3. Strategi repo — main repo (app) vs automation repo (separate, upcoming)
4. Automation gotchas khusus Flutter + Appium:
   - ValueKey → Appium finder.byValueKey() mapping
   - Flutter widget tree beda dari native (Semantics tree kadang ambigu)
   - Text field: gunakan finder.byValueKey (bukan by text)
   - Gesture: Dismissible swipe, InteractiveViewer pinch — perlu specific Appium action
   - System permission dialog (notification, location): Appium handle via UiSelector (bukan Flutter finder)
   - Notification: appium native locator via UiSelector after openNotifications()
   - Speed up mode di dev menu untuk mempercepat E2E test
   - Deep link dari notification: perlu test scenario khusus (app in background → notification tap → deep link → verify screen)
   - Hive persistence antar test: perlu clear box di test setup (via dev menu reset atau adb command)
5. Personas & credentials
6. Fitur & status yang bisa di-test
7. Peta route (go_router structure)
8. ValueKey inventory — full list dari section 7 PROJECT_PLAN
9. Alur berisiko tinggi (test paling dalam):
   - Checkout flow (multi-step, wajib login)
   - Order status simulation via notification (async, timing-sensitive)
   - Permission handling (3 states)
   - Cart calculations (promo, delivery fee threshold)
   - Deep link from notification
10. Risk matrix (prioritas testing L/M/H per fitur)
11. Coverage white-box yang udah ada (unit + widget test dari main repo)
12. Batasan yang diketahui:
    - Mock data (bukan real backend)
    - Payment mock
    - iOS mungkin belum tested fully (Android primary)
13. Pointer dokumen: PROJECT_PLAN, upstream reference (medusa-mobile as historical basis)
14. Konteks portfolio QA — link ke plan portfolio, project lain

Sebelum lapor selesai:
- QA-HANDOFF.md ready
- Konsisten pola dengan CoursePlatform + Duitku
- User bisa baca dan langsung tahu apa yang bisa di-Appium-in nanti
```

---

## 11. Anti-Pattern

### Flutter / Dart
- ❌ JANGAN pakai StatefulWidget kalau bisa StatelessWidget + Riverpod
- ❌ JANGAN skip `const` constructor (very_good_analysis lint enforce)
- ❌ JANGAN pakai `setState` di ConsumerWidget (pakai Riverpod state)
- ❌ JANGAN nested MaterialApp
- ❌ File widget > 300 baris → split
- ❌ Widget class > 5 level nested → refactor jadi named widget

### Riverpod
- ❌ JANGAN pakai StateNotifier legacy — pakai @riverpod codegen
- ❌ JANGAN watch provider di build method banyak kali — extract ke variable
- ❌ JANGAN Provider global kalau bisa AutoDispose (default v2 codegen)

### Data (Hive)
- ❌ JANGAN akses Hive box langsung dari widget — via repository
- ❌ JANGAN random di seed generator
- ❌ JANGAN pakai DateTime.now() di seed — SEED_REFERENCE_DATE constant
- ❌ JANGAN pakai double untuk amount (int Rupiah)
- ❌ JANGAN skip Hive.close() saat app dispose

### Testability
- ❌ JANGAN skip ValueKey di interactive widget — Appium Flutter finder pecah
- ❌ JANGAN pakai text content sebagai locator utama
- ❌ JANGAN inconsistent naming
- ✅ Centralize di lib/utils/test_keys.dart

### Architecture
- ❌ JANGAN campur go_router dengan Navigator.push (pilih go_router)
- ❌ JANGAN business logic di widget → provider / service / util
- ❌ JANGAN skip loading/error state di async widget

### Security (personal shopping app)
- ❌ JANGAN store password plaintext → SHA256 + salt
- ❌ JANGAN log password/PII ke console

### UI
- ❌ JANGAN default Container/Text tanpa theme reference
- ❌ JANGAN hardcode color hex → gunakan Theme.of(context).colorScheme.*
- ❌ JANGAN skip empty/loading/error state
- ✅ Spacing dari AppSpacing constants
- ✅ Typography dari Theme.of(context).textTheme

### Scope
- ❌ JANGAN tambah backend / Firebase
- ❌ JANGAN tambah real payment
- ❌ JANGAN tambah role admin/seller
- ❌ JANGAN setup Appium/automation di repo ini (repo terpisah)

Aturan umum di `CLAUDE.md`.

---

## 12. Hubungan ke Portfolio QA

| Project | SUT stack | Automation | Skill khas |
|---|---|---|---|
| Petpals | Next.js | Playwright | Web foundation |
| CoursePlatform | Next.js | Playwright BDD | BDD/Gherkin |
| CMS | Strapi | Selenium Java + Allure | Java, SUT not-owned |
| Admin Dashboard | Next.js | Katalon Studio | Low-code, data-driven |
| **WearWay (ini, v3 Flutter)** | **Flutter + Riverpod + Hive** | **Appium Flutter Driver (Java)** | **Flutter/Dart, ValueKey testability, appium-flutter-driver, career readiness Flutter QA** |
| Duitku | RN Expo + Gluestack | Maestro (YAML) | RN, cross-platform E2E |

**Yang membedakan project ini:**
- **Flutter stack** — beda paradigm dari RN (widget-based, Dart language)
- **Appium Flutter Driver** — plugin Appium untuk framework non-standard, transferable skill ke real Flutter QA job
- **ValueKey testability** — bukan `testID`, tapi konsep sama (kontrak ke automation)
- **Career investment** — probability lo ketemu Flutter di industri = real, exposure worth
- **Rebuild from scratch** — showcase ownership arsitektur (kontras dengan fork strategy sebelumnya di v2)

**Setelah project ini done:**
- 6 SUT semua kelar (batch build phase complete)
- Trio mobile: WearWay Flutter + Duitku RN Expo + rencana automation cross-tool (Appium + Maestro)
- Fokus shift ke: automation batch (5 project pending automation) + performance testing project
