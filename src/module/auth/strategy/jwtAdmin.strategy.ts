import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-custom';
import * as jwt from 'jsonwebtoken';
import { AdminPayload } from '@common/interface/payload.interface';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'admin') {
  constructor(public configService: ConfigService) {
    super();
  }

  async validate(req: Request) {
    try {
      const adminToken: string = req.headers['authorization']?.slice(7);
      const secretKey: string = this.configService.get<string>('JWT_SECRET_KEY');
      const payload: AdminPayload = jwt.verify(adminToken, secretKey) as AdminPayload;
      const { adminIdx } = payload;
      if (!adminIdx) {
        throw new Error();
      }

      return payload;
    } catch (err) {
      throw err;
    }
  }
}
