# Team Workflow — Meesho E-Commerce Platform

> Five-member hackathon team workflow for the **Cliffesto Web Development Hackathon**.
>
> ⚠ **Maximum 3 commits to `main/master`.** Do not commit, push, force-push, squash or rewrite history automatically. Verify the organizer's rules before submission.

---

## Team Roles & File Ownership

### Member 1 — Integration Lead

**Responsibilities:** Application architecture, shared component interfaces, build integrity, final integration, and pre-submission verification.

**Files owned:**
- `src/app/layout.tsx`
- `src/components/Navbar.tsx`
- `next.config.ts`
- `tsconfig.json`
- `package.json`
- `.gitignore`
- `.env.example`
- `docs/ARCHITECTURE.md`
- `README.md`

**Before each integration:**
1. Run `npx tsc --noEmit` — confirm zero TypeScript errors.
2. Run `npm run build` — confirm the production build succeeds.
3. Test the full user journey: register → login → browse → add to cart → checkout → view order.

---

### Member 2 — Product Discovery

**Responsibilities:** Homepage, product listing, search, filters, sort, pagination and product cards.

**Files owned:**
- `src/app/page.tsx`
- `src/components/ProductCard.tsx`
- `src/components/ProductSkeleton.tsx`
- `src/components/SearchFilters.tsx`

**API contracts:**
- Reads `GET /api/products` — see [API Reference in README](../README.md#8-api-reference).
- Never modify API route files — coordinate changes with Member 4.

**Validation before handover:**
- Homepage loads 20 products by default.
- Search, category filter, sort and price range all update the URL and re-fetch correctly.
- Pagination Previous/Next buttons work.
- Empty search results show a clear message, not a blank page.
- Skeleton loaders appear while data is loading.
- Bharat Lite Mode replaces images with placeholders.
- No TypeScript errors: `npx tsc --noEmit`.

---

### Member 3 — Shopping Journey

**Responsibilities:** Product detail page, cart UI, checkout flow, order history and order detail pages.

**Files owned:**
- `src/app/product/[id]/page.tsx`
- `src/components/AddToCartButton.tsx`
- `src/components/PriceHistoryChart.tsx`
- `src/app/cart/page.tsx`
- `src/app/orders/page.tsx`
- `src/app/orders/[id]/page.tsx`

**API contracts:**
- `GET /api/products/[id]` — returns product + priceHistory[].
- `POST /api/cart/checkout` — body: `{items: [{productId, quantity}]}` — returns `{orderId, reservationExpiresAt, total}`.
- `POST /api/cart/confirm` — body: `{orderId}` — completes the order.
- `GET /api/orders` and `GET /api/orders/[id]`.

**Validation before handover:**
- Product detail shows image, title, price, discount, rating, delivery info, and attributes.
- Add to Cart button shows visual "Added ✓" feedback.
- Sticky bar does not overlap content on mobile.
- Cart page shows items, totals, and a working Secure Checkout button.
- Checkout countdown timer counts down from 180 seconds.
- Cart is cleared after successful checkout.
- Orders page lists orders with status badges.
- Order detail page shows all items with price snapshots.
- No TypeScript errors.

---

### Member 4 — Backend

**Responsibilities:** API routes, Prisma schema, database, authentication, authorization, business logic, and data ingestion.

**Files owned:**
- `src/app/api/**` (all route handlers)
- `src/lib/auth.ts`
- `src/lib/prisma.ts`
- `prisma/schema.prisma`
- `prisma/seed.js`

**Critical rules:**
- Never trust client-supplied prices or stock counts — always read from DB.
- All monetary operations use server-side DB values.
- Checkout must use a Serializable transaction.
- Order ownership must be enforced before returning order data.
- Never log or return password hashes or JWT secrets.
- Never run `prisma db push --force-reset` on a shared or production database.

**Validation before handover:**
- `POST /api/auth/register` returns 409 for duplicate emails.
- `POST /api/auth/login` returns 401 for wrong credentials.
- `GET /api/auth/me` returns 401 without a valid cookie.
- `POST /api/cart/checkout` returns 409 when stock is insufficient.
- `GET /api/orders/[id]` returns 403 if the order belongs to a different user.
- Concurrent checkout requests do not oversell stock (verified manually with two browser tabs).
- `node prisma/seed.js` runs twice without duplicating products or resetting `stockCount`.

---

### Member 5 — Reliability & QA

**Responsibilities:** Bharat Lite Mode, integration testing, bug documentation and reproduction steps, and pre-submission checklist.

**Files owned:**
- `tests/concurrency.test.ts`
- `src/store/store.ts` (liteMode section)
- All test scripts

**Validation checklist:**

#### Functionality
- [ ] Products load on the homepage.
- [ ] Search by product name returns relevant results.
- [ ] Filter by category narrows results correctly.
- [ ] Sort by price (low to high) orders products correctly.
- [ ] Product detail page loads without errors.
- [ ] Add to Cart increments the cart badge.
- [ ] Checkout creates a PENDING order and shows a countdown.
- [ ] Orders page shows the new order.
- [ ] Bharat Lite Mode replaces all images with shield placeholders.
- [ ] Theme toggle switches between light and dark correctly and persists after refresh.
- [ ] Login with `demo@meesho.com / demo123` succeeds.
- [ ] Invalid login returns an error message.
- [ ] Logged-out user cannot checkout (sees "Please login" message).

#### Responsive layout
- [ ] Homepage: 1 column (360px), 2 columns (640px), 5 columns (1280px).
- [ ] Product detail: single column (mobile), two-column (md+).
- [ ] Cart: readable and usable at 360px.
- [ ] Sticky Add to Cart bar does not overlap content on mobile.
- [ ] Navbar does not overlap content.

#### Build
- [ ] `npx tsc --noEmit` → zero errors.
- [ ] `npm run build` → succeeds with no errors.

**Bug report format:**
```
Title: <short description>
Page: <URL>
Steps to reproduce:
  1. ...
  2. ...
Expected: ...
Actual: ...
Browser console error (if any): ...
Server terminal error (if any): ...
```

---

## Shared File Rules

These files are shared across all members. **Coordinate before changing them to avoid merge conflicts:**

| File | Who changes it | How to coordinate |
|---|---|---|
| `src/app/globals.css` | Member 1 (Integration Lead) | Post in team chat before editing |
| `src/store/store.ts` | Member 3 (cart) + Member 5 (liteMode) | Separate functions — agree on section ownership |
| `prisma/schema.prisma` | Member 4 only | Must communicate any field changes to all members |
| `package.json` | Member 1 only | Do not add packages without team lead approval |

---

## How to Review Another Member's Changes Locally

1. Ask the member for their changed files (they should not push independently).
2. Copy the files into your local working copy.
3. Run `npx tsc --noEmit` and `npm run build`.
4. Test the affected user journey end to end.
5. Report issues using the Bug Report format above.

---

## How to Avoid Merge Conflicts

- Each member works only in their own files (see ownership above).
- Shared files (`globals.css`, `store.ts`, `schema.prisma`) are only edited by one person at a time.
- Communicate in the team chat before touching any shared file.
- Do not add duplicate state or components — check what already exists first.

---

## Backup Local Work

Since the hackathon limits commits to 3, work in progress is not committed frequently. Back up your files regularly:

```powershell
# Create a timestamped ZIP of changed files
Compress-Archive -Path src,prisma,docs,README.md `
  -DestinationPath "backup_$(Get-Date -Format 'yyyyMMdd_HHmm').zip"
```

Store the ZIP in a personal folder outside the repository.

---

## Git Rules (Hackathon-Specific)

> The Cliffesto hackathon allows a **maximum of 3 commits** to `main/master`.

- **Do not commit automatically.** The Integration Lead coordinates all commits.
- **Do not push from individual machines** without Integration Lead approval.
- **Do not create branches** as a way to hide additional commits — verify organizer rules first.
- **Do not rewrite history** (`--force`, `--amend`, `rebase`, `squash`).
- **Do not use CI/CD** that commits automatically.

Recommended commit strategy:
1. **Commit 1:** Working backend — APIs, auth, seed, schema.
2. **Commit 2:** Working frontend — all pages, components, theme.
3. **Commit 3:** Final polish — README, docs, bug fixes.

---

## Pre-Submission Checklist (Integration Lead)

- [ ] `npx tsc --noEmit` → zero errors.
- [ ] `npm run build` → zero errors.
- [ ] `node prisma/seed.js` on a fresh database → 2000 products imported.
- [ ] Full user journey verified: register → login → browse → cart → checkout → orders.
- [ ] `.env.local` is in `.gitignore` and not committed.
- [ ] `.env.example` is committed and accurate.
- [ ] `README.md` setup guide is accurate.
- [ ] No console errors in the browser during the demo flow.
- [ ] Bharat Lite Mode toggles correctly.
- [ ] Theme toggle persists after page refresh.
- [ ] Commit count on `main/master` is ≤ 3.
