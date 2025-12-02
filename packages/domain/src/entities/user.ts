// packages/domain/src/entities/user.ts

export type UserId = string;

// 0: player, 1: admin
export type UserRoleFlag = 0 | 1;

export interface User {
  id: UserId;
  name: string;
  email: string;
  role: UserRoleFlag;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewUser {
  name: string;
  email: string;
  role: UserRoleFlag;
}