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
4. **Enable Google Sign-In & Cloud Sync on your Vercel domain**:
   - The default AI Studio Starter Firebase project (`company-terra-7vr20`) only authorizes AI Studio preview URLs, so external Vercel domains (`*.vercel.app`) require your own free Firebase project:
   - Create a project in [Firebase Console](https://console.firebase.google.com) → enable **Authentication → Sign-in method → Google**.
   - Under **Authentication → Settings → Authorized domains**, click **Add domain** and add your Vercel hostname (e.g. `your-app.vercel.app`).
   - Create a **Firestore Database**, then paste and publish the rules from [`firestore.rules`](./firestore.rules) under **Firestore Database → Rules**.
   - Register a **Web App (`</>`)** in **Project Settings**, then add its `firebaseConfig` values as `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` in **Vercel → Project Settings → Environment Variables**.
5. Click **Deploy** (or **Redeploy** after adding Environment Variables).

---

## 🔒 Security

All Firestore operations are governed by zero-trust security rules located in [`firestore.rules`](./firestore.rules). Each user has exclusive access to their own subcollections under `/users/{userId}/*` enforced at the database level.

---

## 📄 License

Apache-2.0
