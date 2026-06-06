# FinFlow - AI Financial Insights

## Tech Stack
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **Frontend**: React, TS, Recharts
- **Queue**: BullMQ, Redis
- **AI**: Gemini 1.5 Flash (Extraction), 1.5 Pro (Insights)

## Setup
1. `docker-compose up -d`
2. `cd backend && npm install && npx prisma db push`
3. `npm run worker` (Start parsing worker)
4. `npm run dev` (Start API)
5. `cd frontend && npm install && npm run dev`

## Envariables (.env)
- `DATABASE_URL`: Postgres connection
- `REDIS_HOST`: Redis connection
- `GEMINI_API_KEY`: Google AI Key
- `JWT_ACCESS_SECRET`: Secret for tokens
- `ENCRYPTION_SECRET`: 32-char key for AES-256
