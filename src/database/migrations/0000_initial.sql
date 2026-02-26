CREATE TYPE "public"."alert_channel" AS ENUM('in_app', 'email');--> statement-breakpoint
CREATE TYPE "public"."alert_type" AS ENUM('new_violation', 'violation_resolved', 'new_permit', 'complaint_spike', 'condition_change');--> statement-breakpoint
CREATE TYPE "public"."condition" AS ENUM('good', 'fair', 'poor', 'critical');--> statement-breakpoint
CREATE TYPE "public"."condition_provider" AS ENUM('nearmap', 'eagleview');--> statement-breakpoint
CREATE TYPE "public"."ingestion_status" AS ENUM('pending', 'running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('residential', 'commercial', 'mixed_use', 'industrial', 'other');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('nyc_open_data', 'lightbox', 'attom', 'locatenyc', 'nearmap', 'eagleview', 'perilpulse');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('owner_pack', 'insurance_packet');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."signal_source" AS ENUM('nyc_open_data', 'nearmap', 'eagleview', 'lightbox', 'attom', 'perilpulse', 'locatenyc', 'manual');--> statement-breakpoint
CREATE TYPE "public"."signal_type" AS ENUM('permit', 'violation', 'complaint', 'hazard', 'valuation', 'condition');--> statement-breakpoint
CREATE TYPE "public"."task_category" AS ENUM('inspection', 'violation_followup', 'vendor_quote', 'legal', 'maintenance', 'other');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'in_progress', 'blocked', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'manager', 'viewer', 'dashboard_ops');--> statement-breakpoint
CREATE TABLE "alert_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"property_id" integer,
	"alert_type" "alert_type" NOT NULL,
	"channel" "alert_channel" DEFAULT 'in_app' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"signal_id" integer,
	"task_id" integer,
	"alert_type" "alert_type" NOT NULL,
	"severity" "severity" DEFAULT 'low' NOT NULL,
	"title" varchar(512) NOT NULL,
	"body" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp,
	"dismissed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "api_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" "provider" NOT NULL,
	"cache_key" varchar(512) NOT NULL,
	"payload" jsonb NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cache_provider_key_unique" UNIQUE("provider","cache_key")
);
--> statement-breakpoint
CREATE TABLE "condition_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"provider" "condition_provider" NOT NULL,
	"snapshot_date" date NOT NULL,
	"imagery_url" varchar(2048),
	"thumbnail_url" varchar(2048),
	"condition_overall" "condition",
	"roof_condition" "condition",
	"exterior_condition" "condition",
	"ai_attributes" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ingestion_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_type" varchar(128) NOT NULL,
	"property_id" integer,
	"status" "ingestion_status" DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"result_summary" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan_tier" varchar(64) DEFAULT 'starter' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"name" varchar(255),
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(128) NOT NULL,
	"state" varchar(64) NOT NULL,
	"zip" varchar(16) NOT NULL,
	"country" varchar(64) DEFAULT 'US' NOT NULL,
	"bbl" varchar(32),
	"bin" varchar(16),
	"block" varchar(16),
	"lot" varchar(16),
	"latitude" real,
	"longitude" real,
	"property_type" "property_type" DEFAULT 'residential',
	"year_built" integer,
	"floors" integer,
	"units" integer,
	"risk_score" real DEFAULT 0,
	"risk_score_updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "property_identifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"provider" "provider" NOT NULL,
	"provider_key" varchar(128) NOT NULL,
	"provider_value" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"generated_by" integer NOT NULL,
	"report_type" "report_type" DEFAULT 'owner_pack' NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"storage_url" varchar(2048),
	"file_name" varchar(512),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"signal_type" "signal_type" NOT NULL,
	"source" "signal_source" NOT NULL,
	"event_date" date,
	"status" varchar(64),
	"severity" "severity" DEFAULT 'low',
	"title" varchar(512),
	"description" text,
	"raw_payload" jsonb,
	"normalized_fields" jsonb,
	"external_id" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "task_attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"uploaded_by" integer NOT NULL,
	"file_name" varchar(512) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(128),
	"storage_url" varchar(2048) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"organization_id" integer NOT NULL,
	"signal_id" integer,
	"title" varchar(512) NOT NULL,
	"description" text,
	"category" "task_category" DEFAULT 'other' NOT NULL,
	"priority" "task_priority" DEFAULT 'normal' NOT NULL,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"assignee_id" integer,
	"due_date" date,
	"created_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(128),
	"last_name" varchar(128),
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"reset_password_token" varchar(255),
	"reset_password_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_subscriptions" ADD CONSTRAINT "alert_subscriptions_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condition_snapshots" ADD CONSTRAINT "condition_snapshots_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_jobs" ADD CONSTRAINT "ingestion_jobs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_identifiers" ADD CONSTRAINT "property_identifiers_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_attachments" ADD CONSTRAINT "task_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_signal_id_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."signals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sub_user_idx" ON "alert_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sub_property_idx" ON "alert_subscriptions" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "alert_org_idx" ON "alerts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "alert_property_idx" ON "alerts" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "alert_type_idx" ON "alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "alert_is_read_idx" ON "alerts" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "cache_provider_key_idx" ON "api_cache" USING btree ("provider","cache_key");--> statement-breakpoint
CREATE INDEX "cache_expires_at_idx" ON "api_cache" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "condition_property_idx" ON "condition_snapshots" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "condition_provider_idx" ON "condition_snapshots" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "condition_date_idx" ON "condition_snapshots" USING btree ("snapshot_date");--> statement-breakpoint
CREATE INDEX "job_type_idx" ON "ingestion_jobs" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "job_property_idx" ON "ingestion_jobs" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "job_status_idx" ON "ingestion_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_created_at_idx" ON "ingestion_jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "org_name_idx" ON "organizations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "org_created_at_idx" ON "organizations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "org_deleted_at_idx" ON "organizations" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "property_org_idx" ON "properties" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "property_bbl_idx" ON "properties" USING btree ("bbl");--> statement-breakpoint
CREATE INDEX "property_bin_idx" ON "properties" USING btree ("bin");--> statement-breakpoint
CREATE INDEX "property_city_state_idx" ON "properties" USING btree ("city","state");--> statement-breakpoint
CREATE INDEX "property_risk_score_idx" ON "properties" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "property_deleted_at_idx" ON "properties" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "prop_id_property_idx" ON "property_identifiers" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "prop_id_provider_idx" ON "property_identifiers" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "report_property_idx" ON "reports" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "report_generated_by_idx" ON "reports" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "signal_property_idx" ON "signals" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "signal_type_idx" ON "signals" USING btree ("signal_type");--> statement-breakpoint
CREATE INDEX "signal_source_idx" ON "signals" USING btree ("source");--> statement-breakpoint
CREATE INDEX "signal_event_date_idx" ON "signals" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "signal_severity_idx" ON "signals" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "signal_is_active_idx" ON "signals" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "signal_external_id_idx" ON "signals" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "attachment_task_idx" ON "task_attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "comment_task_idx" ON "task_comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_property_idx" ON "tasks" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "task_org_idx" ON "tasks" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "task_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_assignee_idx" ON "tasks" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "task_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "task_deleted_at_idx" ON "tasks" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "user_org_idx" ON "users" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "user_deleted_at_idx" ON "users" USING btree ("deleted_at");