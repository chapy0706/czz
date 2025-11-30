// infra/drizzle/schema.ts

import { relations } from "drizzle-orm";
import {
    jsonb,
    pgTable,
    smallint,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

/**
 * users テーブル
 *
 * - id: UUID 主キー
 * - auth_user_id: Supabase など外部認証のユーザーID（任意）
 * - display_name: 表示名
 * - role: 0 = player, 1 = admin
 * - created_at: 作成日時
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: text("auth_user_id"),
  displayName: text("display_name").notNull(),
  role: smallint("role").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * users と他テーブルのリレーション定義（型用）
 */
export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  results: many(results),
}));

/**
 * tasks テーブル
 *
 * - id: UUID 主キー
 * - title: 課題タイトル
 * - description: 課題説明
 * - dsl_program: DSL プログラム（模範解答）を JSONB で保存
 * - test_cases: テストケース群を JSONB で保存
 * - is_published: 0 = 非公開, 1 = 公開
 * - created_by_user_id: 作成者（users.id）
 * - created_at, updated_at: 作成日時・更新日時
 */
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dslProgram: jsonb("dsl_program").notNull(),
  testCases: jsonb("test_cases").notNull(),
  isPublished: smallint("is_published").notNull().default(0),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * tasks のリレーション
 */
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  author: one(users, {
    fields: [tasks.createdByUserId],
    references: [users.id],
  }),
  results: many(results),
}));

/**
 * results テーブル
 *
 * - id: UUID 主キー
 * - user_id: users.id
 * - task_id: tasks.id
 * - submitted_program: ユーザーが実行した DSL プログラム(JSONB)
 * - result_status: 0 = failure, 1 = success
 * - created_at: 実行日時
 */
export const results = pgTable("results", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id),
  submittedProgram: jsonb("submitted_program").notNull(),
  resultStatus: smallint("result_status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * results のリレーション
 */
export const resultsRelations = relations(results, ({ one }) => ({
  user: one(users, {
    fields: [results.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [results.taskId],
    references: [tasks.id],
  }),
}));
