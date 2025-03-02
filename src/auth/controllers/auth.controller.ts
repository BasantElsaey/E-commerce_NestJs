import { Controller, Get, Post, Body, 
  Patch, Param, Delete,UseGuards,Req, UnauthorizedException, 
  Query} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { CreateAuthDto } from '../dto/create-auth.dto';
import { UpdateAuthDto } from '../dto/update-auth.dto';
import { UserSignUpDto } from '../dto/user-signup.dto';
import { UserLoginDto } from '../dto/user-login.dto';
import { User } from 'src/users/models/user.model';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from '../services/password.service';
import { EmailService } from '../services/email.service';
import { TwoFactorAuthService } from '../services/twoFactorAuth.service'
import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import {UpdateProfileDto} from '../dto/update-profile.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
    private readonly twoFactorAuthService: TwoFactorAuthService,


    ) {}
  
 // Signup
  @Post('/signup')
  async signup(@Body() userSignUpDto: UserSignUpDto): Promise<{ user: Partial<User>, message: string }> {
    return await this.authService.signup(userSignUpDto);
  }

  // Login
  @Post('/login') 
  async login(@Body() userLoginDto: UserLoginDto): 
  Promise<{ refreshToken: string, accessToken: string, message: string }> {
   const user =  await this.authService.login(userLoginDto);
   return { refreshToken: user.refreshToken, accessToken: user.accessToken,
     message : 'Login successful' };
  }

  // Logout 
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user : User): Promise<{ message: string }> {
    return await this.authService.logout(user.id);
  }

// Change Password
@Patch('change-password')
@UseGuards(JwtAuthGuard)
async changePassword(@CurrentUser() user : User, @Body() changePasswordDto:ChangePasswordDto ) 
: Promise<{ message: string }> {
    return await this.authService
    .changePassword(user.id, changePasswordDto.oldPassword, changePasswordDto.newPassword, changePasswordDto.confirmNewPassword);
}

// Forgot Password
@Post('forgot-password')
@UseGuards(JwtAuthGuard)
async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) : Promise<{ message: string }> {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

// reset password

@Post('reset-password')
// @UseGuards(JwtAuthGuard)
async resetPassword(@Body() resetPasswordDto: ResetPasswordDto,@Query('token') token: string) : Promise<{ message: string }> {
    return await this.authService.resetPassword(token,resetPasswordDto.newPassword,resetPasswordDto.confirmNewPassword);
}

// verify email
@Post('verify-email')
async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) : Promise<{ message: string }> {
    return await this.authService.verifyEmail(verifyEmailDto.token);
}

// get profile
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: { id: number }) {
  return await this.authService.getProfile(user);
}



// update profile
@Patch('profile')
@UseGuards(JwtAuthGuard)
async updateProfile(@CurrentUser() user: User, @Body() updateProfileDto: UpdateProfileDto): Promise<{ user: Partial<User>, message: string }> {
    return await this.authService.updateProfile(user.id, updateProfileDto);
}


// delete profile
@Delete('profile')
@UseGuards(JwtAuthGuard)
async deleteProfile(@CurrentUser() user : User) : Promise<{ message: string }> {
    return await this.authService.deleteProfile(user.id);
}

// enable 2FA
@Post('enable-2fa')
@UseGuards(JwtAuthGuard)
async enable2FA(@CurrentUser() user : User, @Body() token: string) : Promise<{ message: string }> {
    return await this.twoFactorAuthService.enable2FA(user.id, token);
}

// verify 2FA
@Post('verify-2fa')
@UseGuards(JwtAuthGuard)
async validate2FALogin(@CurrentUser() user : User, @Body() token: string) : Promise<{ message: string }> {
    return await this.twoFactorAuthService.validate2FALogin(user.id, token,);
}

// disable 2FA
@Post('disable-2fa')
@UseGuards(JwtAuthGuard)
async disable2FA(@CurrentUser() user : User) : Promise<{ message: string }> {
    return await this.twoFactorAuthService.disable2FA(user.id);
}



  @Post()
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.create(createAuthDto);
  }

  @Get()
  findAll() {
    return this.authService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authService.remove(+id);
  }


  // @Post('logout')
  // async logout(@Req() req: Request) {
  //   return this.authService.logout(req.user['id']);
  // }

  // @Patch('change-password')
  // @UseGuards(JwtAuthGuard)
  // async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req: Request) {
  //   return this.passwordService.changePassword(req.user['id'], changePasswordDto);
  // }

  // @Post('forgot-password')
  // async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
  //   return this.passwordService.forgotPassword(forgotPasswordDto.email);
  // }

  // @Post('reset-password')
  // async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
  //   return this.passwordService.resetPassword(resetPasswordDto);
  // }

  // @Post('verify-email')
  // async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
  //   return this.emailService.verifyEmail(verifyEmailDto.token);
  // }

  // @Get('profile')
  // @UseGuards(JwtAuthGuard)
  // async getProfile(@Req() req: Request) {
  //   return this.authService.getProfile(req.user['id']);
  // }

  // @Patch('update-profile')
  // @UseGuards(JwtAuthGuard)
  // async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Req() req: Request) {
  //   return this.authService.updateProfile(req.user['id'], updateProfileDto);
  // }

  // @Delete('delete-profile')
  // @UseGuards(JwtAuthGuard)
  // async deleteProfile(@Req() req: Request) {
  //   return this.authService.deleteProfile(req.user['id']);
  // }

  // @Post('enable-2fa')
  // @UseGuards(JwtAuthGuard)
  // async enableTwoFactorAuth(@Req() req: Request) {
  //   return this.twoFactorAuthService.enableTwoFactorAuth(req.user['id']);
  // }

  // @Post('verify-2fa')
  // @UseGuards(JwtAuthGuard)
  // async verifyTwoFactorAuth(@Body() body: { token: string }, @Req() req: Request) {
  //   return this.twoFactorAuthService.verifyTwoFactorAuth(req.user['id'], body.token);
  // }
}
