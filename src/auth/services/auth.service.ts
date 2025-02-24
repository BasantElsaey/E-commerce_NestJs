import { CreateAuthDto } from '../dto/create-auth.dto';
import { UpdateAuthDto } from '../dto/update-auth.dto';
import { 
  Injectable, UnauthorizedException, 
  BadRequestException, NotFoundException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../users/models/user.model';
import { JwtService } from '@nestjs/jwt';
import { UserSignUpDto } from '../dto/user-signup.dto';
import { PasswordService } from './password.service';
import { UserLoginDto } from '../dto/user-login.dto';
import { EmailService } from './email.service';
import { omit } from 'lodash';
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { UpdateProfileDto } from '../dto/update-profile.dto';


@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService, 
    private readonly emailService: EmailService
  ) {}

  /**
   * Signup
   * Login
   * Logout
   * Change Password
   * Forgot Password
   * Reset Password
   * Verify Email
   * Get Profile
   * Update Profile
   * Delete Profile
   * Two-Factor Authentication
   * 
   */

  async signup(userSignUpDto: UserSignUpDto): Promise<{ user: Partial<User>, message: string }> {
    const userExists = await this.emailService.findUserByEmail(userSignUpDto.email);
    if (userExists) {
        throw new BadRequestException('User already exists');
      }
  
      userSignUpDto.password = await this.passwordService.hashPassword(userSignUpDto.password);
  
      let createdUser = await this.userModel.create(userSignUpDto as any);
  
      if (!createdUser) {
        throw new BadRequestException('Failed to create user');
      }
      // const userWithoutPassword = createdUser.get({ plain: true }) as any;
     
    // // check if password exists before deleting
    //  if (userWithoutPassword.password) {
    //   delete userWithoutPassword.password;
    //  }
    const userWithoutSensitiveData = omit(createdUser.get({ plain: true }), [
      'password', 
      'refreshToken', 
      'twoFactorSecret', 
      'passwordResetToken', 
      'passwordResetExpires'
  ]);
    
     return { user: userWithoutSensitiveData, message: 'User registered successfully, please verify your email' };
  }

    async login(userLoginDto: UserLoginDto): 
    Promise<{ accessToken: string; refreshToken: string, message: string }> {
       const userExists = await this.userModel.findOne({ 
        where: { email: userLoginDto.email },
        // attributes: { include : ['password'] }
      });
       if (!userExists) {
        throw new BadRequestException('User does not exist');
       }
       const matchPassword = await this.passwordService.comparePassword(userLoginDto.password, userExists.password);
       if (!matchPassword) {
        throw new BadRequestException('Invalid Credentials');
       }

      const { accessToken, refreshToken } = await this.generateTokens(userExists);
      // const accessToken = this.jwtService.sign({ id: userExists.id,email: userExists.email });
      // const refreshToken = this.jwtService.sign({ id: userExists.id }, 
      //   { expiresIn: process.env.JWT_EXPIRES_IN_REFRESH_TOKEN });

      //   // hash the refresh token and save it to the database
      //   const hashedRefreshToken = await this.passwordService.hashPassword(refreshToken);
      //   userExists.refreshToken = hashedRefreshToken;

        await userExists.save();

      return { accessToken, refreshToken,message: 'Login successful' };
    }

  // generate token
  async generateTokens(user: User ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwtService.sign({ id: user.id, email: user.email });
    const refreshToken = this.jwtService.sign(
      { id: user.id }, { expiresIn: process.env.JWT_EXPIRES_IN_REFRESH_TOKEN }
    );

    user.refreshToken = await this.passwordService.hashPassword(refreshToken);
    await user.save();

    return { accessToken, refreshToken };
  }

  // refresh token
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = this.jwtService.verify(refreshToken);
    const user = await this.userModel.findByPk(payload.id);
    if (!user || !(await this.passwordService.compareRefreshTokens(refreshToken, user.refreshToken))) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.generateTokens(user);
  }

  // logout 
  async logout(userId: number): Promise<{ message: string }>{
    await this.userModel.update(
      { refreshToken: await this.passwordService.hashRefreshToken('') },
      { where: { id: userId } }
    );
    return { message: 'Logged out successfully' };
  }

  // get profile
  async getProfile(user: { id: number }): Promise<Partial<User>> {
    const userProfile = await this.userModel.findByPk(user.id, {
      attributes: { exclude: ['password', 'refreshToken', 'twoFactorSecret', 'passwordResetToken', 'passwordResetExpires'] } // 🔥 اخفاء الحقول الحساسة
    });
  
    if (!userProfile) {
      throw new BadRequestException('User not found');
    }
  
    return userProfile;
  }
  

  // update profile
  async updateProfile(userId: number, updateUserDto: UpdateProfileDto): Promise<{ user: Partial<User>, message: string }> {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found'); 

    if (updateUserDto.password) {
        updateUserDto.password = await this.passwordService.hashPassword(updateUserDto.password);
    }

    await user.update(updateUserDto);

    const updatedUser = user.get({ plain: true }) as any;

    delete updatedUser.password;
    delete updatedUser.refreshToken;
    delete updatedUser.twoFactorSecret;
    delete updatedUser.passwordResetToken;
    delete updatedUser.passwordResetExpires;

    return { user: updatedUser, message: 'Profile updated successfully' };
}



  // delete profile
  async deleteProfile(userId: number) {
    await this.userModel.destroy({ where: { id: userId } });
    return { message: 'Profile deleted successfully' };
  }

  // Change Password 
  async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await this.passwordService.comparePassword(oldPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Incorrect old password');

    user.password = await this.passwordService.hashPassword(newPassword);
    await user.save();

    return { message: 'Password changed successfully' };
}

// Forgot Password 
async forgotPassword(email: string): Promise<{ message: string }> {
  const user = await this.emailService.findUserByEmail(email);
  if (!user) throw new NotFoundException('User not found');

  const resetToken = this.jwtService.sign(
    { id: user.id }, 
    { expiresIn: process.env.JWT_EXPIRES_IN });

  await this.emailService.sendPasswordResetEmail(resetToken);

  return { message: 'Password reset link sent to email' };
}

// reset password
async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  let payload;
  try {
      payload = this.jwtService.verify(token);
  } catch (error) {
      throw new UnauthorizedException('Invalid or expired reset token');
  }

  const user = await this.userModel.findByPk(payload.id);
  if (!user) throw new NotFoundException('User not found');

  user.password = await this.passwordService.hashPassword(newPassword);
  await user.save();

  return { message: 'Password has been reset successfully' };
}

// verify email
async verifyEmail(token: string): Promise<{ message: string }> {
  let payload;
  try {
      payload = this.jwtService.verify(token);
  } catch (error) {
      throw new UnauthorizedException('Invalid or expired verification token');
  }

  const user = await this.userModel.findByPk(payload.id);
  if (!user) throw new NotFoundException('User not found');

  user.isEmailVerified = true;
  await user.save();

  return { message: 'Email has been verified successfully' };
}



  
  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  
}
