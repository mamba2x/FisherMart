# FisherMart — Manual Synchronization Testing Checklist (24 Steps)

Follow these steps to manually verify the offline-first anonymous authentication, atomic migration, and cross-device order routing lifecycle.

---

## Part 1: Offline Onboarding & Product Logging (Device A)

| Step | Action | Expected Result | Checked |
|:---:|---|---|:---:|
| **1** | Install the app on **Device A**. Clear any existing storage. **Keep mobile data and Wi-Fi completely OFF.** | App opens and shows the splash screen, then redirects to the onboarding screen. | [ ] |
| **2** | Before registering, try navigating to the Inventory screen or clicking the "Add Catch" button. | Product logging is blocked. A warning pops up: *"No registered fisher identity found. Complete registration before creating records."* | [ ] |
| **3** | Go to the **Register** screen. Enter: Name = `Fisher Delta A`, Phone = `08012345678`, Zone = `Warri`. Click **Register**. | Account is created locally. SQLite settings table is populated with `auth_pending = true` and a stable generated `temporary_owner_id`. | [ ] |
| **4** | Go to **Inventory** → **Add Catch**. Fill in: Name = `Fresh Catfish`, Species = `Clarias gariepinus`, Catch Date = `2026-07-18`, Qty = `20 kg`, Price = `₦2,000`. Click **Save**. | Product is successfully saved locally. Its `sync_status` displays as **Pending Sync** (amber). | [ ] |
| **5** | Close the app completely (kill from recent tasks) while still offline. | App processes terminate cleanly. | [ ] |
| **6** | Re-open the app (still offline). Go to **Inventory**. | The `Fresh Catfish` remains visible in your local list with the **Pending Sync** badge. | [ ] |

---

## Part 2: Session Migration & Sync (Device A)

| Step | Action | Expected Result | Checked |
|:---:|---|---|:---:|
| **7** | *[Verification of Atomicity]* Simulate a database write failure during migration (e.g. by mocking error or inspecting code). | The transaction rolls back completely. `auth_pending` remains `true` in SQLite and AsyncStorage. No cloud sync starts. | [ ] |
| **8** | Turn internet connection **ON** on **Device A**. | The connection banner changes from red (Offline) to green/transparent. | [ ] |
| **9** | Wait a few seconds or go to **Profile** → Tap **Sync Now**. | `ensureAnonymousSession()` triggers automatically. `signInAnonymously()` completes successfully with Supabase. | [ ] |
| **10** | Verify the database state post-migration. | SQLite transaction executes: `temporary_owner_id` is replaced by the real Supabase `auth.uid()` in `products`, `orders`, and `sync_queue` payloads. `auth_pending` is set to `false`. | [ ] |
| **11** | Let the sync engine push the migration payload. | The profile is upserted to the Supabase `profiles` table. The product is synced to Supabase `products`. | [ ] |
| **12** | Inspect the UI indicators on **Device A**. | The `Fresh Catfish` sync badge changes to **Synced** (green). Pending sync count becomes `0`. | [ ] |
| **13** | Log into the Supabase Dashboard, view the `products` table. | The product row exists. Its `owner_id` matches the user's authentic `auth.uid()`. No Row Level Security (RLS) policies were violated. | [ ] |

---

## Part 3: Cross-Device Marketplace & Ordering (Device B)

| Step | Action | Expected Result | Checked |
|:---:|---|---|:---:|
| **14** | Install the app on **Device B**. Keep internet connection **ON**. | App launches and sets up an active anonymous session immediately. | [ ] |
| **15** | Register as `Buyer B`, Phone = `09087654321`, Zone = `Burutu`. | Account created. Profile is instantly synced to Supabase. | [ ] |
| **16** | Go to the **Marketplace** tab on **Device B**. Refresh the screen. | The `Fresh Catfish` product posted by `Fisher Delta A` appears in the market list. | [ ] |
| **17** | Tap the product to open details. Enter Quantity = `5`, click **Order**. | Order is successfully recorded locally on **Device B** with `seller_id` matching Device A's authentic UID. | [ ] |
| **18** | Confirm the order sync on **Device B**. | Order status is uploaded to Supabase. Dashboard `orders` table shows the row with `owner_id = Device B uid` and `seller_id = Device A uid`. | [ ] |
| **19** | **Device A** (Seller) opens the app (online) and syncs. | A new order appears in the **Orders** tab on Device A for `5 kg` of `Fresh Catfish` from `Buyer B`. | [ ] |

---

## Part 4: Offline Seller Status Updates & Security (Device A & B)

| Step | Action | Expected Result | Checked |
|:---:|---|---|:---:|
| **20** | Turn internet connection **OFF** on **Device A** (Seller). | Connection status indicator shows Offline. | [ ] |
| **21** | On **Device A**, open the incoming order and click **Accept**. | The order status changes to **Accepted** locally immediately. Its sync status changes to **Pending Sync** (amber). | [ ] |
| **22** | Turn internet connection **ON** on **Device A** (Seller). | Auto-sync fires. The queued `ORDER_STATUS_UPDATE` is dispatched to the Supabase `update_order_status` RPC. | [ ] |
| **23** | Check status after sync on both devices. | **Device A** order status updates to **Synced** (green). **Device B** syncs and shows the order status has been updated to **Accepted**. | [ ] |
| **24** | *[Security Check]* Attempt to execute `update_order_status` RPC using a different user ID, or send an invalid status (e.g. `shipped`). | The database throws an exception: `Invalid status` or `Unauthorised: you are not the seller of this order`. The request is rejected by PostgreSQL RLS. | [ ] |
