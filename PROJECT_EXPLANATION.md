# FinFlow Study Guide: Placement & Interview Preparation

Welcome! This study guide is designed to teach you everything about your project, **FinFlow**. It is written to help you explain the architecture, tech stack, design trade-offs, request lifecycle, and database choices clearly and confidently during technical interviews.

---

## 1. Project Overview & Quick Elevator Pitches

**FinFlow** is an AI-powered financial intelligence and automated statement parsing web application built on the MERN stack (MongoDB, Express.js, React, Node.js with Mongoose ODM). It allows users to upload PDF bank statements, queues them for asynchronous processing using a Redis-backed BullMQ job queue, extracts structured transactional data using Google Gemini AI, stores and retrieves cash flows securely using field-level AES-256-GCM encryption, and provides personalized financial insights and advisory via a real-time AI Chat interface.

### ⏱️ Pitch Templates (Rehearse these!)

#### The 2-Minute Pitch (Short & Impactful)
> "For my capstone project, I built FinFlow, an AI-powered personal finance intelligence dashboard. It automates a major pain point: manually logging transactions from PDF bank statements.
>
> Users simply upload their PDF statement. The backend accepts it, generates a database record, and queues the PDF path onto a BullMQ job queue backed by Redis. A background worker picks up the job, extracts raw text from the PDF, and uses Google Gemini to parse it into structured JSON transactions. To guarantee strict privacy, all sensitive details like descriptions and merchant names are encrypted at the field level using AES-256-GCM before database storage.
>
> The frontend is built with React and TypeScript, leveraging a custom layouts-and-pages design system. In addition to visual spending analytics and monthly budgets, I integrated a context-aware chat assistant using Gemini, allowing users to ask natural language questions about their spending history. I chose MongoDB with Mongoose to enable flexible document schemas and fast aggregation pipelines, backed by MongoDB Atlas for managed cloud persistence."

#### The 5-Minute Pitch (Detailed Technical Walkthrough)
> "I built FinFlow to solve the manual entry issue in budget tracking by combining AI-driven parsing with secure document storage. The system is divided into three key layers:
>
> 1. **React Frontend**: Built using Vite and TypeScript. I deconstructed a monolithic dashboard into modular view-pages (Dashboard, Transactions, Budgets, Subscriptions) and layout components, driven by a centralized React Context (`AuthContext`) for authentication token management. It uses Recharts for SVG visual analytics.
> 2. **Express Backend API**: Thin, controller-based routers structured strictly around a service layer pattern (`AuthService`, `TransactionService`, etc.) to isolate business logic. Inputs are validated at the route boundary using Zod schemas.
>   - *Security*: Communication is secured via JWT. Sensitive transactional data is encrypted at the field level using AES-256-GCM before writing to MongoDB, and decrypted on read. This ensures that even in the case of a database leak, user descriptions remain private.
> 3. **Asynchronous Background Processing**: Since PDF parsing and AI extraction are expensive operations, doing them synchronously in HTTP handlers would block the Express event loop. I implemented a Redis-backed BullMQ worker. Uploaded statements are immediately accepted with an HTTP `202 Accepted` status, while the background worker processes the PDF, maps extracted names to database categories, and updates the statement status to `COMPLETED` or `FAILED`.
>
> I chose MongoDB with Mongoose because financial transaction documents, budgets, and statements naturally fit JSON document schemas, and Mongoose ODM provides schema validation, indexes, and aggregation pipelines. I also wrote a Jest integration test suite for automated API validation."

---

## 2. Folder Structure Explanation

The codebase uses a clean, production-grade folder structure designed to show recruiters you understand separation of concerns:

```
FinFlow/
├── src/                         # Backend Source Code (Express & TypeScript)
│   ├── config/                  # Configuration (Env validation, Redis & DB connections)
│   ├── controllers/             # Thin HTTP Controller Layer (extracts inputs, returns JSON)
│   ├── dtos/                    # Zod payload validation schemas & DTO types
│   ├── lib/                     # Database connection singleton (connectDB)
│   ├── middlewares/             # Middlewares (Auth check, validateRequest, errorHandler)
│   ├── models/                  # Mongoose Schema Models (User, Statement, Transaction, etc.)
│   ├── routes/                  # Route routers map HTTP paths to controllers
│   ├── services/                # Pure Business Logic & Aggregation Pipelines
│   ├── utils/                   # Shared utility helpers (AES-256 cipher, serializers)
│   ├── workers/                 # Asynchronous PDF parsing worker
│   ├── app.ts                   # Express server setup and middlewares
│   └── start.ts                 # Entrypoint spawns API & Workers concurrently
├── frontend/                    # Frontend Source Code (Vite, React & TS)
│   ├── src/
│   │   ├── context/             # AuthContext (React auth state)
│   │   ├── components/          # Layouts (Sidebar, Navbar) & Modals
│   │   ├── pages/               # Isolated view pages (DashboardPage, BudgetsPage, etc.)
│   │   ├── services/            # Axios API client endpoints (api.ts)
│   │   ├── types.ts             # Strict TypeScript model definitions
│   │   └── App.tsx              # Root component & tab layout orchestrator
```

---

## 3. Core Workflows & Request Lifecycles

### 🔐 1. Authentication Flow (JWT)

1. **Registration**: User sends `email`, `password`, `firstName`. `AuthService` hashes the password using `bcryptjs` (salt rounds: 12) and creates the record in MongoDB.
2. **Login**: Authenticates credentials. On success, generates a **JWT Access Token** (expires in 1 hour) and a **JWT Refresh Token** (expires in 7 days).
3. **Session State**: The client stores the JWT in `localStorage` and appends it as a `Bearer` token inside Axios request headers.

---

### 📥 2. PDF Processing & BullMQ Workflow (Asynchronous Job Queue)

1. **Upload Boundary**: Client posts form-data with the PDF file to `/api/v1/statements/upload`.
2. **API Action**:
   - Saves a statement record in MongoDB with status `PENDING`.
   - Adds a job to the `pdf-processing` BullMQ queue.
   - Immediately returns `202 Accepted` to the client, preventing HTTP timeouts.
3. **Queue Mechanism**: BullMQ serializes the job payload and pushes it to Redis.
4. **Worker Action**: A background worker process (`src/workers/pdfWorker.ts`) listens to Redis, parses PDF text using `pdf-parse`, sends text to Gemini AI, encrypts the transactions, batch-inserts them to MongoDB using `Transaction.insertMany()`, and updates the statement status to `COMPLETED`.

---

### 🛡️ 3. Input Validation & Request Lifecycle (Step-by-Step)

```
HTTP Request ──> Route ──> validateRequest(Schema) ──> authenticateJWT ──> Controller ──> Service ──> Mongoose/MongoDB
```

---

## 4. Key Design Decisions & Technical Trade-offs

| Decision | Trade-off / Cost | Alternative Considered | Benefit / Why Selected |
|----------|------------------|------------------------|------------------------|
| **MongoDB + Mongoose** | No SQL joins; requires `$lookup` or `.populate()` for references. | PostgreSQL / MySQL | Native JSON document format, dynamic schema flexibility for AI output, fast read/write throughput, and powerful aggregation framework. |
| **Field-Level Encryption** | Cannot perform indexing or text search directly at DB level. | Full Disk Encryption (FDE) | If database credentials leak, client data remains encrypted. We resolve search constraints by filtering in memory on the service layer. |
| **BullMQ + Redis Queue** | Adds infrastructure overhead (requires Redis instance). | Synchronous API parsing | Prevents API timeouts. Background parsing handles slow AI responses gracefully and retries automatically on failure. |
| **Gemini AI Integration** | High latency (3-5s response time) and API cost. | Traditional Regex parsers | Regex is brittle and fails when PDF structures change. AI extracts merchant names and dates dynamically from any format. |

---

## 5. 10 High-Yield Placement Interview Questions & Answers

### Q1: Why did you choose MongoDB over a traditional SQL database?
> **Answer**: "FinFlow processes dynamic financial payloads extracted from bank statement PDFs by AI models. MongoDB's document model represents JSON data natively without complex relational table transformations. With Mongoose ODM, we enforce strict schema validation, type safety, and indexes, while maintaining high write throughput and leveraging MongoDB's Aggregation Framework for high-speed spend metrics and monthly trend calculations."

### Q2: How did you implement security, and why did you choose field-level encryption?
> **Answer**: "I used field-level encryption (AES-256-GCM) for sensitive transaction fields like descriptions and merchant names. While full-disk encryption protects data at rest, it is useless if an attacker gets read access via database compromise. By encrypting fields inside our application layer using a secret key stored in environment variables, the database only stores cipher text. The data is encrypted before writing and decrypted on retrieval."

### Q3: How do you search/filter encrypted fields if database queries can't read them?
> **Answer**: "Since descriptions are encrypted in the database, DB-level `$regex` on ciphertext won't match plaintext search queries. To resolve this, the service layer fetches the encrypted records filtered by non-sensitive indexed fields (like `userId` and `date`), decrypts them in memory, and performs string filtering in Node.js before applying limit and offset slicing."

### Q4: Why did you choose BullMQ and Redis instead of handling uploads synchronously?
> **Answer**: "PDF statement parsing and AI extraction are slow, CPU-intensive operations (often taking 4-8 seconds). If handled synchronously in the HTTP thread, it would block the Express single-threaded event loop, leading to API timeouts and blocking other users. By using BullMQ and Redis, we delegate this work to background worker processes. The API immediately responds with `202 Accepted`, and the worker handles parsing asynchronously, complete with automated retry states."

### Q5: How do you prevent NoSQL Injection and Cross-Site Scripting (XSS) in this project?
> **Answer**: "Mongoose automatically casts inputs according to schema definitions, neutralizing NoSQL operator injection vectors (like `{ $gt: '' }`). For XSS and API hardening, the backend uses `helmet` middleware to set secure HTTP headers (like CSP, X-Frame-Options, and HSTS). Additionally, Zod validations sanitize inputs and verify correct types, preventing malformed payloads from execution."

### Q6: What happens if the Redis server goes down while a user is uploading a statement?
> **Answer**: "If Redis goes down, BullMQ cannot push the job. In our `StatementService`, the upload operation is wrapped in a try/catch. If the queue throws a connection error, the service captures it, marks the database statement record status as `FAILED` (with error message 'Processing service unavailable'), and returns a graceful HTTP `503 Service Unavailable` status to the client, preventing app crashes."

### Q7: How does your AI statement parser map transactions to database category IDs dynamically?
> **Answer**: "The Gemini AI prompt extracts raw categories (e.g. 'Food', 'Streaming'). In our background PDF worker, we fetch all database category entries and create a hash map of lowercase names to database IDs. During parsing, we check if the AI-extracted category matches any database category. If it does, we bind that `categoryId`; otherwise, we default to `null` (Uncategorized) so users can assign categories manually."

### Q8: How did you optimize React re-rendering in the main Dashboard layout?
> **Answer**: "In our refactoring, we deconstructed the monolithic state by moving tab-specific layouts and modals into separate page components (`DashboardPage`, `TransactionsPage`, etc.). This localizes state variables (like filter strings, sorting orders, and input states) inside their respective components. As a result, typing a search keyword in the transactions page only re-renders the transactions view instead of the entire sidebar layout."

### Q9: Why did you choose JWT over Session-based Authentication?
> **Answer**: "JWT is stateless and highly scalable. Since the server does not store session states in memory, the backend API can be scaled horizontally without requiring shared session stores. The access token is verified cryptographically on each request, which also works seamlessly if the frontend and backend are deployed on separate domains (e.g., Vercel and Render)."

### Q10: How do you transform MongoDB ObjectId `_id` fields to standard JSON `id` strings for API consumers?
> **Answer**: "In Mongoose, we configure model schemas with custom `toJSON` and `toObject` transformations (`transform: (_doc, ret) => { ret.id = ret._id.toString(); delete ret._id; delete ret.__v; return ret; }`). This ensures that all API endpoints return clean JSON objects with a standard string `id` property, matching the REST specification expected by client applications."
