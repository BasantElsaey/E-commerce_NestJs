import {IsNotEmpty,MinLength,IsEmail,IsString,MaxLength,Matches} from 'class-validator'

export class UserLoginDto {

    @IsNotEmpty( {message : 'Email is required'} )
    @IsEmail({}, {message : 'Please enter a valid email'} )
    email: string;


      @IsNotEmpty( {message : 'Password is required'} )
      @IsString()
      @MinLength(6, { message: 'Password must be at least 6 characters long' })
      @MaxLength(20, { message: 'Password must not exceed 20 characters' })
      @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      })
    password: string;
}