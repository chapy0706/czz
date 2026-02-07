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
	findByAuthUserId(authUserId: AuthUserId): Promise<User | null> {
		throw new Error("Method not implemented.");
	}
	create(input: NewUser): Promise<User> {
		throw new Error("Method not implemented.");
	}
	async findById(id: UserId): Promise<User | null> {
		const rows = await db.select().from(users).where(eq(users.id, id));
		const row = rows[0];
		if (!row) return null;

		return {
			id: row.id,
			authUserId: row.authUserId,
			displayName: row.displayName,
			role: row.role === 1 ? 1 : 0,
			createdAt: row.createdAt,
			updatedAt: row.updatedAt,
		};
	}
}
