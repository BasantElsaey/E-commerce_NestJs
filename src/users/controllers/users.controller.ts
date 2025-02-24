// import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
// import { UsersService } from '../services/users.service';
// import { UserSignUpDto } from '../../auth/dto/user-signup.dto';
// import { User } from '../models/user.model';
// import { UserLoginDto } from '../../auth/dto/user-login.dto';
// import { CurrentUser } from 'src/utility/common/decorators/current-user.decorator';
// import { AuthenticationGuard } from 'src/utility/guards/authentication.guard';
// import { AuthorizeRoles } from 'src/utility/common/decorators/authorize-roles.decorator';
// import { Roles } from 'src/utility/common/user-roles.enum';
// import { AuthorizationGuard } from 'src/utility/guards/authorization.guard';
// import { NotFoundException } from '@nestjs/common';
// @Controller('users')
// export class UsersController {
//   constructor(private readonly usersService: UsersService) {}

//   @Post('/signup')
//   async signup(@Body() userSignUpDto: UserSignUpDto): Promise<{ user: User }> {
//     return { user: await this.usersService.signup(userSignUpDto) };
//   }

//   @Post('/login') 
//   async login(@Body() userLoginDto: UserLoginDto): Promise<{ user: User;accessToken: string }> {
//    const user =  await this.usersService.login(userLoginDto);
//    const accessToken = await this.usersService.generateAccessToken(user);
//    return { user, accessToken };
//   }

//   // @AuthorizeRoles(Roles.ADMIN)
//   @UseGuards(AuthenticationGuard,AuthorizationGuard([Roles.ADMIN]))
//   @Get()
//   async findAll(): Promise<User[]> {
//     return await this.usersService.findAll();
//   }

//   @Get('getUser/:id')
//   async findOne(@Param('id') id: string): Promise<User | null> {
//     return await this.usersService.findOne(+id);
//   }

//   @UseGuards(AuthenticationGuard, AuthorizationGuard([Roles.ADMIN]))
//   @Patch('updateUser/:id')
//   async update(@Param('id') id: string, @Body()  updateUserDataDto: UserSignUpDto)
//   :Promise<{ message: string; user: User }> {

//     const updatedUser = await this.usersService.update(+id, updateUserDataDto);
//     if (!updatedUser) {
//         throw new NotFoundException('User not found');
//     }
//     return { message: 'User updated successfully', user: updatedUser };
  
//   }

//   @UseGuards(AuthenticationGuard, AuthorizationGuard([Roles.ADMIN]))
//   @Delete('deleteUser/:id')
//   async remove(@Param('id') id: string): Promise<{ message: string }> {
//     await this.usersService.remove(+id);
//     return { message: 'User deleted successfully' };
//   }

//   @UseGuards(AuthenticationGuard)
//   @Get('me')
//   getProfile(@CurrentUser() currentUser: User) {
//     return currentUser;
//   }

// }
// // @UseGuards(AuthenticationGuard)
// // @Post('logout')
// // logout(@Req() req: Request) : Promise<{ message: string }> {
// //   return { message: 'Logged out successfully' }; 
// // }
// // }




