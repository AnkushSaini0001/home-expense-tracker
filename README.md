# 🏡 HomeLedger - Household Billing & Advance Tracker

A specialized, full-stack domestic billing management application built with **React + Vite** (Frontend) and **Node.js + Express + Mongoose** (Backend).

Designed specifically for tracking household service providers like your **Milkman**, **Cook**, **Maid**, or **Driver** — logging daily consumption/attendance, tracking mid-month advance payments, and calculating the exact pending balance.

---

## ✨ Key Features

1. **Dual Billing Modes**:
   - **Daily / Per-Unit Rate** (e.g. Milkman at ₹66/Liter): Tracks daily deliveries, extra quantity, and skipped/absent days with automatic monthly totals.
   - **Fixed Monthly Wage** (e.g. Cook / Maid at ₹3,500/Month): Tracks fixed salary with attendance/leave tracking.
2. **Advance & Mid-Month Payment Tracker**:
   - Record when staff take advances during the month (`Cash`, `UPI/GPay`, `Bank Transfer`).
   - Keeps an unalterable, transparent ledger of dates, amounts, and reasons.
3. **Pending Balance Engine**:
   - Automatically computes: `Net Pending = Total Earned / Billed - Total Advances Given`.
   - Clear visual breakdown so you always know what has been given and what is pending.
4. **1-Click WhatsApp & Print Bill**:
   - Formats a professional, itemized billing summary ready to send to your worker via WhatsApp or print for household records.
5. **Multi-Month Navigation**:
   - Easily flip through past, current, and future months.

---

## 🏗️ Architecture

### Backend (`/server`)
- **`models/`**:
  - `Provider.js`: Service provider metadata (name, category, billingType, rate, unit, phone).
  - `DailyLog.js`: Daily delivery / attendance logs with compound unique index on `(provider, date)`.
  - `Payment.js`: Advance payments, mid-month withdrawals, and settlement transactions.
- **`controllers/`**:
  - `providerController.js`: Provider CRUD operations.
  - `dailyLogController.js`: Single & bulk daily log operations with automatic price calculation.
  - `paymentController.js`: Advance payment records management.
  - `billingController.js`: Monthly ledger calculations, summaries, and WhatsApp receipt generator.
- **`routes/`**:
  - `/api/providers`: Endpoints for managing staff/providers.
  - `/api/daily-logs`: Endpoints for daily records.
  - `/api/payments`: Endpoints for advances and payments.
  - `/api/billing`: Endpoints for monthly summaries and overview metrics.

### Frontend (`/client`)
- **React + Vite** with pure **Vanilla CSS** design system.
- Modern dark-mode interface with glassmorphism, responsive grid, dynamic badges, and interactive modals.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://localhost:27017` (or configured via `.env`)

### 1. Run the Backend Server
```bash
cd server
npm install
npm start
```
The server will start on `http://localhost:5000` and automatically seed initial sample data (Milkman & Cook) if the database is empty.

### 2. Run the Frontend Client
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
