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

  async sendPasswordResetEmail(email: string): Promise<{ message: string }> {
    try {
      const user = await this.findUserByEmail(email);
      if (!user) throw new NotFoundException('User not found');

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();

      // Create reset URL
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

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
        subject: 'Password Reset Request',
        html: `<p>You requested a password reset. Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
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
