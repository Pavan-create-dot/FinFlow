# 💸 FinFlow — Personal Finance Tracker

> **A full-stack, secure personal finance management platform featuring automated bank statement parsing, real-time spending analytics, budget tracking, savings goal management, and an interactive AI financial advisor.**

---

## 🌟 Key Working Implementations

### 1. 📊 Interactive Financial Dashboard & Analytics
- **Dynamic Metrics**: Instant tracking of Total Income, Total Expenses, Cash Flow, Savings Rate, and Top Spending Categories.
- **Financial Health Score Algorithm**: Dynamic 0–100 scoring model evaluating income-to-expense ratios, savings rates, and budget adherence with actionable health indicators.
- **Visual Analytics**: Interactive bar charts and category distribution visualizers built with Recharts.

### 2. 🤖 Gemini AI Financial Advisory (`FinAI`)
- **Data-Driven Insights**: Integrated Google Gemini 2.5 Flash API to analyze user transaction patterns and generate context-aware savings recommendations.
- **Spending Anomaly Alerts**: Automatic detection of unusual transaction spikes or budget overspends.
- **Conversational Assistant**: Interactive chat interface (`FinAI`) trained on user-specific transactional context to answer custom financial queries (*"Where did I overspend?"*, *"Can I afford a ₹50,000 laptop?"*).

### 3. 📄 Bank Statement Parsing Engine
- **PDF Statement Parsing**: Drag-and-drop PDF upload pipeline using `pdf-parse`.
- **Structured Extraction**: Gemini AI parses raw text into structured JSON transactions (date, amount, merchant, category).
- **Smart Fallback Parser**: Built-in regex fallback parser optimized for Indian banking & UPI patterns (PhonePe, Paytm, Google Pay, GPay) ensuring high parsing reliability even if AI rate limits occur.

### 4. 🔐 Security & Privacy Architecture
- **Stateless JWT Auth**: Dual-token strategy (access + refresh tokens) with secure middleware route protection.
- **Password Hashing**: Industry-standard `bcryptjs` hashing (cost factor 12).
- **AES-256-GCM Encryption**: Field-level encryption for sensitive transaction descriptions and merchant names stored at rest in MongoDB.

### 5. 🎯 Budgets & Savings Goals Management
- **Category-Based Budgets**: Set spending limits per category with real-time progress bars and overspend alerts.
- **Savings Goals Tracker**: Define target savings goals, monitor current progress, track deadlines, and update contributions dynamically.

---

## 🏗️ Technical Architecture

```
                                  ┌─────────────────────────┐
                                  │      React + Vite       │
                                  │   Glassmorphic UI Client │
                                  └────────────┬────────────┘
                                               │ REST APIs (Axios)
                                               ▼
                                  ┌─────────────────────────┐
                                  │   Node.js + Express API │
                                  │      (Port 3000)        │
                                  └──────┬────────────┬─────┘
                                         │            │
                         AES-256 Encrypted            │ Gemini 2.5 Flash API
                                         ▼            ▼
                              ┌──────────────┐   ┌─────────────────┐
                              │   MongoDB    │   │  Google Gemini  │
                              │  Database    │   │   AI Service    │
                              └──────────────┘   └─────────────────┘
```

---

## 📁 Repository Structure

```
FinFlow/
├── backend/                 ← Express API Server & Business Logic
│   ├── config/              ← DB Connection setup (MongoDB)
│   ├── middleware/          ← JWT Authentication guard & error handlers
│   ├── models/              ← Mongoose Database Schemas (User, Transaction, Budget, etc.)
│   ├── routes/              ← REST API Endpoints (Auth, Transactions, Statements, AI, Goals)
│   ├── services/            ← Gemini AI integration & AES-256 encryption engine
│   └── server.js            ← Backend entry point
│
├── frontend/                ← React + Vite Client Application
│   ├── src/
│   │   ├── components/      ← Reusable UI Components (Charts, Modals, Tables, AI Advisory)
│   │   ├── context/         ← React Auth Context for JWT state
│   │   ├── pages/           ← Main views (Dashboard, Transactions, Budgets, Subscriptions, AI Advisory)
│   │   └── services/        ← Axios API client
│   └── index.css            ← Glassmorphic UI CSS design system
│
└── uploads/                 ← Secure temporary storage for statement processing
```

---

## 🌐 Complete API Specification

### 🔐 Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user account |
| `POST` | `/api/v1/auth/login` | Authenticate user and issue JWT tokens |

### 💳 Transactions & Analytics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/transactions` | Query filtered, sorted, and paginated transactions |
| `POST` | `/api/v1/transactions` | Create manual transaction record |
| `GET` | `/api/v1/analytics/summary` | Fetch financial summary, health score, and trends |

### 📄 Statement Parser
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/statements/upload` | Upload PDF bank/UPI statement for automated parsing |
| `GET` | `/api/v1/statements` | List user uploaded statements and status |
| `DELETE` | `/api/v1/statements/:id` | Remove statement and linked parsed transactions |

### 🤖 AI Financial Advisor
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/ai/insights` | Generate AI spending insights & anomaly detection |
| `POST` | `/api/v1/ai/chat` | Chat with FinAI contextual financial assistant |

### 🎯 Budgets & Savings Goals
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/budgets` | Get active category budgets and spending progress |
| `POST` | `/api/v1/budgets` | Set/update category budget limit |
| `POST` | `/api/v1/goals` | Create savings goal |
| `PATCH` | `/api/v1/goals/:id` | Update savings progress |

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (local or MongoDB Atlas)
- Google Gemini API Key

### 2. Installation
```bash
git clone https://github.com/Pavan-create-dot/FinFlow.git
cd FinFlow
npm run install:all
```

### 3. Environment Setup
Create `.env` file inside the `backend` directory based on `.env.example`:
```env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/finflow
JWT_ACCESS_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
ENCRYPTION_SECRET=32_character_aes_encryption_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 4. Running the Application
```bash
# Run both Frontend & Backend concurrently
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, Recharts, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **AI Engine** | Google Gemini 2.5 Flash API |
| **Security** | AES-256-GCM Encryption, JWT Authentication, Bcrypt Password Hashing |