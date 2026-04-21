import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IncomeSource } from '../entities/income-source.entity';
import { CreateIncomeSourceDto } from './dto/create-income-source.dto';
import { UpdateIncomeSourceDto } from './dto/update-income-source.dto';

@Injectable()
export class IncomeSourcesService {
  constructor(
    @InjectRepository(IncomeSource)
    private incomeSourceRepository: Repository<IncomeSource>,
  ) {}

  async create(
    createIncomeSourceDto: CreateIncomeSourceDto,
    userId: string,
  ): Promise<IncomeSource> {
    const incomeSource = this.incomeSourceRepository.create({
      ...createIncomeSourceDto,
      userId,
    });
    return this.incomeSourceRepository.save(incomeSource);
  }

  async findAll(userId: string): Promise<IncomeSource[]> {
    return this.incomeSourceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<IncomeSource> {
    const incomeSource = await this.incomeSourceRepository.findOne({
      where: { id, userId },
    });
    if (!incomeSource) {
      throw new NotFoundException('Income source not found');
    }
    return incomeSource;
  }

  async update(
    id: string,
    updateIncomeSourceDto: UpdateIncomeSourceDto,
    userId: string,
  ): Promise<IncomeSource> {
    const incomeSource = await this.findOne(id, userId);
    Object.assign(incomeSource, updateIncomeSourceDto);
    return this.incomeSourceRepository.save(incomeSource);
  }

  async remove(id: string, userId: string): Promise<void> {
    const incomeSource = await this.findOne(id, userId);
    await this.incomeSourceRepository.remove(incomeSource);
  }
}
