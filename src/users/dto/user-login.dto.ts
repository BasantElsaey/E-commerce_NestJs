import {IsNotEmpty,MinLength,IsEmail} from 'class-validator'

export class UserLoginDto {

    @IsNotEmpty( {message : 'Email is required'} )
    @IsEmail({}, {message : 'Please enter a valid email'} )
    email: string;

    @IsNotEmpty( {message : 'Password is required'} )
    @MinLength(6,{message : 'Password must be at least 6 characters'})
    password: string;
}