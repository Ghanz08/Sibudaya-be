import { SetMetadata } from '@nestjs/common';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const ROLES_KEY = 'roles';

/**
 * @Roles(Role.ADMIN, Role.SUPER_ADMIN)
 * Dekorator untuk menentukan role yang diizinkan mengakses sebuah endpoint.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
