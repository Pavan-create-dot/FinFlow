# FinFlow — AI Financial Intelligence & Statement Parser

FinFlow is an AI-powered financial intelligence web application built on the MERN stack (utilizing PostgreSQL + Prisma for strict relational transactional integrity). It automates transaction logging by parsing bank statements using Google Gemini AI, processing files asynchronously via BullMQ and Redis, and securing private transaction logs with application-level AES-256-GCM encryption.

---

## 🚀 Key Features
- **AI-Driven PDF Statement Parsing**: Upload your PDF bank statements and let Google Gemini extract dates, amounts, descriptions, and merchants.
- **Asynchronous Task Queue**: Statement parsing runs inside background workers backed by a Redis-based BullMQ queue to prevent HTTP event-loop blocking.
- **Field-Level Security**: High-grade AES-256-GCM cryptography encrypts sensitive transaction descriptions and merchant names before database storage.
- **AI Financial Chat Advisor**: Interact with a customized Gemini Chat advisor that leverages your transaction logs to offer personalized savings advice.
- **Visual Analytics**: Interactive spend breakdowns and area charts powered by Recharts.
- **Monthly Budgets & Goals**: Set limits and track progress dynamically with alerts.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Recharts, Lucide React, Vanilla CSS variables
- **Backend API**: Node.js, Express, TypeScript, Zod validations, Helmet security
- **ORM & Database**: Prisma Client, PostgreSQL
- **Asynchronous Task Queue**: BullMQ, Redis, child_process spawns
- **Artificial Intelligence**: Google Gemini API (`gemini-2.0-flash`, `gemini-2.5-flash`)
- **Testing**: Jest, Supertest

---

## 📂 Project Architecture

```
                      ┌──────────────────────────────────────────────┐
                      │          React Frontend (Vite + TS)          │
                      │  - Modular Page Views & Custom Context Auth  │
                      └──────────────────────┬───────────────────────┘
                                             │ REST API (Axios Interceptors)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │          Express API Server (Node/TS)        │
                      │  - Validation boundary (Zod schemas)         │
                      │  - Thin Controller / Fat Service Pattern     │
                      └──────────────┬────────────────┬──────────────┘
                                     │                │
                            Prisma   │                │ BullMQ / Redis
                            ORM      ▼                ▼
                      ┌──────────────┐       ┌───────────────────────┐
                      │ PostgreSQL   │       │ PDF Statement Worker  │
                      └──────────────┘       └───────────────────────┘
```

---

## ⚙️ Development Setup

Follow these steps to run the application locally:

### Prerequisites
- Node.js (v18+)
- Docker (for running PostgreSQL and Redis services)

### 1. Configure Services via Docker
Start the Redis and PostgreSQL instances:
```bash
docker-compose up -d
```

### 2. Environment Variables Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/finflow?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
GEMINI_API_KEY="your-google-gemini-api-key"
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
ENCRYPTION_SECRET="your-32-character-secret-key-1234"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### 3. Database Initialization
Install dependencies, generate Prisma client, and push database tables:
```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. Run the Project
Start the API server and BullMQ background worker concurrently:
```bash
npm run dev
```

In a separate terminal, navigate to the frontend directory, install dependencies, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` to view the application.

---

## 🧪 Testing & Verification
You can run checks using the predefined project scripts:
- **Lint**: Run ESLint checks:
  ```bash
  npm run lint
  ```
- **Test**: Run the Jest integration test suite:
  ```bash
  npm test
  ```
- **Build**: Compile TypeScript files:
  ```bash
  npm run build
  ```
- **Seed**: Seed database with mock category limits:
  ```bash
  npm run seed
  ```

---

## 🔮 Future Enhancements
1. **OAuth2 authentication**: Integrate Google and GitHub login wrappers.
2. **Third-party banking integrations**: Implement Plaid/Yodlee account linking.
3. **Advanced visual projections**: Add historical predictive spending trends.