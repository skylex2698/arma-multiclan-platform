import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException();
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException();
    }

    return {
      accessToken: this.jwt.sign({
        userId: user.id,
        role: user.role,
        status: user.status,
        clanId: user.clanId,
      }),
    };
  }
}
