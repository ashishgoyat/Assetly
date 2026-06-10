ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_demo" boolean NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "demo_expires_at" text;
