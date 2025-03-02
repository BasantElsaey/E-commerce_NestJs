import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from 'src/users/models/user.model';
import { Roles } from 'src/utility/common/enums/user-roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the required roles from metadata
    const requiredRoles = this.reflector.get<Roles[]>('allowedRoles', context.getHandler());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // If no roles are required, allow access
    }

    //  Get user from request
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    console.log('🔍 User from request:', user);

    //  Ensure the user and their roles exist
    if (!user) {
      throw new ForbiddenException('Access denied: User not found.');
    }

    if (!user.roles || !Array.isArray(user.roles)) {
      console.log('🔍 User roles:', user.roles);
      throw new ForbiddenException('Access denied: No valid roles found.');
    }

    //  Check if user has at least one required role
    const hasRole = user.roles.some((role) => requiredRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Access denied: User role is not allowed.');
    }

    return true; 
  }
}
