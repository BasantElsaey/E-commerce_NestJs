import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: 'Old password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Old password must not exceed 20 characters' })
  oldPassword: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(20, { message: 'New password must not exceed 20 characters' })
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, {
    message: 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;

  @IsString()
  @MinLength(6, { message: 'Confirm password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Confirm password must not exceed 20 characters' })
  confirmNewPassword: string;
}
