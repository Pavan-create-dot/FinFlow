# FinFlow — AI Financial Intelligence & Statement Parser

FinFlow is an AI-powered financial intelligence web application built on the MERN stack (utilizing MongoDB + Mongoose for flexible, high-performance document data storage). It automates transaction logging by parsing bank statements using Google Gemini AI, processing files asynchronously via BullMQ and Redis, and securing private transaction logs with application-level AES-256-GCM encryption.

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
- **ODM & Database**: Mongoose ODM, MongoDB (MongoDB Atlas Cloud Database)
- **Asynchronous Task Queue**: BullMQ, Redis
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
                           Mongoose  │                │ BullMQ / Redis
                           ODM       ▼                ▼
                      ┌──────────────┐       ┌───────────────────────┐
                      │ MongoDB Atlas│       │ PDF Statement Worker  │
                      └──────────────┘       └───────────────────────┘
```

---

## ⚙️ Development Setup

Follow these simple steps to run the application locally:

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (free cloud cluster)

### 1. Environment Variables Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/finflow?retryWrites=true&w=majority"
REDIS_HOST="localhost"
REDIS_PORT=6379
GEMINI_API_KEY="your-google-gemini-api-key"
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"
ENCRYPTION_SECRET="your-32-character-secret-key-1234"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### 2. Database Seeding
Install dependencies and seed default system categories into MongoDB:
```bash
npm install
npm run seed
```

### 3. Run the Backend API & Worker
Start the API server and BullMQ background worker concurrently:
```bash
npm run dev
```

### 4. Run the Frontend
In a separate terminal, navigate to the frontend directory, install dependencies, and start Vite:
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing & Verification
Execute the automated test suite using Jest:
```bash
npm test
```