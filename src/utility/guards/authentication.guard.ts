import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // reject if user is not authenticated
    if (!request.currentUser) {
      throw new UnauthorizedException('Authentication required');
    }

    return true;
  }
}
