#!/bin/sh
set -e

echo "Running Prisma database sync..."
npx prisma db push --skip-generate

echo "Running database seed..."
npm run seed

echo "Starting application..."
exec "$@"
