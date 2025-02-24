import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common'; 
import { isArray } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/services/users.service';
import { User } from 'src/users/models/user.model';

declare global {
    namespace Express {
        interface Request {
            currentUser?: User;
        }
    }
}

@Injectable()
export class CurrentUserMiddleware implements NestMiddleware {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService
    ) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization || req.headers.Authorization;

        if (!authHeader || isArray(authHeader) || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        try {
            const token = authHeader.split(' ')[1];

            if (!token) {
                return next();
            }
                
            const { id } = <JwtPayload>this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET_KEY
            });

            const currentUser = await this.usersService.findOne(+id);

            if (currentUser) {
                req.currentUser = currentUser;
            }

            next();
        } catch (error) {
            next();
        }
    }
}

interface JwtPayload {
    id: string;
}
