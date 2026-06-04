CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"number" text NOT NULL,
	"balance_in_cents" integer NOT NULL,
	"week_delta_in_cents" integer NOT NULL,
	"type" text NOT NULL,
	"color" text NOT NULL,
	"apy_bps" integer,
	"routing_number" text,
	"linked_since" text NOT NULL,
	"last_sync" text NOT NULL,
	"balance_history" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bills" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"due_date" text NOT NULL,
	"due_in_days" integer NOT NULL,
	"is_auto_pay" boolean NOT NULL,
	"is_urgent" boolean NOT NULL,
	"category" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"limit_in_cents" integer NOT NULL,
	"spent_in_cents" integer NOT NULL,
	"percentage_used" real NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"is_over" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"current_in_cents" integer NOT NULL,
	"target_in_cents" integer NOT NULL,
	"monthly_contribution_in_cents" integer NOT NULL,
	"percentage_complete" real NOT NULL,
	"eta" text NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL,
	"vibe" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" text PRIMARY KEY NOT NULL,
	"glyph" text NOT NULL,
	"tag" text NOT NULL,
	"tone" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"cta" text NOT NULL,
	"is_pinned" boolean NOT NULL,
	"sparkline_data" text
);
--> statement-breakpoint
CREATE TABLE "notification_emails_sent" (
	"user_id" text NOT NULL,
	"notification_id" text NOT NULL,
	"sent_at" text NOT NULL,
	CONSTRAINT "notification_emails_sent_user_id_notification_id_pk" PRIMARY KEY("user_id","notification_id")
);
--> statement-breakpoint
CREATE TABLE "notification_reads" (
	"user_id" text NOT NULL,
	"notification_id" text NOT NULL,
	"read_at" text NOT NULL,
	CONSTRAINT "notification_reads_user_id_notification_id_pk" PRIMARY KEY("user_id","notification_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"amount_monthly_in_cents" integer NOT NULL,
	"next_date" text NOT NULL,
	"is_used" boolean NOT NULL,
	"icon" text NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"merchant" text NOT NULL,
	"category" text NOT NULL,
	"account_label" text NOT NULL,
	"amount_in_cents" integer NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" text NOT NULL,
	"expires_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text,
	"google_id" text,
	"avatar_url" text,
	"session_version" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
