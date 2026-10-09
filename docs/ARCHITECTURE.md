# Architecture — Meesho E-Commerce Platform

> This document describes the **verified** system architecture of the Meesho hackathon platform as it exists in the repository. Claims are derived from source code inspection, not assumptions.

---

## 1. High-Level Architecture

```mermaid
flowchart TD
    Browser["Browser (Client)"]
    SC["Server Components\n(Next.js SSR)"]
    CC["Client Components\n('use client')"]
    ZS["Zustand Stores\n(localStorage)"]
    Cookie["httpOnly Cookie\n(meesho_token)"]
    API["Next.js API Routes\n(/api/*)"]
    Auth["auth.ts\ngetAuthUser()"]
    Prisma["Prisma ORM"]
    DB[(SQLite dev.db)]
    CSV["meesho_generated.csv\n(organizer dataset)"]
    Seed["prisma/seed.js"]

    Browser --> SC
    Browser --> CC
    CC --> ZS
    Browser --> Cookie
    SC --> API
    CC --> API
    API --> Auth
    Auth --> Cookie
    Auth --> Prisma
    API --> Prisma
    Prisma --> DB
    Seed --> CSV
    Seed --> Prisma
```

### Execution contexts

| Where | What runs there |
|---|---|
| **Browser only** | `useCartStore`, `useAuthStore`, `useThemeStore`, `useNetworkStore` (Zustand). Event handlers, timer effects, form submissions. |
| **Server only** | All `src/app/api/*` route handlers. `getAuthUser()`. Prisma queries. `prisma/seed.js`. |
| **Both (hydrated)** | Server Components (`page.tsx`, `layout.tsx`) render on server first, then hydrate on client. |

---

## 2. Request-Flow Diagrams

### A. Loading the product catalogue

```mermaid
sequenceDiagram
    participant B as Browser
    participant SC as Server Component (page.tsx)
    participant API as GET /api/products
    participant P as Prisma
    participant DB as SQLite

    B->>SC: GET /
    SC->>API: fetch('/api/products?page=1&limit=20')
    API->>P: product.findMany + product.count
    P->>DB: SELECT ... FROM Product WHERE ...
    DB-->>P: rows
    P-->>API: {products[], pagination}
    API-->>SC: JSON response
    SC-->>B: Rendered HTML with product grid
```

### B. Searching and filtering

```mermaid
sequenceDiagram
    participant U as User types in SearchFilters
    participant R as useRouter().push()
    participant SC as Server Component (page.tsx)
    participant API as GET /api/products

    U->>R: URL changes (?search=saree&sort=price_asc)
    R->>SC: Page re-renders with new searchParams
    SC->>API: fetch with updated query params
    API-->>SC: Filtered, sorted, paginated products
    SC-->>U: Updated product grid
```

### C. Login and session

```mermaid
sequenceDiagram
    participant U as User
    participant Form as LoginPage (client)
    participant API as POST /api/auth/login
    participant P as Prisma
    participant Z as authStore (Zustand)

    U->>Form: Submit email + password
    Form->>API: POST {email, password}
    API->>P: user.findUnique({email})
    P-->>API: user row (with hashed password)
    API->>API: bcrypt.compare(password, hash)
    API->>API: SignJWT({sub: user.id, email, role}) expires 7d
    API-->>Form: 200 {success, user} + Set-Cookie: meesho_token
    Form->>Z: setUser(user)
    Form->>Form: router.push('/')
```

### D. Adding to cart

```mermaid
sequenceDiagram
    participant U as User
    participant ATB as AddToCartButton (client)
    participant Z as useCartStore (Zustand)
    participant LS as localStorage

    U->>ATB: Click "Add to Cart"
    ATB->>Z: addItem({productId, title, price, imageUrl, quantity})
    Z->>LS: persist to 'meesho-cart'
    ATB->>ATB: Show "Added ✓" for 2s
    Note over Z: Price stored is display-only.<br/>Server recalculates at checkout.
```

### E. Flash checkout reservation

```mermaid
sequenceDiagram
    participant U as User
    participant Cart as CartPage (client)
    participant API as POST /api/cart/checkout
    participant TX as Prisma Transaction (Serializable)
    participant DB as SQLite

    U->>Cart: Click "Secure Checkout"
    Cart->>API: POST {items: [{productId, quantity}]}
    API->>API: getAuthUser() — verify JWT
    API->>TX: BEGIN TRANSACTION SERIALIZABLE
    TX->>DB: SELECT Product WHERE id=? (lock row)
    DB-->>TX: product (stockCount, availability, price)
    TX->>TX: Check availability != 'Out of Stock'
    TX->>TX: Check stockCount >= quantity
    TX->>DB: UPDATE Product SET stockCount -= quantity
    TX->>DB: INSERT Order (status=PENDING)
    TX->>DB: INSERT OrderItem[] (price snapshot)
    TX->>DB: INSERT FlashCheckoutLock (expiresAt = now+180s)
    TX->>DB: COMMIT
    API-->>Cart: {success, orderId, reservationExpiresAt, total}
    Cart->>Cart: Start 180s countdown timer
    Cart->>Cart: clearCart()
```

### F. Confirming or expiring the reservation

```mermaid
sequenceDiagram
    participant Cart as CartPage (timer)
    participant API_Confirm as POST /api/cart/confirm
    participant API_Cron as GET /api/cron/cleanup-locks
    participant DB as SQLite

    alt User confirms in time
        Cart->>API_Confirm: POST {orderId}
        API_Confirm->>DB: findMany FlashCheckoutLock WHERE userId=?
        Note over API_Confirm: Checks locks still exist (not expired)
        API_Confirm->>DB: DELETE FlashCheckoutLock WHERE userId=?
        API_Confirm->>DB: UPDATE Order SET status=COMPLETED
        API_Confirm-->>Cart: {success}
    else Reservation expires (external cron call)
        API_Cron->>DB: findMany FlashCheckoutLock WHERE expiresAt<=now
        loop each expired lock
            API_Cron->>DB: DELETE FlashCheckoutLock WHERE id=? (atomic)
            API_Cron->>DB: UPDATE Product SET stockCount += quantity
        end
        API_Cron->>DB: UPDATE Order SET status=CANCELLED (if no remaining locks)
        API_Cron-->>Caller: {cleaned: N}
    end
```

### G. Viewing an order

```mermaid
sequenceDiagram
    participant B as Browser
    participant SC as orders/[id]/page.tsx
    participant API as GET /api/orders/[id]
    participant P as Prisma

    B->>SC: GET /orders/abc123
    SC->>API: fetch('/api/orders/abc123')
    API->>API: getAuthUser()
    API->>P: order.findUnique({id, include: items+product})
    P-->>API: order with items
    API->>API: if order.userId !== user.id → 403
    API-->>SC: order JSON
    SC-->>B: Order detail page
```

---

## 3. Component & File Reference

### Pages

| File | Runs on | Responsibility | Calls |
|---|---|---|---|
| `src/app/layout.tsx` | Server + Client | Root HTML shell, Navbar, theme init script | `Navbar` |
| `src/app/page.tsx` | Server | Homepage — fetches products, renders grid | `/api/products`, `SearchFilters`, `ProductCard` |
| `src/app/product/[id]/page.tsx` | Server | Product detail — two-column layout | `/api/products/[id]`, `AddToCartButton`, `PriceHistoryChart` |
| `src/app/cart/page.tsx` | Client | Cart display, checkout trigger, countdown timer | `/api/cart/checkout`, `useCartStore` |
| `src/app/orders/page.tsx` | Server | Order history list | `/api/orders` |
| `src/app/orders/[id]/page.tsx` | Server | Order detail | `/api/orders/[id]` |
| `src/app/auth/login/page.tsx` | Client | Login form | `/api/auth/login`, `useAuthStore` |
| `src/app/auth/register/page.tsx` | Client | Registration form | `/api/auth/register` |

### Shared Components

| File | Responsibility | Owner |
|---|---|---|
| `Navbar.tsx` | Navigation, theme toggle, search, auth state display/logout | Member 1 (Integration Lead) |
| `SearchFilters.tsx` | Search input, category/sort/price filters, URL-param updates | Member 2 (Product Discovery) |
| `ProductCard.tsx` | Product tile — image, price, Add to Cart hover action | Member 2 |
| `ProductSkeleton.tsx` | Dark skeleton loaders for loading states | Member 5 (QA) |
| `AddToCartButton.tsx` | Add-to-Cart with visual feedback; disabled for Out of Stock | Member 3 (Shopping Journey) |
| `PriceHistoryChart.tsx` | Recharts line chart for price history | Member 3 |

### API Routes

| File | HTTP | Purpose | Auth |
|---|---|---|---|
| `api/auth/register/route.ts` | POST | Hash password, create user | No |
| `api/auth/login/route.ts` | POST | Verify password, issue JWT cookie | No |
| `api/auth/logout/route.ts` | POST | Clear JWT cookie | No |
| `api/auth/me/route.ts` | GET | Return current user from token | Cookie |
| `api/products/route.ts` | GET | Paginated, filtered, sorted product list | No |
| `api/products/[id]/route.ts` | GET | Single product with price history | No |
| `api/cart/checkout/route.ts` | POST | Serializable transaction: reserve stock, create order | Cookie |
| `api/cart/confirm/route.ts` | POST | Complete order, delete locks | Cookie |
| `api/cron/cleanup-locks/route.ts` | GET | Restore expired inventory, cancel orders | Bearer |
| `api/orders/route.ts` | GET | User's order history | Cookie |
| `api/orders/[id]/route.ts` | GET | Single order (ownership enforced) | Cookie |

### Libraries

| File | Responsibility |
|---|---|
| `src/lib/auth.ts` | `getAuthUser()` — reads cookie, verifies JWT, fetches user from DB |
| `src/lib/prisma.ts` | Singleton Prisma client (prevents connection exhaustion in dev) |
| `src/lib/utils.ts` | `cn()` — Tailwind class merger |

### Stores (Zustand)

| File | Persisted key | Data |
|---|---|---|
| `store/store.ts` → `useCartStore` | `meesho-cart` | Cart items array |
| `store/store.ts` → `useNetworkStore` | `meesho-network` | `liteMode` boolean |
| `store/authStore.ts` → `useAuthStore` | `meesho-auth` | `{id, name, email, role}` or null |
| `store/themeStore.ts` → `useThemeStore` | `theme` | `'light'` or `'dark'` |

---

## 4. Database Schema

```
User
  id        UUID PK
  name      String
  email     String UNIQUE
  password  String (bcrypt hash)
  role      String ('user' | 'admin')
  createdAt DateTime
  updatedAt DateTime
  └── orders Order[]

Product
  id                 UUID PK
  productId          String UNIQUE  ← CSV product_id (e.g. MEESHO_1000000)
  title, category, subcategory, brand
  originalPrice, discountedPrice, discountPercentage
  rating, reviewCount
  availability       String ('In Stock' | 'Out of Stock' | 'Limited Stock')
  stockCount         Int  ← SYNTHETIC (5-50, never in CSV, never overwritten on re-import)
  sellerName, imageUrl, productUrl, description
  colorsAvailable, sizesAvailable, material
  codAvailable       Boolean
  returnPolicy, deliveryTime
  @@index([category, availability, discountedPrice, rating, title])
  └── orderItems  OrderItem[]
  └── flashLocks  FlashCheckoutLock[]
  └── priceHistory PriceHistory[]

Order
  id            UUID PK
  userId        FK → User
  total         Float  ← server-calculated at checkout time
  status        String ('PENDING' | 'COMPLETED' | 'CANCELLED')
  reservationId String?  ← set to order.id for idempotency
  createdAt     DateTime
  └── items OrderItem[]

OrderItem
  id        UUID PK
  orderId   FK → Order
  productId FK → Product
  quantity  Int
  price     Float  ← snapshot of discountedPrice at checkout (immutable)

FlashCheckoutLock
  id        UUID PK
  productId FK → Product
  userId    String  ← user.id (not a FK — allows orphan cleanup)
  quantity  Int
  lockedAt  DateTime
  expiresAt DateTime  ← now + 180 seconds

PriceHistory
  id         UUID PK
  productId  FK → Product
  price      Float
  recordedAt DateTime
```

### Key relationships

- One `User` has many `Orders`.
- One `Order` has many `OrderItems`. Each `OrderItem` stores a price **snapshot** at the time of checkout. This snapshot is immutable — changing the product price later does not affect existing orders.
- One `Product` has many `FlashCheckoutLocks`. A lock represents reserved units that have not yet been confirmed or expired.
- `stockCount` is **remaining available stock** (i.e., physical stock minus already-decremented reservations). It is decremented at checkout and restored by the cron job on expiry.

---

## 5. Inventory & Concurrency Model

### stockCount semantics

`stockCount` represents the **remaining available units** after accounting for all decrements made during checkout. It does **not** include a separate "reserved" layer — decrement happens immediately inside the Serializable transaction.

### Concurrency safety

The checkout route uses a **Serializable isolation level** Prisma transaction:

```typescript
await prisma.$transaction(async (tx) => { ... }, {
  isolationLevel: 'Serializable',
  maxWait: 5000,
  timeout: 10000
})
```

Within the transaction, each `product.update` with `{ decrement: quantity }` is atomic. Concurrent requests will serialize, so the last unit is not double-sold.

### Expiry and restoration

The cleanup route deletes each lock **before** restoring stock:

```typescript
await prisma.flashCheckoutLock.delete({ where: { id: lock.id } })  // throws P2025 if already deleted
await prisma.product.update({ data: { stockCount: { increment: lock.quantity } } })
```

If two concurrent cleanup calls process the same lock, only the first succeeds at deletion. The second gets `P2025` and skips the stock increment — preventing double-restoration.

### Known limitation: cleanup is not scheduled

The cron endpoint must be called externally (e.g., via a Windows Task Scheduler, a Vercel cron, or a simple timer). There is no built-in scheduler. During the hackathon demo, trigger it manually:

```powershell
Invoke-RestMethod 'http://localhost:3000/api/cron/cleanup-locks' `
  -Headers @{ Authorization = 'Bearer YOUR_CRON_SECRET' }
```

---

## 6. Bharat Lite Mode

When `liteMode` is `true` in `useNetworkStore`:
- `ProductCard` replaces every `<img>` with a dark placeholder showing a shield icon and "Lite Mode" label.
- `CartPage` skips rendering cart item images.
- Network requests for images are not made (the `<img>` element is never rendered).

The mode persists across page refreshes via Zustand's `persist` middleware (`localStorage` key: `meesho-network`).

---

## 7. Theme System

The theme is controlled by adding or removing the `dark` class on `<html>`.

- `globals.css` defines two sets of CSS variables: `:root` (light) and `.dark` (dark).
- `themeStore.ts` (`useThemeStore`) stores the chosen theme in `localStorage` (key: `theme`).
- `layout.tsx` includes an inline `<script>` that reads `localStorage.theme` and applies the class before the page renders — preventing flash of wrong theme.
- All components use Tailwind semantic classes (`bg-background`, `text-foreground`, `bg-card`, etc.) that automatically resolve to the correct CSS variable.

---

## 8. Authentication Flow

1. User submits email + password to `POST /api/auth/login`.
2. Server fetches user by email, runs `bcrypt.compare`.
3. On success, signs a JWT (`jose` `SignJWT`) with `{sub: user.id, email, role}` expiring in 7 days.
4. JWT is set as an `httpOnly`, `SameSite=Lax`, `path=/` cookie named `meesho_token`.
5. Subsequent requests to protected endpoints call `getAuthUser()` which:
   - Reads the cookie server-side (Next.js `cookies()` API).
   - Verifies the JWT signature using `NEXTAUTH_SECRET`.
   - Fetches the user row from DB to confirm the user still exists.
6. On logout, the cookie is cleared server-side.

Passwords are never returned in API responses. JWTs are never stored in `localStorage`.

---

## 9. Security Notes

| Area | Status |
|---|---|
| Password hashing | bcrypt with cost factor 12 |
| JWT in httpOnly cookie | ✅ — not accessible to JavaScript |
| Server-side price calculation | ✅ — client price is display-only |
| Order ownership enforcement | ✅ — 403 if `order.userId !== user.id` |
| Sort field allowlist | ✅ — unsupported sort defaults to `rating_desc` |
| CRON_SECRET required | ✅ — 401 if missing or wrong |
| Input validation | ✅ — quantity, productId, items[] length |
| Stack traces in API responses | ✅ None exposed — generic error messages only |
| NEXTAUTH_SECRET validation | Startup will fail if secret is empty at JWT verification time |
| `mode: 'insensitive'` in SQLite | ⚠ SQLite does not support `mode: 'insensitive'` — Prisma silently ignores it. Case-sensitive search is the actual behavior. |
