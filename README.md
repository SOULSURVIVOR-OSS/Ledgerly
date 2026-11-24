# Ledgerly — Minimalist Personal Finance & Budget Management

A modern, minimalist personal finance and budget management SaaS web application built with **React**, **TypeScript**, **Tailwind CSS v4**, **Recharts**, and **Firebase** (Authentication & Cloud Firestore).

---

## 🌟 Key Features

- **Checkbox-Driven Financial Tracking**:
  - Dynamically check/uncheck individual clients or expenses to simulate real-time cash flow and forecast scenarios.
  - Independent counters for Income and Expenses.
  - Instant recalculation of Stream Totals, Category Totals, Net Balance, and Profit Margin.
- **Customizable Income Streams & Clients**:
  - Organize revenue into custom streams (Freelancing, Consulting, SaaS, Sponsorships, etc.).
  - Add client invoices with dates, payment amounts, and notes.
  - "Select All" / "Deselect All" bulk toggles per stream.
- **Customizable Expense Categories & Items**:
  - Organize spending into categories (Software, Workspace, Marketing, Travel, etc.).
  - Add individual expenses with dates and amounts.
- **Financial Analytics & Charts (Recharts)**:
  - **Income Distribution**: Interactive donut pie chart by active streams.
  - **Expense Distribution**: Interactive donut pie chart by active categories.
  - **Income vs. Expenses**: Comparative bar chart of active cash flows.
  - **Monthly Trend**: Multi-month timeline tracking income, expenses, and net profit.
- **Google Authentication & Cloud Database Sync**:
  - Sign in with Google to persistently store your financial data in **Google Cloud Firestore**.
  - Real-time synchronization across devices and tabs.
  - Offline-ready with local storage caching for guest users.
  - Automatic migration from local storage to cloud on first login.
- **Multi-Currency & Regional Formatting**:
  - Supports **INR (₹)** (default), **USD ($)**, **EUR (€)**, **GBP (£)**, **JPY (¥)**, **CAD (CA$)**, and **AUD (A$)**.
- **Dark & Light Mode**:
  - Premium high-contrast light mode and refined dark mode.
- **CSV Data Export**:
  - Export complete ledger history with status, dates, and amounts in a single click.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Cloud & Auth**: [Firebase v11](https://firebase.google.com/) (Google Authentication & Firestore)
- **Testing**: Built-in `node:test` test suite

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed on your system.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/SOULSURVIVOR-OSS/Ledgerly.git
   cd Ledgerly
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. Run unit tests:
   ```bash
   npm run test # or: npx tsx --test src/utils/finance.test.ts
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## ☁️ Deploying to Vercel

Ledgerly is built as a standard Vite single-page application and is ready for deployment on [Vercel](https://vercel.com):

1. Push your code to your GitHub repository.
2. In the [Vercel Dashboard](https://vercel.com/new), import the `Ledgerly` repository.
3. Vercel will automatically detect the **Vite** framework preset:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Firebase Auth & Cloud Sync**:
   - Ledgerly is pre-configured with Firebase project `budgetnow-d91cd` via `firebase-applet-config.json` and `firestore.rules`.
   - Ensure your Vercel deployment domain (e.g. `budgetnow.vercel.app`) is listed in **Firebase Console → Authentication → Settings → Authorized domains**.
   - *(Optional)* Set `VITE_FIREBASE_*` variables in **Vercel → Project Settings → Environment Variables** only if you want to override `firebase-applet-config.json` with a different Firebase project.
5. Click **Deploy**!

---

## 🔒 Security

All Firestore operations are governed by zero-trust security rules located in [`firestore.rules`](./firestore.rules). Each user has exclusive access to their own subcollections under `/users/{userId}/*` enforced at the database level.

---

## 📄 License

Apache-2.0
