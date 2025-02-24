import { PartialType } from '@nestjs/mapped-types';
import { UserSignUpDto } from './user-signup.dto';
export class UpdateProfileDto extends PartialType(UserSignUpDto) {}
