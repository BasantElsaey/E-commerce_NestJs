import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/models/user.model';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {}

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userModel.findOne({ where: { email } });
    } catch (error) {
      throw new InternalServerErrorException('Database error while searching for user.');
    }
  }
  
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<{ message: string }> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) throw new NotFoundException('User not found');

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      // Create reset URL
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
      // Configure Nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
          
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: '🔐 RESET YOUR PASSWORD - E-commerce NestJs',
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 40px; text-align: center;">
        <div style="background-color:rgb(15, 11, 11); padding: 20px; border-radius: 8px; max-width: 600px; margin: auto; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
      
        <div style="background-color: #0078D4; color: #ffffff; padding: 15px; font-size: 24px; font-weight: bold; border-radius: 8px 8px 0 0;">
        🔐 Reset Your Password
        </div>

   
      <div style="padding: 20px; text-align: left; font-size: 16px; color: #333;">
        <p style="margin: 0 0 15px;"><strong>Hello,</strong></p>
        <p style="margin: 0 0 15px;">We received a request to reset your password for your <strong>E-commerce NestJs</strong> account.</p>
        <p style="margin: 0 0 15px;">If you made this request, please click the button below to reset your password:</p>
 
        <br><br>
        send this link to reset password  ${resetUrl}
        <br><br>
        
        <p style="margin: 0 0 15px;">If you did not request a password reset, please ignore this email, and your account will remain secure.</p>
        <p style="margin: 0 0 15px;"><strong>Note: This link is valid for only 1 hour.</strong></p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">

        <p style="margin: 0 0 15px;">📧 <strong>Support Team - NestJS</strong></p>
        <p style="margin: 0;">💙 Thank you for using <strong>E-Commerce NestJS</strong>!</p>
      </div>


      <div style="background-color: #f4f4f4; padding: 10px; font-size: 14px; color: #666; border-radius: 0 0 8px 8px;">
        &copy; ${new Date().getFullYear()} E-Commerce NestJS | All Rights Reserved
      </div>
      
    </div>
  </div>
        `,
      };

      await transporter.sendMail(mailOptions);

      return { message: 'Password reset email sent successfully.' };
    } catch (error) {
      console.error('Error sending password reset email:', error.message);

      if (error instanceof NotFoundException) {
        throw error; // Re-throw 404 error
      }

      throw new InternalServerErrorException('Error sending password reset email. Please try again later.');
    }
  }
}
