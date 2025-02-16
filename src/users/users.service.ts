import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';
import { UserSignUpDto } from './dto/user-signup.dto';
import { hash, compare } from 'bcrypt';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtService } from '@nestjs/jwt';
// import { RevokedToken } from './models/revoked-token.model';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User) private readonly userModel: typeof User,
  // @InjectModel(RevokedToken)
  //  private readonly revokedTokenModel: typeof RevokedToken,
  private readonly jwtService: JwtService
) {}

  async signup(userSignUpDto: UserSignUpDto): Promise<User> {
    const userExists = await this.findUserByEmail(userSignUpDto.email);
    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    userSignUpDto.password = await hash(userSignUpDto.password, 10);

    let createdUser = await this.userModel.create(userSignUpDto as any);

    if (!createdUser) {
      throw new BadRequestException('Failed to create user');
    }
    const userWithoutPassword = createdUser.get({ plain: true }) as any;
   
  // check if password exists before deleting
   if (userWithoutPassword.password) {
    delete userWithoutPassword.password;
   }
   return userWithoutPassword;
}

  async login(userLoginDto: UserLoginDto): Promise<User> {
     const userExists = await this.userModel.findOne({ 
      where: { email: userLoginDto.email },
      attributes: { include : ['password'] }
    });
     if (!userExists) {
      throw new BadRequestException('User does not exist');
     }
     const matchPassword = await compare(userLoginDto.password, userExists.password);
     if (!matchPassword) {
      throw new BadRequestException('Invalid Credentials');
     }
     // define user without password and get plain to remove password
     const userWithoutPassword = userExists.get({ plain: true }) as any;
     // check if password exists before deleting
     if (userWithoutPassword.password) {
      delete userWithoutPassword.password;
     }
     return userWithoutPassword;

  }


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

  async update(id: number , updateUserDataDto: UserSignUpDto):
  Promise<User> {  
    const user = await this.userModel.findByPk(id);
    if (!user) {
        throw new NotFoundException('User not found');
    }

    // التأكد من عدم تكرار البريد الإلكتروني
    if (user.email !== updateUserDataDto.email) {
        const existingUser = await this.findUserByEmail
        (updateUserDataDto.email);
        if (existingUser && existingUser.id !== id) {
            throw new BadRequestException('Email already in use');
        }
    }

    user.name = updateUserDataDto.name;
    user.email = updateUserDataDto.email;

    if (updateUserDataDto.password) {
        user.password = await hash(updateUserDataDto.password, 10);
    } 
    const userWithoutPassword = user.get({ plain: true }) as any;
   
  // check if password exists before deleting
   if (userWithoutPassword.password) {
    delete userWithoutPassword.password;
   }
   return userWithoutPassword;
    
  }

  async remove(id: number): Promise<number> {
    const user = await this.userModel.findByPk(id);
    if (!user) {
        throw new NotFoundException('User not found');
    }
    // delete user
    await user.destroy();
    return id;

  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ where: { email } });
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload = { email: user.email, id: user.id };
    return this.jwtService.sign(payload);
  }

}
  