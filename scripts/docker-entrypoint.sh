#!/bin/sh
set -e

mkdir -p /data

echo "Applying database schema..."
npx prisma db push --skip-generate

if [ ! -f /data/.seeded ]; then
  echo "First run: seeding database..."
  npx tsx prisma/seed.ts
  touch /data/.seeded
  echo "Seed completed."
else
  echo "Database already seeded; skipping seed."
fi

echo "Starting application..."
exec node server.js
