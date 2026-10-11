# SLOTORA — Smart Appointment Experience

> A production-grade, full-stack appointment scheduling platform featuring real-time slot availability, interval overlap collision detection, ACID transaction concurrency protection, and a sleek SaaS interface.

---

## 🌟 Key Features

- **Futuristic & Elegant SaaS UI**: Designed with a sophisticated dark navy (`#060913`, `#0B0F19`), soft lavender, and electric violet color palette, frosted glass surfaces, and responsive mobile layouts.
- **Interactive Quick Booking Widget**: Real-time service, provider, and slot selector embedded right on the landing page with live database state.
- **Multi-Step Booking Wizard**:
  - **Step 1**: Choose service & specialist with bios and ratings
  - **Step 2**: Interactive date picker with disabled past dates and month navigation
  - **Step 3**: Live available time slots with smart availability labels (*Available*, *Few Slots Left*, *Fully Booked*)
  - **Step 4**: Customer contact form with Zod validation and inline error states
  - **Step 5**: Instant celebration confirmation with unique booking reference (e.g., `SLT-89214`)
- **Bulletproof Duplicate & Overlap Prevention**:
  - Enforced via atomic Prisma database transactions.
  - Interval-level intersection algorithm: rejects appointments where `max(startA, startB) < min(endA, endB)`.
  - Non-destructive cancellation immediately releases the slot for other clients.
- **My Appointments Dashboard**:
  - KPI overview metrics (Total, Upcoming, Completed, Cancelled).
  - List / Cards view and Chronological Timeline view.
  - Live countdown timers (*"Starts in 2 days"*, *"Starts in 3 hours"*).
  - Quick Reschedule modal with live slot selection.
  - Cancel confirmation modal with instant slot release.
  - Guest booking lookup by reference token or email.
- **Admin Control Suite**:
  - Role-protected administrative dashboard with stats & revenue tracking.
  - Full appointment management and status toggling (*Confirmed*, *Completed*, *Cancelled*).
  - Service CRUD (create, edit pricing & duration, activate/deactivate).

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express, TypeScript (`tsx`), Prisma ORM, JWT, Bcrypt, Zod.
- **Database**: SQLite (out-of-the-box zero setup) / PostgreSQL support via Prisma.
- **Deployment**: Configured for Vercel with automatic SPA routing and monorepo build script.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### 2. Installation
Install all dependencies across both client and server:
```bash
npm run install:all
```

### 3. Database Setup & Seeding
In the `server` directory:
```bash
cd server
npx prisma db push
npm run seed
cd ..
```
*This synchronizes the SQLite schema in `server/prisma/dev.db` and seeds 6 realistic services, 4 specialist providers with weekly availability schedules, and sample appointments.*

### 4. Running the Application Locally
In two separate terminals:

**Terminal 1 (Backend API on http://localhost:5001):**
```bash
npm run server
```

**Terminal 2 (Frontend Client on http://localhost:5173):**
```bash
npm run client
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Automated Verification Tests
SLOTORA includes an automated test suite verifying booking interval overlap collision detection, past slot rejection, and cancellation slot release:
```bash
cd server
npm test
```
**Results:** `14 passed, 0 failed`.

---

## 🔑 Default Credentials

| Role | Name | Email | Password |
|---|---|---|---|
| **Administrator** | Elena Rostova | `admin@slotora.com` | `admin123` |
| **Demo Client** | Alex Rivera | `alex@example.com` | `user123` |

*(You can also use the 1-click demo switcher in the navigation bar dropdown)*

---

## 🌐 Deploying to Vercel

The repository is configured for one-click Vercel deployment:
- **Build Command**: `npm run build`
- **Output Directory**: `client/dist`
- Configured with `vercel.json` for single-page app client routing.
