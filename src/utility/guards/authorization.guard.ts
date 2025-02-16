// import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, mixin } from "@nestjs/common";
// import { Reflector } from "@nestjs/core";
// import { Roles } from "src/utility/common/user-roles.enum";


// @Injectable()
// export class AuthorizationGuard implements CanActivate {

//     constructor(private reflector: Reflector) {}

//     canActivate(context: ExecutionContext): boolean {
//         const allowedRoles = this.reflector.get<string[]>('allowedRoles', context.getHandler()) || [];

//         const request = context.switchToHttp().getRequest();

//         // check if user is authenticated
//         if (!request?.currentUser || !request.currentUser?.roles) {
//             throw new UnauthorizedException('Invalid or missing token');
//         }

//         // admin has all permissions
//         if (request.currentUser.roles.includes(Roles.ADMIN)) {
//             return true;
//         }

//         // check if the user has the required role
//         const hasRole = request.currentUser.roles.some((role: string) =>
//             allowedRoles.includes(role)
//         );

//         if (!hasRole) {
//             throw new UnauthorizedException('You are not authorized');
//         }

//         return true;
//     }
// }


import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, mixin } from "@nestjs/common";
import { Roles } from "src/utility/common/user-roles.enum";

export const AuthorizationGuard = (allowedRoles: string[]) => {
    class RolesGuardMixin implements CanActivate {
        canActivate(context: ExecutionContext): boolean {
            const request = context.switchToHttp().getRequest();

            if (!request?.currentUser || !request.currentUser?.roles) {
                throw new UnauthorizedException('Invalid or missing token');
            }

            if (request.currentUser.roles.includes(Roles.ADMIN)) {
                return true;
            }

            const hasRole = request.currentUser.roles.some((role: string) =>
                allowedRoles.includes(role)
            );

            if (!hasRole) {
                throw new UnauthorizedException('You are not authorized');
            }

            return true;
        }
    }

    return mixin(RolesGuardMixin);
};
