# 💸 FinFlow — Personal Finance Tracker

> **A full-stack personal finance management platform with AI-powered bank statement parsing, spending analytics, budget tracking, and a conversational financial advisor.**

---

## 🏗️ Project Architecture

```
FinFlow/
├── package.json             ← Root scripts (runs both apps simultaneously)
├── .gitignore
│
├── backend/                 ← Node.js + Express API Server
│   ├── config/
│   │   └── db.js            ← MongoDB connection
│   ├── middleware/
│   │   └── auth.js          ← JWT authentication guard + error handler
│   ├── models/              ← Mongoose database schemas
│   │   ├── User.js
│   │   ├── Transaction.js
│   │   ├── Category.js
│   │   ├── Budget.js
│   │   ├── SavingsGoal.js
│   │   └── Statement.js
│   ├── routes/              ← API Endpoints + Business Logic
│   │   ├── auth.routes.js   ← Register, Login
│   │   ├── transaction.routes.js ← CRUD, Filters, Budgets, Analytics
│   │   ├── statement.routes.js   ← PDF Upload & Parsing
│   │   ├── goal.routes.js        ← Savings Goals
│   │   └── ai.routes.js          ← Gemini AI Insights & Chat
│   ├── services/
│   │   ├── ai.service.js    ← Gemini 2.5 Flash integration + fallback parser
│   │   └── encryption.js    ← AES-256 field-level encryption
│   ├── scripts/
│   │   └── seed.js          ← Default categories seeder
│   ├── .env.example         ← Copy to .env and fill in secrets
│   ├── package.json
│   └── server.js            ← Express app entry point
│
├── frontend/                ← React + Vite Client
│   ├── public/
│   ├── src/
│   │   ├── components/      ← Reusable UI blocks
│   │   │   ├── AIInsights.tsx
│   │   │   ├── AddTransactionModal.tsx
│   │   │   ├── Auth.tsx
│   │   │   ├── DashboardCharts.tsx
│   │   │   ├── SavingsGoals.tsx
│   │   │   ├── TransactionTable.tsx
│   │   │   ├── UploadModal.tsx
│   │   │   └── layout/
│   │   │       ├── Navbar.tsx
│   │   │       └── Sidebar.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx  ← JWT token state management
│   │   ├── pages/           ← Full views mapped to sidebar tabs
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TransactionsPage.tsx
│   │   │   ├── BudgetsPage.tsx
│   │   │   ├── SubscriptionsPage.tsx
│   │   │   └── StatementsPage.tsx
│   │   ├── services/
│   │   │   └── api.ts       ← Axios client (all API calls in one place)
│   │   ├── App.tsx          ← Root layout, routing & state management
│   │   ├── main.tsx         ← React entry point
│   │   └── index.css        ← Dark-mode glassmorphic design system
│   ├── package.json
│   └── vite.config.ts       ← Dev server proxy → backend:3000
│
└── uploads/                 ← PDF uploads temporary storage
    └── .gitkeep
```

---

## ⚡ Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/your-username/finflow.git
cd finflow
npm run install:all
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
# Then fill in backend/.env with your MongoDB URI, JWT secrets, and Gemini API key
```

### 3. Run Both Apps Together

```bash
npm run dev
```

This starts:
- 🔵 **Backend** → `http://localhost:3000`
- 🟣 **Frontend** → `http://localhost:5173`

---

## 🔑 Environment Variables (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | MongoDB connection string (Atlas or local) |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (1h expiry) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (7d expiry) |
| `GEMINI_API_KEY` | Google Gemini API key for AI features |
| `ENCRYPTION_SECRET` | 32-char key for AES-256 field encryption |
| `PORT` | Backend port (default: 3000) |
| `FRONTEND_URL` | Frontend URL for CORS (default: http://localhost:5173) |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create a new user account |
| POST | `/api/v1/auth/login` | Login and get JWT tokens |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/transactions` | Get transactions (filter/sort/search) |
| POST | `/api/v1/transactions` | Create manual transaction |
| PATCH | `/api/v1/transactions/:id` | Update transaction category |
| GET | `/api/v1/categories` | Get all spending categories |
| GET | `/api/v1/analytics/summary` | Get spending totals, trends & health score |

### Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/budgets` | Get budgets with current spend |
| POST | `/api/v1/budgets` | Set / update a category budget |
| DELETE | `/api/v1/budgets/:id` | Delete a budget |

### Statements
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/statements/upload` | Upload PDF bank statement |
| GET | `/api/v1/statements` | List uploaded statements |
| DELETE | `/api/v1/statements/:id` | Delete statement + linked transactions |

### Savings Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/goals` | Create savings goal |
| GET | `/api/v1/goals` | List all savings goals |
| PATCH | `/api/v1/goals/:id` | Update goal progress (add/set) |
| DELETE | `/api/v1/goals/:id` | Delete a savings goal |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ai/insights` | AI-powered spending insights |
| POST | `/api/v1/ai/chat` | Chat with FinAI financial advisor |

---

## 🧠 How It Works (AI Pipeline)

```
User uploads PDF statement
        ↓
   pdf-parse extracts raw text
        ↓
  Gemini 2.5 Flash API is called with structured extraction prompt
        ↓
  If AI fails → Smart Regex Fallback (PhonePe/UPI/Bank pattern matching)
        ↓
  Transactions are categorized and AES-256 encrypted
        ↓
  Bulk-inserted to MongoDB
        ↓
  Frontend polls statement status → shows parsed transactions
```

---

## 🛡️ Security Features

- **Passwords** — Hashed with `bcryptjs` (cost factor 12)
- **Authentication** — Stateless JWT (access + refresh tokens)
- **Data Privacy** — Transaction descriptions & merchant names encrypted at rest with AES-256-GCM
- **CORS** — Restricted to configured frontend origin only

---

## 🏛️ Data Models

```
User        → email, passwordHash, firstName, lastName, baseCurrency
Transaction → userId, date, amount(paise), description(encrypted), type, categoryId
Category    → name, color, icon (10 system categories)
Budget      → userId, categoryId, amount(paise)
SavingsGoal → userId, name, targetAmount, currentAmount, deadline
Statement   → userId, fileName(encrypted), bankName, status (PENDING/PROCESSING/COMPLETED/FAILED)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Recharts, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| AI | Google Gemini 2.5 Flash |
| Auth | JSON Web Tokens (JWT) |
| Security | AES-256-GCM encryption, bcryptjs |
| Dev Tools | nodemon, concurrently |