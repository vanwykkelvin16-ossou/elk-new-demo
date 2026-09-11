import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
export const entities = sqliteTable("entities", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  data: text("data").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  role: text("role").notNull().default("member"),
  membership: text("membership").notNull().default("inactive"),
  expires: text("expires"),
  disabled: integer("disabled").notNull().default(0),
  createdAt: text("created_at").notNull(),
});
export const claims = sqliteTable(
  "claims",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    voucherId: text("voucher_id").notNull(),
    code: text("code").notNull(),
    status: text("status").notNull().default("available"),
    createdAt: text("created_at").notNull(),
    redeemedAt: text("redeemed_at"),
  },
  (t) => [
    uniqueIndex("claim_once").on(t.userId, t.voucherId),
    uniqueIndex("claim_code").on(t.code),
  ],
);
export const registrations = sqliteTable(
  "registrations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    eventId: text("event_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [uniqueIndex("registration_once").on(t.userId, t.eventId)],
);
export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  userId: text("user_id"),
  data: text("data").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at").notNull(),
});
export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  data: text("data").notNull(),
});
export const audit = sqliteTable("audit", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  createdAt: text("created_at").notNull(),
});
