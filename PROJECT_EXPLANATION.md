# FinFlow Study Guide: Placement & Interview Preparation

Welcome! This study guide is designed to teach you everything about your project, **FinFlow**. It is written to help you explain the architecture, tech stack, design trade-offs, request lifecycle, and database choices clearly and confidently during technical interviews.

---

## 1. Project Overview & Quick Elevator Pitches

**FinFlow** is an AI-powered financial intelligence and automated statement parsing web application built on the MERN stack (PostgreSQL with Prisma instead of MongoDB for strict relational transactions). It allows users to upload PDF bank statements, queues them for asynchronous processing using a Redis-backed BullMQ job queue, extracts structured transactional data using Google Gemini AI, stores and retrieves cash flows securely using field-level AES-256-GCM encryption, and provides personalized financial insights and advisory via a real-time AI Chat interface.

### ⏱️ Pitch Templates (Rehearse these!)

#### The 2-Minute Pitch (Short & Impactful)
> "For my capstone project, I built FinFlow, an AI-powered personal finance intelligence dashboard. It automates a major pain point: manually logging transactions from PDF bank statements.
>
> Users simply upload their PDF statement. The backend accepts it, generates a database record, and queues the PDF path onto a BullMQ job queue backed by Redis. A background worker picks up the job, extracts raw text from the PDF, and uses Google Gemini to parse it into structured JSON transactions. To guarantee strict privacy, all sensitive details like descriptions and merchant names are encrypted at the field level using AES-256-GCM before database storage.
>
> The frontend is built with React and TypeScript, leveraging a custom layouts-and-pages design system. In addition to visual spending analytics and monthly budgets, I integrated a context-aware chat assistant using Gemini, allowing users to ask natural language questions about their spending history. I chose PostgreSQL and Prisma to guarantee ACID compliance for financial ledgers, and Docker to orchestrate Redis/Postgres services."

#### The 5-Minute Pitch (Detailed Technical Walkthrough)
> "I built FinFlow to solve the manual entry issue in budget tracking by combining AI-driven parsing with secure relational storage. The system is divided into three key layers:
>
> 1. **React Frontend**: Built using Vite and TypeScript. I deconstructed a monolithic dashboard into modular view-pages (Dashboard, Transactions, Budgets, Subscriptions) and layout components, driven by a centralized React Context (`AuthContext`) for authentication token management. It uses Recharts for SVG visual analytics.
> 2. **Express Backend API**: Thin, controller-based routers structured strictly around a service layer pattern (`AuthService`, `TransactionService`, etc.) to isolate business logic. Inputs are validated at the route boundary using Zod schema schemas.
>   - *Security*: Communication is secured via JWT. Sensitive transactional data is encrypted at the field level using AES-256-GCM before writing to PostgreSQL, and decrypted on read. This ensures that even in the case of a database leak, user descriptions remain private.
> 3. **Asynchronous Background Processing**: Since PDF parsing and AI extraction are expensive operations, doing them synchronously in HTTP handlers would block the Express event loop. I implemented a Redis-backed BullMQ worker. Uploaded statements are immediately accepted with an HTTP `202 Accepted` status, while the background worker processes the PDF, maps extracted names to database categories, and updates the statement status to `COMPLETED` or `FAILED`.
>
> I chose PostgreSQL over MongoDB because financial data is inherently relational (Transactions belong to Users and Categories, Budgets map to Categories), and Prisma ORM provides type-safe queries. I also configured Docker Compose for development environment orchestration and wrote a Jest integration test suite for validation."

#### The 10-Minute Pitch (Deep-Dive & Trade-offs)
> (Start with the 5-minute pitch, then transition to technical trade-offs and design decisions):
> "Let's discuss the core engineering decisions and trade-offs made in FinFlow:
> - **Redis + BullMQ vs. Synchronous Processing**: Synch processing blocks the HTTP thread. While a serverless function could do this, BullMQ gives us rate-limiting, job retries with exponential backoffs, and lifecycle status tracking out of the box, making the user experience seamless.
> - **Field-Level Encryption (AES-256-GCM) vs. Full Disk Encryption**: Database-level storage encryption is vulnerable if the database server itself is compromised or if SQL injection occurs. Field-level encryption using Node's `crypto` module guarantees that descriptions are encrypted before hitting the database, with keys residing in server memory. We trade off database indexing and direct SQL text searching (which we solve by fetching and filtering in memory on the service layer with limits).
> - **PostgreSQL vs. MongoDB**: Financial ledgers require strict schema enforcement and transactional consistency. PostgreSQL guarantees ACID compliance. Using Prisma allows us to use relational integrity constraints (e.g. cascading deletes of transactions when a statement is deleted)."

---

## 2. Folder Structure Explanation

The codebase uses a clean, production-grade folder structure designed to show recruiters you understand separation of concerns:

```
FinFlow/
├── src/                         # Backend Source Code (Express & TypeScript)
│   ├── config/                  # Configuration (Env validation, Redis connections)
│   ├── constants/               # System category mappings and enums
│   ├── controllers/             # Thin HTTP Controller Layer (extracts inputs, returns JSON)
│   ├── dtos/                    # Zod payload validation schemas & DTO types
│   ├── lib/                     # Singleton initializations (PrismaClient, GeminiAI)
│   ├── middlewares/             # Middlewares (Auth check, validateRequest, errorHandler)
│   ├── routes/                  # Route routers map HTTP paths to controllers
│   ├── services/                # Pure Business Logic & DB Transactions
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

### Why this is interview-friendly:
- **Thin Controllers, Rich Services**: Interviewers look for "fat models/services, thin controllers". It proves you don't leak database logic into the presentation (HTTP) layer.
- **DTOs (Data Transfer Objects)**: Shows you understand API input hardening. Zod schemas validate req.body before it ever touches business code.

---

## 3. Core Workflows & Request Lifecycles

### 🔐 1. Authentication Flow (JWT)

```
[Client App]                     [AuthRoutes & Controller]              [AuthService & DB]
     │                                       │                                  │
     ├────── Post Credentials ──────────────>│                                  │
     │                                       ├──────── Validate (Zod) ─────────>│
     │                                       │                                  ├─ Compare Hash (Bcrypt)
     │                                       │<─────── Return User & Tokens ────┤
     │<───── Return JWTs (Access + Refresh) ─┤                                  │
```

1. **Registration**: User sends `email`, `password`, `firstName`. `AuthService` hashes the password using `bcryptjs` (salt rounds: 12) and creates the record in PostgreSQL.
2. **Login**: Authenticates credentials. On success, generates a **JWT Access Token** (expires in 1 hour) and a **JWT Refresh Token** (expires in 7 days).
3. **Session State**: The client stores the JWT in `localStorage` and appends it as a `Bearer` token inside Axios request headers.

---

### 📥 2. PDF Processing & BullMQ Workflow (Asynchronous Job Queue)

```
[Client]              [Express API]            [BullMQ Queue]           [Redis]           [PDF Worker]
   │                       │                          │                    │                   │
   ├─ Upload PDF File ───>│                          │                    │                   │
   │                       ├─ Save Record (PENDING)   │                    │                   │
   │                       ├─ Add Job to Queue ──────>│                    │                   │
   │                       │                          ├───── Push job ────>│                   │
   │<─ HTTP 202 Accepted ──┤                          │                    │                   │
   │                       │                          │                    │<── Pull Job ──────┼
   │                       │                          │                    │                   ├─ Parse PDF Text
   │                       │                          │                    │                   ├─ Extract AI Txs
   │                       │                          │                    │                   ├─ Encrypt & Write DB
   │                       │                          │                    │                   └─ Status: COMPLETED
```

1. **Upload Boundary**: Client posts form-data with the PDF file to `/api/v1/statements/upload`.
2. **API Action**:
   - Saves a statement record in PostgreSQL with status `PENDING`.
   - Adds a job to the `pdf-processing` BullMQ queue.
   - Immediately returns `202 Accepted` to the client, preventing HTTP timeouts.
3. **Queue Mechanism**: BullMQ serializes the job payload and pushes it to Redis.
4. **Worker Action**: A background worker process (`src/workers/pdfWorker.ts`) listens to Redis, parses PDF text using `pdf-parse`, sends text to Gemini AI, encrypts the transactions, writes them to Postgres via a database transaction, and updates the statement status to `COMPLETED`.

---

### 🛡️ 3. Input Validation & Request Lifecycle (Step-by-Step)

```
HTTP Request ──> Route ──> validateRequest(Schema) ──> authenticateJWT ──> Controller ──> Service ──> Prisma/DB
```

1. **Vite UI**: Executes `api.transactions.create(data)`.
2. **Express Router**: Receives the request at `POST /api/v1/transactions`.
3. **Zod Validation Middleware**: Parses and validates `req.body` against `createTransactionSchema`. If validation fails, returns a formatted `400 Bad Request` immediately, protecting the database.
4. **Authentication Middleware**: Verifies the `Authorization: Bearer <JWT>` header. Decodes user ID, binding it to `req.user`.
5. **Controller**: Extracts `req.user.id` and sanitized `req.body`. Calls `TransactionService.createTransaction()`.
6. **Service**: Encrypts the description using `crypto.createCipheriv` (AES-256-GCM), commits the transaction to the database, and returns the decrypted transaction back to the controller.

---

## 4. Key Design Decisions & Technical Trade-offs

| Decision | Trade-off / Cost | Alternative Considered | Benefit / Why Selected |
|----------|------------------|------------------------|------------------------|
| **PostgreSQL + Prisma** | Strict schema requires manual migrations during changes. | MongoDB (NoSQL) | Financial ledgers are relational. Postgres ensures data integrity, ACID compliance, and foreign key cascades. |
| **Field-Level Encryption** | Cannot perform indexing, sub-string matching, or SQL search filters on DB level. | Full Disk Encryption (FDE) | If database credentials leak, client data remains encrypted. We resolve search constraints by filtering in memory on the service layer. |
| **BullMQ + Redis Queue** | Adds infrastructure overhead (requires Redis instance). | Synchronous API parsing | Prevents API timeouts. Background parsing handles slow AI responses gracefully and retries automatically on failure. |
| **Gemini AI Integration** | High latency (3-5s response time) and API cost. | Traditional Regex parsers | Regex is brittle and fails when PDF structures change. AI extracts merchant names and dates dynamically from any format. |

---

## 5. 10 High-Yield Placement Interview Questions & Answers

### Q1: Why did you choose relational PostgreSQL over document-based MongoDB?
> **Answer**: "Financial transaction records are strictly structured and highly relational. Transactions must map to Users and Categories, and Budgets must link cleanly to Categories. PostgreSQL enforces this data integrity at the database level using foreign keys. Additionally, financial ledgers require ACID compliance (Atomicity, Consistency, Isolation, Durability) to prevent partial writes. PostgreSQL guarantees ACID compliance, whereas MongoDB's document architecture can lead to data duplication and lack of structural constraints."

### Q2: How did you implement security, and why did you choose field-level encryption?
> **Answer**: "I used field-level encryption (AES-256-GCM) for sensitive transaction fields like descriptions and merchant names. While full-disk encryption protects data at rest, it is useless if an attacker gets read access via SQL injection or compromised credentials. By encrypting fields inside our application layer using a secret key stored in environment variables, the database only stores cipher text. The data is encrypted before writing and decrypted on retrieval."

### Q3: How do you search/filter encrypted fields if database queries can't read them?
> **Answer**: "Since descriptions are encrypted in the database, SQL `WHERE description LIKE '%search%'` doesn't work. To resolve this, the service layer fetches the encrypted records filtered by non-sensitive indices (like `userId` and `date`), decrypts them in memory, and performs string filtering in Node.js before applying limit and offset slicing. For scaling, we could leverage a secure search index or compute blind index hashes, but for our scale, in-memory filtering strikes the right balance between simplicity and security."

### Q4: Why did you choose BullMQ and Redis instead of handling uploads synchronously?
> **Answer**: "PDF statement parsing and AI extraction are slow, CPU-intensive operations (often taking 4-8 seconds). If handled synchronously in the HTTP thread, it would block the Express single-threaded event loop, leading to API timeouts and blocking other users. By using BullMQ and Redis, we delegate this work to background worker processes. The API immediately responds with `202 Accepted`, and the worker handles parsing asynchronously, complete with automated retry states."

### Q5: How do you prevent SQL Injection and Cross-Site Scripting (XSS) in this project?
> **Answer**: "Prisma ORM automatically parameterizes all queries, neutralizing SQL injection vectors. For XSS and API hardening, the backend uses `helmet` middleware to set secure HTTP headers (like CSP, X-Frame-Options, and HSTS). Additionally, Zod validations sanitize inputs and verify correct types, preventing malformed payloads from execution."

### Q6: What happens if the Redis server goes down while a user is uploading a statement?
> **Answer**: "If Redis goes down, BullMQ cannot push the job. In our `StatementService`, the upload operation is wrapped in a try/catch. If the queue throws a connection error, the service captures it, marks the database statement record status as `FAILED` (with error message 'Processing service unavailable'), and returns a graceful HTTP `503 Service Unavailable` status to the client, preventing app crashes."

### Q7: How does your AI statement parser map transactions to database category IDs dynamically?
> **Answer**: "The Gemini AI prompt extracts raw categories (e.g. 'Food', 'Streaming'). In our background PDF worker, we fetch all database category entries and create a hash map of lowercase names to database IDs. During parsing, we check if the AI-extracted category matches any database category. If it does, we bind that `categoryId`; otherwise, we default to `null` (Uncategorized) so users can assign categories manually."

### Q8: How did you optimize React re-rendering in the main Dashboard layout?
> **Answer**: "In our refactoring, we deconstructed the monolithic state by moving tab-specific layouts and modals into separate page components (`DashboardPage`, `TransactionsPage`, etc.). This localizes state variables (like filter strings, sorting orders, and input states) inside their respective components. As a result, typing a search keyword in the transactions page only re-renders the transactions view instead of the entire sidebar layout."

### Q9: Why did you choose JWT over Session-based Authentication?
> **Answer**: "JWT is stateless and highly scalable. Since the server does not store session states in memory, the backend API can be scaled horizontally without requiring shared session stores. The access token is verified cryptographically on each request, which also works seamlessly if the frontend and backend are deployed on separate domains (e.g., Vercel and Render)."

### Q10: How do you handle BigInt database values in a JSON-based Express API?
> **Answer**: "JavaScript's `Number` type cannot safely represent large 64-bit integers (BigInt). Prisma returns database `BigInt` values for transaction currency values (stored in paise to avoid floating-point errors). Since JSON cannot serialize BigInt, I wrote a `serializePrisma` utility that intercepts database responses, recursively converts BigInt values to standard Numbers, and then passes them to Express's `res.json()`. This guarantees numerical precision without API serialization crashes."
