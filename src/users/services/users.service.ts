import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import { UserSignUpDto } from '../../auth/dto/user-signup.dto';
import { hash, compare } from 'bcrypt';
import { UserLoginDto } from '../../auth/dto/user-login.dto';
import { JwtService } from '@nestjs/jwt';
// import { RevokedToken } from './models/revoked-token.model';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private readonly userModel: typeof User,
  // @InjectModel(RevokedToken)
  //  private readonly revokedTokenModel: typeof RevokedToken,
  private readonly jwtService: JwtService
) {}


  async findAll(): Promise<User[]> {
    return await this.userModel.findAll(); // return all users
  }

  async findOne(id: number): Promise<User | null> {
    const user = await this.userModel.findByPk(id); // not needed to use find
    if(!user){
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // async update(id: number , updateUserDataDto: UserSignUpDto):
  // Promise<User> {  
  //   const user = await this.userModel.findByPk(id);
  //   if (!user) {
  //       throw new NotFoundException('User not found');
  //   }

  //   // check if email already exists
  //   if (user.email !== updateUserDataDto.email) {
  //       const existingUser = await this.findUserByEmail
  //       (updateUserDataDto.email);
  //       if (existingUser && existingUser.id !== id) {
  //           throw new BadRequestException('Email already in use');
  //       }
  //   }

  //   user.name = updateUserDataDto.name;
  //   user.email = updateUserDataDto.email;

  //   if (updateUserDataDto.password) {
  //       user.password = await hash(updateUserDataDto.password, 10);
  //   } 
  //   const userWithoutPassword = user.get({ plain: true }) as any;
   
  // // check if password exists before deleting
  //  if (userWithoutPassword.password) {
  //   delete userWithoutPassword.password;
  //  }
  //  return userWithoutPassword;
    
  // }

  async remove(id: number): Promise<number> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
        throw new NotFoundException('User not found');
    }
    // delete user
    await user.destroy();
    return id;

  }


  async generateAccessToken(user: User): Promise<string> {
    const payload = { email: user.email, id: user.id };
    return this.jwtService.sign(payload);
  }

}
  