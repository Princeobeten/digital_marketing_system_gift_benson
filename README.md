# Gift Gadget — Digital Marketing System for Gadget Retail Business

A working prototype of the **Digital Marketing System for Gift Gadget Retail
Business** (final-year project). It centralises fragmented marketing activities —
customer data, segmentation, campaigns and analytics — into one platform, with an
AI assistant for generating campaign copy.

Built with **Next.js (App Router) + MongoDB**.

---

## Mapping to the project design

The system implements the five core modules from the project document, plus the
"emerging technology" (AI) component:

| Document module | Where it lives in the app |
|---|---|
| **Authentication module** | JWT login/register, route protection ([src/lib/auth.ts](src/lib/auth.ts), [src/middleware.ts](src/middleware.ts)) |
| **User & customer data management** | Customer CRM + Product catalog (`/customers`, `/products`) |
| **Campaign management module** | Create, target & "send" campaigns (`/campaigns`) |
| **Customer analytics & segmentation** | Rule-based segments + analytics dashboard (`/segments`, `/dashboard`) |
| **Engagement & communication module** | Simulated delivery log + per-campaign metrics |
| **Reporting module** | KPI dashboard with charts (`/dashboard`) |
| **Emerging technology (AI)** | AI Campaign Assistant powered by Groq |
| **Data security** | bcrypt password hashing, JWT httpOnly cookies, zod validation |

---

## Features

- **Authentication** — register/login, the first account becomes the admin.
  Sessions are signed JWTs in httpOnly cookies; middleware guards every page.
- **Customers (CRM)** — full CRUD with interests, location, spend, tags and source.
- **Products** — gadget catalog (smartphones, laptops, audio, gaming, etc.).
- **Segments** — build targeting rules (e.g. *interest = Smartphones AND spend ≥ ₦200k*)
  with a **live match preview** as you edit.
- **Campaigns** — choose a channel (email/SMS/social), target a segment, attach
  products, then **send** (simulated). Each recipient gets a delivery record with a
  realistic opened/clicked status, rolled up into open/click-rate metrics.
- **AI Campaign Assistant** — describe an offer and tone; Groq drafts the subject
  line and body and suggests a target audience.
- **Analytics dashboard** — KPIs plus charts: customers by category, acquisition
  source, and campaign performance by channel.

---

## Tech stack

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS**
- **MongoDB** via **Mongoose**
- **jose** (JWT) + **bcryptjs** (password hashing)
- **zod** (validation), **Recharts** (charts)
- **Groq** via the OpenAI-compatible SDK (`llama-3.3-70b-versatile`)

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

A `.env.local` is already provided. It contains:

```env
MONGODB_URI=mongodb+srv://.../digital_marketing_system?...
JWT_SECRET=...
GROQ_API_KEY=...           # from https://console.groq.com
GROQ_MODEL=llama-3.3-70b-versatile
```

> The AI assistant needs `GROQ_API_KEY`. Every other feature works without it.

### 3. Seed demo data (recommended)

```bash
npm run seed
```

This creates an admin user, 12 products, 24 customers, 4 segments and 5
campaigns (3 already sent with delivery logs). Login credentials:

```
Email:    gift@giftgadget.com
Password: password123
```

### 4. Run the app

```bash
npm run dev      # development
# or
npm run build && npm run start   # production
```

Open <http://localhost:3000>.

---

## Project structure

```
src/
  app/
    (auth)/            login & register pages
    (dashboard)/       dashboard, campaigns, customers, segments, products
    api/               auth, customers, products, segments, campaigns, ai, analytics
  components/          UI primitives, Sidebar, Modal, PageHeader
  lib/                 db, auth, api guards, validation, segments, simulate, groq
  models/              Mongoose schemas (User, Customer, Product, Segment, Campaign, Message)
  middleware.ts        route protection
scripts/seed.ts        demo data seeder
```

---

## How the campaign "send" works (simulation)

Sending is simulated so the prototype is fully self-contained (no external email
provider). On send, the system:

1. Resolves the campaign's segment to a live list of matching customers
   ([src/lib/segments.ts](src/lib/segments.ts)).
2. Creates one `Message` per recipient with a simulated status (delivered /
   opened / clicked), using deterministic per-recipient rates per channel
   ([src/lib/simulate.ts](src/lib/simulate.ts)).
3. Rolls the results into the campaign's open/click-rate metrics.

---

## Security notes

Passwords are hashed with bcrypt and sessions use signed, httpOnly JWT cookies.
For a real deployment, the MongoDB credentials and `JWT_SECRET` should come from
a secret manager (never committed) and the database user should be scoped to the
application database only — matching the project's data-security objective.
