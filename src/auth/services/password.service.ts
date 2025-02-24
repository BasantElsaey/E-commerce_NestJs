import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/models/user.model';

@Injectable()
export class PasswordService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashRefreshToken(refreshToken: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(refreshToken, salt);
  }

  async compareRefreshTokens(refreshToken: string, hashedRefreshToken: string):
   Promise<boolean> {
    return await bcrypt.compare(refreshToken, hashedRefreshToken);
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new BadRequestException('User not found');
    
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) throw new BadRequestException('Incorrect old password');
    
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();
    return { message: 'Password changed successfully' };
  }
}
