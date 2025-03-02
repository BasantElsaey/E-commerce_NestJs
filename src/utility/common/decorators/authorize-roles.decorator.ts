import { SetMetadata } from '@nestjs/common';
import { Roles } from '../enums/user-roles.enum';

export const AuthorizeRoles = (...roles: Roles[]) => SetMetadata('allowedRoles', roles);
