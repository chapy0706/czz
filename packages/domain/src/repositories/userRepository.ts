// packages/domain/src/repositories/userRepository.ts

import type { AuthUserId, NewUser, User, UserId } from "../entities/user";

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByAuthUserId(authUserId: AuthUserId): Promise<User | null>;
  create(input: NewUser): Promise<User>;
}
