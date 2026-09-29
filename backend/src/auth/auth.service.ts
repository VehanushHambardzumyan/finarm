import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    const { email, phone, name, password } = registerDto;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    const existingUser = await this.userRepository.findOne({
      where: email ? { email } : { phone },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = this.userRepository.create({
      email,
      phone,
      name,
      passwordHash,
    });

    await this.userRepository.save(user);
    this.logger.log(`User registered: ${user.id}`);

    return { message: 'User registered successfully' };
  }

  async login(
    loginDto: LoginDto,
    res: Response,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const { identifier, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: identifier.includes('@')
        ? { email: identifier }
        : { phone: identifier },
    });
    if (!user) {
      this.logger.warn(`Login failed: user not found for ${identifier}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: invalid password for user ${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    user.refreshTokenHash = refreshTokenHash;
    await this.userRepository.save(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite:
        this.configService.get<string>('COOKIE_SECURE') === 'true'
          ? 'none'
          : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    this.logger.log(`User logged in: ${user.id}`);

    const { passwordHash, ...userWithoutSensitive } = user;
    return { accessToken, user: userWithoutSensitive };
  }

  async refresh(req: Request, res: Response): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash,
    );
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate refresh token
    const newRefreshToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      {
        expiresIn: '7d',
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      },
    );
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 12);
    user.refreshTokenHash = newRefreshTokenHash;
    await this.userRepository.save(user);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite:
        this.configService.get<string>('COOKIE_SECURE') === 'true'
          ? 'none'
          : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const newAccessToken = this.jwtService.sign(
      { sub: user.id, email: user.email },
      { expiresIn: '15m' },
    );

    this.logger.log(`Refresh token rotated for user: ${user.id}`);

    return { accessToken: newAccessToken };
  }

  async logout(userId: string, res: Response): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.refreshTokenHash = null;
      await this.userRepository.save(user);
    }

    res.clearCookie('refreshToken');
    this.logger.log(`User logged out: ${userId}`);

    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { passwordHash, refreshTokenHash, ...profile } = user;
    return profile;
  }
}
