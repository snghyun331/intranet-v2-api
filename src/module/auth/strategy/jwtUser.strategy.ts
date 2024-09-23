import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import { UserTokenDto } from '../../../common/dto/token.dto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, 'user') {
  constructor(public configService: ConfigService) {
    super();
  }

  async validate(req: Request) {
    try {
      const userToken: string = req.headers['authorization']?.slice(7);
      const secretKey: string = this.configService.get<string>('JWT_SECRET_KEY');
      const payload = jwt.verify(userToken, secretKey) as UserTokenDto;

      return payload;
    } catch (err) {
      throw err;
    }
  }
}
