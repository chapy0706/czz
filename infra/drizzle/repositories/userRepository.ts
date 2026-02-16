// infra/drizzle/repositories/userRepository.ts
import type {
	AuthUserId,
	NewUser,
	User,
	UserId,
} from "@czz/domain/entities/user";
import type { UserRepository } from "@czz/domain/repositories/userRepository";
import { eq } from "drizzle-orm";

import { db } from "../db";
import { users } from "../schema";

export class DrizzleUserRepository implements UserRepository {
	async findByAuthUserId(authUserId: AuthUserId): Promise<User | null> {
		const rows = await db
			.select()
			.from(users)
			.where(eq(users.authUserId, authUserId));
		const row = rows[0];
		if (!row) return null;
		return toUser(row);
	}
	async create(input: NewUser): Promise<User> {
		const values = {
			id: input.id,
			authUserId: input.authUserId,
			displayName: input.displayName,
			role: input.role,
		} as typeof users.$inferInsert;
		const inserted = await db.insert(users).values(values).returning();
		const row = inserted[0];
		return toUser(row);
	}
	async findById(id: UserId): Promise<User | null> {
		const rows = await db.select().from(users).where(eq(users.id, id));
		const row = rows[0];
		if (!row) return null;

		return toUser(row);
	}
}

function toUser(row: typeof users.$inferSelect): User {
	return {
		id: row.id,
		authUserId: row.authUserId,
		displayName: row.displayName,
		role: row.role === 1 ? 1 : 0,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}
