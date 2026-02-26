import {
  pgTable,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
  real,
  text,
  jsonb,
  index,
  foreignKey,
  pgEnum,
  date,
  unique,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "viewer",
  "dashboard_ops",
]);

export const propertyTypeEnum = pgEnum("property_type", [
  "residential",
  "commercial",
  "mixed_use",
  "industrial",
  "other",
]);

export const signalTypeEnum = pgEnum("signal_type", [
  "permit",
  "violation",
  "complaint",
  "hazard",
  "valuation",
  "condition",
]);

export const signalSourceEnum = pgEnum("signal_source", [
  "nyc_open_data",
  "nearmap",
  "eagleview",
  "lightbox",
  "attom",
  "perilpulse",
  "locatenyc",
  "manual",
]);

export const severityEnum = pgEnum("severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const conditionProviderEnum = pgEnum("condition_provider", [
  "nearmap",
  "eagleview",
]);

export const conditionEnum = pgEnum("condition", [
  "good",
  "fair",
  "poor",
  "critical",
]);

export const taskCategoryEnum = pgEnum("task_category", [
  "inspection",
  "violation_followup",
  "vendor_quote",
  "legal",
  "maintenance",
  "other",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "open",
  "in_progress",
  "blocked",
  "resolved",
  "closed",
]);

export const alertTypeEnum = pgEnum("alert_type", [
  "new_violation",
  "violation_resolved",
  "new_permit",
  "complaint_spike",
  "condition_change",
]);

export const alertChannelEnum = pgEnum("alert_channel", ["in_app", "email"]);

export const reportTypeEnum = pgEnum("report_type", [
  "owner_pack",
  "insurance_packet",
]);

export const providerEnum = pgEnum("provider", [
  "nyc_open_data",
  "lightbox",
  "attom",
  "locatenyc",
  "nearmap",
  "eagleview",
  "perilpulse",
]);

export const ingestionStatusEnum = pgEnum("ingestion_status", [
  "pending",
  "running",
  "success",
  "failed",
]);

export const organizations = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    planTier: varchar("plan_tier", { length: 64 }).notNull().default("starter"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("org_name_idx").on(t.name),
    index("org_created_at_idx").on(t.createdAt),
    index("org_deleted_at_idx").on(t.deletedAt),
  ],
);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 128 }),
    lastName: varchar("last_name", { length: 128 }),
    role: userRoleEnum("role").notNull().default("viewer"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    resetPasswordToken: varchar("reset_password_token", { length: 255 }),
    resetPasswordExpiresAt: timestamp("reset_password_expires_at"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("user_email_idx").on(t.email),
    index("user_org_idx").on(t.organizationId),
    index("user_deleted_at_idx").on(t.deletedAt),
    unique("user_email_unique").on(t.email),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
    }),
  ],
);

export const properties = pgTable(
  "properties",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    name: varchar("name", { length: 255 }),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 128 }).notNull(),
    state: varchar("state", { length: 64 }).notNull(),
    zip: varchar("zip", { length: 16 }).notNull(),
    country: varchar("country", { length: 64 }).notNull().default("US"),
    bbl: varchar("bbl", { length: 32 }),
    bin: varchar("bin", { length: 16 }),
    block: varchar("block", { length: 16 }),
    lot: varchar("lot", { length: 16 }),
    latitude: real("latitude"),
    longitude: real("longitude"),
    propertyType: propertyTypeEnum("property_type").default("residential"),
    yearBuilt: integer("year_built"),
    floors: integer("floors"),
    units: integer("units"),
    riskScore: real("risk_score").default(0),
    riskScoreUpdatedAt: timestamp("risk_score_updated_at"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("property_org_idx").on(t.organizationId),
    index("property_bbl_idx").on(t.bbl),
    index("property_bin_idx").on(t.bin),
    index("property_city_state_idx").on(t.city, t.state),
    index("property_risk_score_idx").on(t.riskScore),
    index("property_deleted_at_idx").on(t.deletedAt),
    index("property_org_deleted_risk_idx").on(
      t.organizationId,
      t.deletedAt,
      t.riskScore,
    ),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
    }),
  ],
);

export const propertyIdentifiers = pgTable(
  "property_identifiers",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull(),
    provider: providerEnum("provider").notNull(),
    providerKey: varchar("provider_key", { length: 128 }).notNull(),
    providerValue: varchar("provider_value", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("prop_id_property_idx").on(t.propertyId),
    index("prop_id_provider_idx").on(t.provider),
    foreignKey({ columns: [t.propertyId], foreignColumns: [properties.id] }),
  ],
);

export const signals = pgTable(
  "signals",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull(),
    signalType: signalTypeEnum("signal_type").notNull(),
    source: signalSourceEnum("source").notNull(),
    eventDate: date("event_date"),
    status: varchar("status", { length: 64 }),
    severity: severityEnum("severity").default("low"),
    title: varchar("title", { length: 512 }),
    description: text("description"),
    rawPayload: jsonb("raw_payload"),
    normalizedFields: jsonb("normalized_fields"),
    externalId: varchar("external_id", { length: 255 }),
    isActive: boolean("is_active").notNull().default(true),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("signal_property_idx").on(t.propertyId),
    index("signal_type_idx").on(t.signalType),
    index("signal_source_idx").on(t.source),
    index("signal_event_date_idx").on(t.eventDate),
    index("signal_severity_idx").on(t.severity),
    index("signal_is_active_idx").on(t.isActive),
    index("signal_external_id_idx").on(t.externalId),
    foreignKey({ columns: [t.propertyId], foreignColumns: [properties.id] }),
  ],
);

export const conditionSnapshots = pgTable(
  "condition_snapshots",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull(),
    provider: conditionProviderEnum("provider").notNull(),
    snapshotDate: date("snapshot_date").notNull(),
    imageryUrl: varchar("imagery_url", { length: 2048 }),
    thumbnailUrl: varchar("thumbnail_url", { length: 2048 }),
    conditionOverall: conditionEnum("condition_overall"),
    roofCondition: conditionEnum("roof_condition"),
    exteriorCondition: conditionEnum("exterior_condition"),
    aiAttributes: jsonb("ai_attributes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("condition_property_idx").on(t.propertyId),
    index("condition_provider_idx").on(t.provider),
    index("condition_date_idx").on(t.snapshotDate),
    foreignKey({ columns: [t.propertyId], foreignColumns: [properties.id] }),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull(),
    organizationId: integer("organization_id").notNull(),
    signalId: integer("signal_id"),
    title: varchar("title", { length: 512 }).notNull(),
    description: text("description"),
    category: taskCategoryEnum("category").notNull().default("other"),
    priority: taskPriorityEnum("priority").notNull().default("normal"),
    status: taskStatusEnum("status").notNull().default("open"),
    assigneeId: integer("assignee_id"),
    dueDate: date("due_date"),
    createdBy: integer("created_by").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("task_property_idx").on(t.propertyId),
    index("task_org_idx").on(t.organizationId),
    index("task_status_idx").on(t.status),
    index("task_assignee_idx").on(t.assigneeId),
    index("task_due_date_idx").on(t.dueDate),
    index("task_deleted_at_idx").on(t.deletedAt),
    index("task_org_deleted_created_idx").on(
      t.organizationId,
      t.deletedAt,
      t.createdAt,
    ),
    index("task_org_status_deleted_idx").on(
      t.organizationId,
      t.status,
      t.deletedAt,
    ),
    foreignKey({ columns: [t.propertyId], foreignColumns: [properties.id] }),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
    }),
    foreignKey({ columns: [t.signalId], foreignColumns: [signals.id] }),
    foreignKey({ columns: [t.assigneeId], foreignColumns: [users.id] }),
    foreignKey({ columns: [t.createdBy], foreignColumns: [users.id] }),
  ],
);

export const taskComments = pgTable(
  "task_comments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id").notNull(),
    authorId: integer("author_id").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
    deletedAt: timestamp("deleted_at"),
  },
  (t) => [
    index("comment_task_idx").on(t.taskId),
    foreignKey({ columns: [t.taskId], foreignColumns: [tasks.id] }),
    foreignKey({ columns: [t.authorId], foreignColumns: [users.id] }),
  ],
);

export const taskAttachments = pgTable(
  "task_attachments",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id").notNull(),
    uploadedBy: integer("uploaded_by").notNull(),
    fileName: varchar("file_name", { length: 512 }).notNull(),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 128 }),
    storageUrl: varchar("storage_url", { length: 2048 }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("attachment_task_idx").on(t.taskId),
    foreignKey({ columns: [t.taskId], foreignColumns: [tasks.id] }),
    foreignKey({ columns: [t.uploadedBy], foreignColumns: [users.id] }),
  ],
);

export const alerts = pgTable(
  "alerts",
  {
    id: serial("id").primaryKey(),
    organizationId: integer("organization_id").notNull(),
    propertyId: integer("property_id").notNull(),
    signalId: integer("signal_id"),
    taskId: integer("task_id"),
    alertType: alertTypeEnum("alert_type").notNull(),
    severity: severityEnum("severity").notNull().default("low"),
    title: varchar("title", { length: 512 }).notNull(),
    body: text("body"),
    isRead: boolean("is_read").notNull().default(false),
    isDismissed: boolean("is_dismissed").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    readAt: timestamp("read_at"),
    dismissedAt: timestamp("dismissed_at"),
  },
  (t) => [
    index("alert_org_idx").on(t.organizationId),
    index("alert_property_idx").on(t.propertyId),
    index("alert_type_idx").on(t.alertType),
    index("alert_is_read_idx").on(t.isRead),
    index("alert_org_dismissed_created_idx").on(
      t.organizationId,
      t.dismissedAt,
      t.createdAt,
    ),
    index("alert_org_read_dismissed_idx").on(
      t.organizationId,
      t.isRead,
      t.dismissedAt,
    ),
    foreignKey({
      columns: [t.organizationId],
      foreignColumns: [organizations.id],
    }),
    foreignKey({ columns: [t.propertyId], foreignColumns: [properties.id] }),
    foreignKey({ columns: [t.signalId], foreignColumns: [signals.id] }),
    foreignKey({ columns: [t.taskId], foreignColumns: [tasks.id] }),
  ],
);

export const alertSubscriptions = pgTable(
  "alert_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    propertyId: integer("property_id"),
    alertType: alertTypeEnum("alert_type").notNull(),
    channel: alertChannelEnum("channel").notNull().default("in_app"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("sub_user_idx").on(t.userId),
    index("sub_property_idx").on(t.propertyId),
    foreignKey({ columns: [t.userId], foreignColumns: [users.id] }),
    foreignKey({ columns: [t.propertyId], foreignColumns: [properties.id] }),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: serial("id").primaryKey(),
    propertyId: integer("property_id").notNull(),
    generatedBy: integer("generated_by").notNull(),
    reportType: reportTypeEnum("report_type").notNull().default("owner_pack"),
    periodStart: date("period_start").notNull(),
    periodEnd: date("period_end").notNull(),
    storageUrl: varchar("storage_url", { length: 2048 }),
    fileName: varchar("file_name", { length: 512 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("report_property_idx").on(t.propertyId),
    index("report_generated_by_idx").on(t.generatedBy),
    foreignKey({ columns: [t.propertyId], foreignColumns: [properties.id] }),
    foreignKey({ columns: [t.generatedBy], foreignColumns: [users.id] }),
  ],
);

export const apiCache = pgTable(
  "api_cache",
  {
    id: serial("id").primaryKey(),
    provider: providerEnum("provider").notNull(),
    cacheKey: varchar("cache_key", { length: 512 }).notNull(),
    payload: jsonb("payload").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("cache_provider_key_idx").on(t.provider, t.cacheKey),
    index("cache_expires_at_idx").on(t.expiresAt),
    unique("cache_provider_key_unique").on(t.provider, t.cacheKey),
  ],
);

export const ingestionJobs = pgTable(
  "ingestion_jobs",
  {
    id: serial("id").primaryKey(),
    jobType: varchar("job_type", { length: 128 }).notNull(),
    propertyId: integer("property_id"),
    status: ingestionStatusEnum("status").notNull().default("pending"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    errorMessage: text("error_message"),
    resultSummary: jsonb("result_summary"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [
    index("job_type_idx").on(t.jobType),
    index("job_property_idx").on(t.propertyId),
    index("job_status_idx").on(t.status),
    index("job_created_at_idx").on(t.createdAt),
    foreignKey({ columns: [t.propertyId], foreignColumns: [properties.id] }),
  ],
);
