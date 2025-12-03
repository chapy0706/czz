// packages/domain/src/entities/user.ts

export type UserId = string;
export type AuthUserId = string;

// 0: player, 1: admin
export type UserRoleFlag = 0 | 1;

export interface User {
  id: UserId;
  authUserId: AuthUserId | null;
  displayName: string;
  role: UserRoleFlag;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  authUserId: AuthUserId | null;
  displayName: string;
  role: UserRoleFlag;
}