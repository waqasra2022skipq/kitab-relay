import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Role } from '../generated/prisma/client.js';
import bcrypt from 'bcrypt';
import { SignJWT, jwtVerify } from 'jose';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: Role[];
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    roles: Role[];
  };
  token: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: Uint8Array;
  private readonly jwtExpiresIn: string;

  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not defined');

    this.jwtSecret = new TextEncoder().encode(secret);
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  }

  //  Register
  async register(dto: RegisterDto): Promise<AuthResponse> {
    // 1 checking if email already exist
    const existing = await this.prisma.db.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new Error('Email already exist');
    }

    // 2: hashing the password
    const hashedPass = await bcrypt.hash(dto.password, 12);

    // 3: Let's create the user now
    const user = await this.prisma.db.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPass,
        name: dto.name,
        phone: dto.phone,
        city: dto.city,
        roles: [Role.BUYER],
      },
    });

    // 2: Issue the JWT

    const token = await this.issueToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      token,
    };
  }

  private issueToken(payload: JwtPayload): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = this.parseExpiry(this.jwtExpiresIn);

    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(expiresIn)
      .sign(this.jwtSecret);
  }

  private parseExpiry(expiry: string): number {
    const units: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid JWT_EXPIRES_IN format: ${expiry}`);
    return parseInt(match[1]) * units[match[2]];
  }

  // logging in the user
  async login(dto: LoginDto): Promise<AuthResponse> {
    // 1: find the user by coming email
    const user = await this.prisma.db.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Compare password
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Issue JWT
    const token = await this.issueToken({
      sub: user.id,
      email: user.email,
      roles: user.roles,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      token,
    };
  }

  // ─── Verify Token

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      const { payload } = await jwtVerify(token, this.jwtSecret);

      return {
        sub: payload.sub as string,
        email: payload['email'] as string,
        roles: payload['roles'] as Role[],
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
