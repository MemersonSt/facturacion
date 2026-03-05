#!/bin/sh

# Fail on any error
set -e

echo "DATABASE_URL: $DATABASE_URL"

# Sync Prisma schema to the database (MVP shortcut)
# In production, you'd normally use 'prisma migrate deploy'
echo "Syncing database schema..."
npx prisma db push --accept-data-loss

# Start the application
echo "Starting application..."
exec node server.js
