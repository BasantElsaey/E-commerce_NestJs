import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../users/models/user.model';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';

/** Two Factor Authentication Steps
 * 1- Generate 2FA Secret and QR Code
 * 2- Enable 2FA
 * 3- Verify 2FA and Login
 * 4- Disable
 * 
 */
@Injectable()
export class TwoFactorAuthService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  // generate 2FA secret and qr code
  async generate2FASecret(userId: number): 
  Promise<{ secret: string; otpauthUrl: string; qrCode: string }> {
    const user = await this.userModel.findByPk(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const secret = speakeasy.generateSecret({ name: `MyApp (${user.email})` });
    user.twoFactorSecret = secret.base32;
    await user.save();

    return {
      secret: secret.base32,
      otpauthUrl: String(secret.otpauth_url),
      qrCode: await qrcode.toDataURL(String(secret.otpauth_url)),
    };
  }

  // enable 2FA after generating secret
  async enable2FA(userId: number, token: string): Promise<{ message: string }> {
      
    const user = await this.userModel.findByPk(userId);
    if (!user || !user.twoFactorSecret) throw new UnauthorizedException('2FA is not enabled for this user');

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
      digits : Number(process.env.TOTP_DIGITS)
    });

    if (!isValid) throw new UnauthorizedException('Invalid 2FA token');

    user.isTwoFactorEnabled = true;
    await user.save();

    return { message: '2FA has been enabled successfully' };
  }

  // login after 2FA
  async validate2FALogin(userId: number, token: string): Promise<{ message: string }> {
    const user = await this.userModel.findByPk(userId);
    if (!user || !user.isTwoFactorEnabled) throw new UnauthorizedException('2FA is not enabled for this user');

    const isValid = speakeasy.totp.verify({
      secret: String(user.twoFactorSecret),
      encoding: 'base32',
      token,
      window: 1,
      digits: Number(process.env.TOTP_DIGITS),
    });

    if (!isValid) throw new UnauthorizedException('Invalid 2FA token');

    return { message: '2FA login successful' };
  }


  async disable2FA(userId: number): Promise<{ message: string }> {
    const user = await this.userModel.findByPk(userId);
    if (!user || !user.isTwoFactorEnabled) throw new UnauthorizedException('2FA is not enabled for this user');

    user.twoFactorSecret = null;
    user.isTwoFactorEnabled = false;
    await user.save();

    return { message: '2FA has been disabled successfully' };
  }

}
