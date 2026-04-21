import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: string): Promise<{
    id: string;
    email: string | null;
    phone: string | null;
    name: string;
    role: string;
    profile: any;
    createdAt: Date;
  }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, refreshTokenHash, updatedAt, ...profile } = user;
    return profile;
  }

  async update(
    id: string,
    updateData: { name?: string; profile?: any },
  ): Promise<{
    id: string;
    email: string | null;
    phone: string | null;
    name: string;
    role: string;
    profile: any;
    createdAt: Date;
  }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new BadRequestException('Current password is incorrect');

    const hash = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(id, { passwordHash: hash });
  }
}
