import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    @InjectRepository(Goal)
    private goalRepository: Repository<Goal>,
  ) {}

  async create(createGoalDto: CreateGoalDto, userId: string): Promise<Goal> {
    const goal = this.goalRepository.create({
      ...createGoalDto,
      userId,
    });
    return this.goalRepository.save(goal);
  }

  async findAll(userId: string): Promise<Goal[]> {
    return this.goalRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalRepository.findOne({
      where: { id, userId },
    });
    if (!goal) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  async update(
    id: string,
    updateGoalDto: UpdateGoalDto,
    userId: string,
  ): Promise<Goal> {
    const goal = await this.findOne(id, userId);
    Object.assign(goal, updateGoalDto);
    return this.goalRepository.save(goal);
  }

  async remove(id: string, userId: string): Promise<void> {
    const goal = await this.findOne(id, userId);
    await this.goalRepository.remove(goal);
  }

  async contribute(id: string, amount: number, userId: string): Promise<Goal> {
    if (Number(amount) <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const goal = await this.findOne(id, userId);
    goal.currentAmount = Number(goal.currentAmount) + Number(amount);

    if (goal.currentAmount > Number(goal.targetAmount)) {
      goal.currentAmount = Number(goal.targetAmount);
    }

    return this.goalRepository.save(goal);
  }
}
