# Mahadev Kirana Inventory Management

A full-stack inventory management system for a neighborhood grocery store in Jodhpur, India. Features a public customer-facing storefront and a complete admin panel for managing products, stock, orders, and customers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/inventory run dev` — run the frontend (port varies)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Default Credentials

- Admin: `admin` / `admin123`
- Staff: `staff` / `staff123`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Recharts, Framer Motion, React Hook Form
- API: Express 5 with cookie-based session auth
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/index.ts` — Database schema (users, categories, products, stock_movements, customers, orders, order_items)
- `artifacts/api-server/src/routes/` — Backend route handlers
- `artifacts/inventory/src/` — React frontend

## Architecture decisions

- Cookie-based auth (httpOnly cookies) — simpler than JWT for this use case, no token refresh needed
- Password hashing with SHA-256 + app-level salt (no bcrypt to avoid native dependencies in esbuild)
- Product status is computed at query time from quantity vs lowStockThreshold — not stored
- Stock movements update product quantity atomically at the route level
- Orval codegen used for all API types — never hand-write what codegen produces

## Product

- **Public storefront** (`/`): Hero, category grid, featured products, about, contact
- **Admin dashboard** (`/admin/dashboard`): KPI cards, charts (donut, bar, pie), recent alerts
- **Products** (`/admin/products`): Full CRUD, search/filter by category and status, pagination
- **Categories** (`/admin/categories`): Add/edit/delete product categories
- **Stock** (`/admin/stock`): Stock in/out forms, movements log
- **Orders** (`/admin/orders`): Order list with status management
- **Customers** (`/admin/customers`): Customer management
- **Alerts** (`/admin/alerts`): All low-stock and out-of-stock items
- **Reports** (`/admin/reports`): Analytics charts

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any schema change in `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push`
- After any OpenAPI spec change, re-run `pnpm --filter @workspace/api-spec run codegen`
- The cookie path is set to `/` so it's accessible to both the frontend and API under the same proxy domain

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
