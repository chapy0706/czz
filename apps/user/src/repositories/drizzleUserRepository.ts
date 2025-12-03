// apps/user/src/repositories/drizzleUserRepository.ts

import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users } from "../../../../infra/drizzle/schema";

import type {
  AuthUserId,
  NewUser,
  User,
  UserRoleFlag,
} from "@czz/domain/entities/user";
import type { UserRepository } from "@czz/domain/repositories/userRepository";

// Drizzle が推論した型をローカル alias にしておく
type UserRow = typeof users.$inferSelect;
type UserInsert = typeof users.$inferInsert;

function toDomainUser(row: UserRow): User {
  return {
    id: row.id,
    authUserId: row.authUserId,
    displayName: row.displayName,
    role: row.role as UserRoleFlag,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return toDomainUser(row);
  }

  async findByAuthUserId(authUserId: AuthUserId): Promise<User | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    return toDomainUser(row);
  }

  async create(input: NewUser): Promise<User> {
    // createdAt / updatedAt は DB 側の defaultNow に任せる
    const [row] = await db
      .insert(users)
      .values({
        authUserId: input.authUserId,
        displayName: input.displayName,
        role: input.role,
        // createdAt / updatedAt は schema 側の defaultNow に任せる
      } as UserInsert)
      .returning();

    return toDomainUser(row);
  }
}
