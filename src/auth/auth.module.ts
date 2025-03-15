import { Logger, Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/models/user.model';
import { AuthController } from './controllers/auth.controller';
import { EmailService } from './services/email.service';
import {TwoFactorAuthService} from './services/twoFactorAuth.service'
import { JwtStrategy } from './strategies/jwt.strategy';
import {PassportModule} from '@nestjs/passport'
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    
    SequelizeModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    }),

  ],
  controllers: [AuthController],
  providers: [
    AuthService, PasswordService,
    JwtStrategy,EmailService,TwoFactorAuthService
  ],
  exports: [
    AuthService,PasswordService, 
    EmailService,TwoFactorAuthService,
    JwtModule,JwtStrategy], 
})
export class AuthModule {}
