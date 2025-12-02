// packages/domain/src/repositories/userRepository.ts

import type { NewUser, User, UserId } from "../entities/user";

export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(input: NewUser): Promise<User>;
}
