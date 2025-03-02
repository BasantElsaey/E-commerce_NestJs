import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/models/user.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User) private readonly userModel: typeof User) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET_KEY,
    });
  }
  async validate(payload: { id: number; email: string; roles: string[] }) {
  
    const user = await this.userModel.findByPk(payload.id, {
      attributes: ['id', 'email', 'roles'],
    });
  
    if (!user) {
      throw new UnauthorizedException('Unauthorized access');
    }
    
  
    console.log('✅ User from DB:', user);
  
    return {
      id: user.id,
      email: user.email,
      roles: user.roles || [], 
    };
  }
}  