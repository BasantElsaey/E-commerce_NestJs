import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
// import { UsersController } from './controllers/users.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
      signOptions: {expiresIn:process.env.JWT_EXPIRES_IN},
    }),
],
  // controllers: [UsersController],
  providers: [UsersService],
  exports : [SequelizeModule, UsersService]
})
export class UsersModule {}
