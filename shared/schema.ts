import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { passwordSchema } from "./validation";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['agent', 'supervisor', 'admin', 'reviewer', 'observer']);

// Result status enum  
export const resultStatusEnum = pgEnum('result_status', ['pending', 'verified', 'flagged', 'rejected']);

// Submission channel enum
export const submissionChannelEnum = pgEnum('submission_channel', ['whatsapp', 'portal', 'ussd', 'sms', 'both']);

// Candidate category enum
export const candidateCategoryEnum = pgEnum('candidate_category', ['president', 'mp', 'councilor']);

// Complaint status enum
export const complaintStatusEnum = pgEnum('complaint_status', ['submitted', 'under_review', 'resolved', 'dismissed', 'escalated_to_mec', 'mec_investigating', 'mec_resolved']);

// Complaint priority enum
export const complaintPriorityEnum = pgEnum('complaint_priority', ['low', 'medium', 'high', 'urgent']);

// Complaint category enum
export const complaintCategoryEnum = pgEnum('complaint_category', ['voting_irregularity', 'result_dispute', 'procedural_violation', 'fraud_allegation', 'technical_issue', 'other']);

// Result source enum - to differentiate between internal vs MEC results
export const resultSourceEnum = pgEnum('result_source', ['internal', 'mec']);

// Notification type enum
export const notificationTypeEnum = pgEnum('notification_type', ['info', 'success', 'warning', 'error']);

// Notification category enum  
export const notificationCategoryEnum = pgEnum('notification_category', ['result_submission', 'complaint', 'verification', 'system', 'user_action']);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phone: varchar("phone").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  passwordHash: varchar("password_hash").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default('agent').notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  phoneVerified: boolean("phone_verified").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  lastLoginAt: timestamp("last_login_at"),
  lastProfileUpdate: timestamp("last_profile_update"),
  emailVerificationToken: varchar("email_verification_token"),
  phoneVerificationToken: varchar("phone_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  phoneVerificationExpiry: timestamp("phone_verification_expiry"),
  registrationChannel: submissionChannelEnum("registration_channel").default('portal'),
  currentSessionId: varchar("current_session_id"),
  sessionExpiry: timestamp("session_expiry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for user queries
  index("idx_users_email").on(table.email),
  index("idx_users_phone").on(table.phone),
  index("idx_users_role").on(table.role),
  index("idx_users_is_active").on(table.isActive),
  index("idx_users_last_login").on(table.lastLoginAt),
  index("idx_users_created_at").on(table.createdAt),
  // Composite indexes for common query patterns
  index("idx_users_role_active").on(table.role, table.isActive),
]);

// Constituencies table
export const constituencies = pgTable("constituencies", {
  id: varchar("id").primaryKey(), // e.g., "107"
  name: varchar("name").notNull(), // e.g., "LILONGWE CITY"
  code: varchar("code").unique().notNull(),
  district: varchar("district").notNull(),
  state: varchar("state").notNull(),
  totalVoters: integer("total_voters").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wards table
export const wards = pgTable("wards", {
  id: varchar("id").primaryKey(), // e.g., "10701"
  constituencyId: varchar("constituency_id").references(() => constituencies.id).notNull(),
  name: varchar("name").notNull(), // e.g., "MTANDIRE"
  code: varchar("code").unique().notNull(),
  totalVoters: integer("total_voters").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Centres table
export const centres = pgTable("centres", {
  id: varchar("id").primaryKey(), // e.g., "1070101"
  wardId: varchar("ward_id").references(() => wards.id).notNull(),
  name: varchar("name").notNull(), // e.g., "KANKODOLA L.E.A. SCHOOL"
  code: varchar("code").unique().notNull(),
  registeredVoters: integer("registered_voters").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Polling centers table (legacy - keeping for backward compatibility)
export const pollingCenters = pgTable("polling_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(),
  name: varchar("name").notNull(),
  constituency: varchar("constituency").notNull(),
  district: varchar("district").notNull(),
  state: varchar("state").notNull(),
  registeredVoters: integer("registered_voters").notNull(),
  centreId: varchar("centre_id").references(() => centres.id), // Link to new structure
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Political parties table
export const politicalParties = pgTable("political_parties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  abbreviation: varchar("abbreviation").unique(),
  color: varchar("color"), // Hex color code for UI
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  abbreviation: varchar("abbreviation").unique(), // For USSD quick submissions
  partyId: varchar("party_id").references(() => politicalParties.id),
  party: varchar("party").notNull(), // Keep for backward compatibility
  category: candidateCategoryEnum("category").notNull(),
  constituency: varchar("constituency"), // For MPs and Councilors
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Results table
export const results = pgTable("results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollingCenterId: varchar("polling_center_id").references(() => pollingCenters.id).notNull(),
  submittedBy: varchar("submitted_by").references(() => users.id).notNull(),
  verifiedBy: varchar("verified_by").references(() => users.id),
  category: candidateCategoryEnum("category").notNull(),

  // Presidential votes
  presidentialVotes: jsonb("presidential_votes"), // {candidateId: votes}

  // MP votes  
  mpVotes: jsonb("mp_votes"), // {candidateId: votes}

  // Councilor votes
  councilorVotes: jsonb("councilor_votes"), // {candidateId: votes}

  invalidVotes: integer("invalid_votes").notNull(),
  totalVotes: integer("total_votes").notNull(),
  status: resultStatusEnum("status").default('pending').notNull(),
  source: resultSourceEnum("source").default('internal').notNull(),
  submissionChannel: submissionChannelEnum("submission_channel").notNull(),
  comments: text("comments"),
  flaggedReason: text("flagged_reason"),
  documentMismatch: boolean("document_mismatch").default(false).notNull(),
  documentMismatchReason: text("document_mismatch_reason"),
  
  // Duplicate detection fields
  isDuplicate: boolean("is_duplicate").default(false).notNull(),
  duplicateGroupId: varchar("duplicate_group_id"), // Groups related duplicates together
  duplicateReason: text("duplicate_reason"), // Why it was flagged as duplicate
  relatedResultIds: text("related_result_ids").array(), // IDs of other duplicate results
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
}, (table) => [
  // Performance indexes for commonly queried fields
  index("idx_results_polling_center").on(table.pollingCenterId),
  index("idx_results_status").on(table.status),
  index("idx_results_created_at").on(table.createdAt),
  index("idx_results_submitted_by").on(table.submittedBy),
  index("idx_results_category").on(table.category),
  index("idx_results_source").on(table.source),
  index("idx_results_is_duplicate").on(table.isDuplicate),
  index("idx_results_duplicate_group").on(table.duplicateGroupId),
  // Composite indexes for common query patterns
  index("idx_results_status_created_at").on(table.status, table.createdAt),
  index("idx_results_polling_center_status").on(table.pollingCenterId, table.status),
  index("idx_results_duplicate_status").on(table.isDuplicate, table.status),
]);

// Result files table (for uploaded photos)
export const resultFiles = pgTable("result_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resultId: varchar("result_id").references(() => results.id).notNull(),
  fileName: varchar("file_name").notNull(),
  filePath: varchar("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(),
  entityType: varchar("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  // Performance indexes for audit log queries
  index("idx_audit_logs_user_id").on(table.userId),
  index("idx_audit_logs_created_at").on(table.createdAt),
  index("idx_audit_logs_entity_type").on(table.entityType),
  index("idx_audit_logs_entity_id").on(table.entityId),
  index("idx_audit_logs_action").on(table.action),
  // Composite index for user activity queries
  index("idx_audit_logs_user_created").on(table.userId, table.createdAt),
]);

// Complaints table
export const complaints = pgTable("complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submittedBy: varchar("submitted_by").references(() => users.id).notNull(),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  category: complaintCategoryEnum("category").notNull(),
  priority: complaintPriorityEnum("priority").default('medium').notNull(),
  status: complaintStatusEnum("status").default('submitted').notNull(),

  // Location references
  pollingCenterId: varchar("polling_center_id").references(() => pollingCenters.id),
  constituencyId: varchar("constituency_id").references(() => constituencies.id),
  wardId: varchar("ward_id").references(() => wards.id),

  // Affected result reference (if complaint is about a specific result)
  resultId: varchar("result_id").references(() => results.id),

  // Escalation fields
  escalatedToMec: boolean("escalated_to_mec").default(false).notNull(),
  escalatedBy: varchar("escalated_by").references(() => users.id),
  escalatedAt: timestamp("escalated_at"),
  escalationReason: text("escalation_reason"),
  mecReferenceNumber: varchar("mec_reference_number"),
  mecContactPerson: varchar("mec_contact_person"),
  mecFollowUpDate: timestamp("mec_follow_up_date"),
  mecResponse: text("mec_response"),
  mecResolutionDate: timestamp("mec_resolution_date"),

  // Additional details
  evidence: jsonb("evidence"), // Links to uploaded files/photos
  contactInfo: jsonb("contact_info"), // Phone, email for follow-up
  resolutionNotes: text("resolution_notes"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  // Performance indexes for complaint queries
  index("idx_complaints_status").on(table.status),
  index("idx_complaints_priority").on(table.priority),
  index("idx_complaints_submitted_by").on(table.submittedBy),
  index("idx_complaints_created_at").on(table.createdAt),
  index("idx_complaints_category").on(table.category),
  index("idx_complaints_polling_center").on(table.pollingCenterId),
  index("idx_complaints_escalated_to_mec").on(table.escalatedToMec),
  // Composite indexes for common query patterns
  index("idx_complaints_status_priority").on(table.status, table.priority),
  index("idx_complaints_submitted_created").on(table.submittedBy, table.createdAt),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  submittedResults: many(results, { relationName: "submittedBy" }),
  verifiedResults: many(results, { relationName: "verifiedBy" }),
  auditLogs: many(auditLogs),
  submittedComplaints: many(complaints, { relationName: "submittedBy" }),
  reviewedComplaints: many(complaints, { relationName: "reviewedBy" }),
}));

// New hierarchical relations
export const constituenciesRelations = relations(constituencies, ({ many }) => ({
  wards: many(wards),
}));

export const wardsRelations = relations(wards, ({ one, many }) => ({
  constituency: one(constituencies, {
    fields: [wards.constituencyId],
    references: [constituencies.id],
  }),
  centres: many(centres),
}));

export const centresRelations = relations(centres, ({ one, many }) => ({
  ward: one(wards, {
    fields: [centres.wardId],
    references: [wards.id],
  }),
  pollingCenters: many(pollingCenters),
}));

export const pollingCentersRelations = relations(pollingCenters, ({ one, many }) => ({
  centre: one(centres, {
    fields: [pollingCenters.centreId],
    references: [centres.id],
  }),
  results: many(results),
}));

// Political parties relations
export const politicalPartiesRelations = relations(politicalParties, ({ many }) => ({
  candidates: many(candidates),
}));

// Candidates relations
export const candidatesRelations = relations(candidates, ({ one }) => ({
  party: one(politicalParties, {
    fields: [candidates.partyId],
    references: [politicalParties.id],
  }),
}));

export const resultsRelations = relations(results, ({ one, many }) => ({
  pollingCenter: one(pollingCenters, {
    fields: [results.pollingCenterId],
    references: [pollingCenters.id],
  }),
  submitter: one(users, {
    fields: [results.submittedBy],
    references: [users.id],
    relationName: "submittedBy",
  }),
  verifier: one(users, {
    fields: [results.verifiedBy],
    references: [users.id],
    relationName: "verifiedBy",
  }),
  files: many(resultFiles),
}));

export const resultFilesRelations = relations(resultFiles, ({ one }) => ({
  result: one(results, {
    fields: [resultFiles.resultId],
    references: [results.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  submitter: one(users, {
    fields: [complaints.submittedBy],
    references: [users.id],
    relationName: "submittedBy",
  }),
  reviewer: one(users, {
    fields: [complaints.reviewedBy],
    references: [users.id],
    relationName: "reviewedBy",
  }),
  pollingCenter: one(pollingCenters, {
    fields: [complaints.pollingCenterId],
    references: [pollingCenters.id],
  }),
  constituency: one(constituencies, {
    fields: [complaints.constituencyId],
    references: [constituencies.id],
  }),
  ward: one(wards, {
    fields: [complaints.wardId],
    references: [wards.id],
  }),
  result: one(results, {
    fields: [complaints.resultId],
    references: [results.id],
  }),
}));

export const insertPoliticalPartySchema = createInsertSchema(politicalParties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  passwordHash: true,
  createdAt: true,
  updatedAt: true,
});

export const registerUserSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: passwordSchema,
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertConstituencySchema = createInsertSchema(constituencies).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertWardSchema = createInsertSchema(wards).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCentreSchema = createInsertSchema(centres).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPollingCenterSchema = createInsertSchema(pollingCenters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

export const insertResultSchema = createInsertSchema(results, {
  createdAt: true,
  updatedAt: true,
}).extend({
  presidentialVotes: z.record(z.number()).nullable().optional(),
  mpVotes: z.record(z.number()).nullable().optional(),
  councilorVotes: z.record(z.number()).nullable().optional(),
  totalVotes: z.number().optional(),
  submissionChannel: z.string().optional(),
}).omit({
  id: true,
  verifiedAt: true,
});

export const insertResultFileSchema = createInsertSchema(resultFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
  resolvedAt: true,
});

// USSD Sessions table for tracking multi-step interactions
export const ussdSessions = pgTable("ussd_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number").notNull(),
  sessionId: varchar("session_id").unique().notNull(),
  currentStep: varchar("current_step").notNull(),
  sessionData: jsonb("session_data").default('{}'),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Performance indexes for USSD session queries
  index("idx_ussd_sessions_phone_number").on(table.phoneNumber),
  index("idx_ussd_sessions_session_id").on(table.sessionId),
  index("idx_ussd_sessions_expires_at").on(table.expiresAt),
  index("idx_ussd_sessions_is_active").on(table.isActive),
  // Composite index for active session lookup by phone
  index("idx_ussd_sessions_phone_active").on(table.phoneNumber, table.isActive),
]);

// USSD Provider configurations
export const ussdProviders = pgTable("ussd_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  type: varchar("type").notNull(), // 'twilio', 'africas_talking', 'custom'
  isActive: boolean("is_active").default(true).notNull(),
  configuration: jsonb("configuration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp Provider configurations
export const whatsappProviders = pgTable("whatsapp_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  type: varchar("type").notNull(), // 'meta', 'wati', 'interakt', 'aisensy', 'twilio', 'infobip', 'custom'
  isActive: boolean("is_active").default(true).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(), // Only one primary provider
  configuration: jsonb("configuration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SMS Provider configurations
export const smsProviders = pgTable("sms_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").unique().notNull(),
  type: varchar("type").notNull(), // 'twilio', 'clickatell', 'messagebird', 'africas_talking', 'custom'
  isActive: boolean("is_active").default(true).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(), // Only one primary provider
  configuration: jsonb("configuration").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: notificationTypeEnum("type").notNull(),
  category: notificationCategoryEnum("category").notNull(),
  userId: varchar("user_id").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  relatedId: varchar("related_id"), // Optional ID of related entity (result, complaint, etc.)
  actionUrl: varchar("action_url"), // Optional URL for action
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = typeof users.$inferInsert;
export type Constituency = typeof constituencies.$inferSelect;
export type InsertConstituency = typeof constituencies.$inferInsert;
export type Ward = typeof wards.$inferSelect;
export type InsertWard = typeof wards.$inferInsert;
export type Centre = typeof centres.$inferSelect;
export type InsertCentre = typeof centres.$inferInsert;
export type PollingCenter = typeof pollingCenters.$inferSelect;
export type InsertPollingCenter = typeof pollingCenters.$inferInsert;
export type PoliticalParty = typeof politicalParties.$inferSelect;
export type InsertPoliticalParty = typeof politicalParties.$inferInsert;
export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;
export type Result = typeof results.$inferSelect;
export type InsertResult = typeof results.$inferInsert;
export type ResultFile = typeof resultFiles.$inferSelect;
export type InsertResultFile = typeof resultFiles.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
export type UssdSession = typeof ussdSessions.$inferSelect;
export type UssdProvider = typeof ussdProviders.$inferSelect;
export type WhatsappProvider = typeof whatsappProviders.$inferSelect;
export type SmsProvider = typeof smsProviders.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type InsertComplaint = typeof complaints.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// Extended types with relations
export type ResultWithRelations = Result & {
  pollingCenter: PollingCenter;
  submitter: User;
  verifier?: User;
  files: ResultFile[];
};

export type UserRole = 'agent' | 'supervisor' | 'admin' | 'observer';
export type ResultStatus = 'pending' | 'verified' | 'flagged' | 'rejected';
export type SubmissionChannel = 'whatsapp' | 'portal' | 'ussd' | 'sms' | 'both';
export type CandidateCategory = 'president' | 'mp' | 'councilor';
export type ComplaintStatus = 'submitted' | 'under_review' | 'resolved' | 'dismissed';
export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ComplaintCategory = 'voting_irregularity' | 'result_dispute' | 'procedural_violation' | 'fraud_allegation' | 'technical_issue' | 'other';