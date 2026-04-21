import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../entities/budget.entity';
import { BudgetCategory } from '../entities/budget-category.entity';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private budgetRepository: Repository<Budget>,
    @InjectRepository(BudgetCategory)
    private budgetCategoryRepository: Repository<BudgetCategory>,
  ) {}

  async create(
    createBudgetDto: CreateBudgetDto,
    userId: string,
  ): Promise<Budget> {
    const budget = this.budgetRepository.create({
      ...createBudgetDto,
      userId,
    });
    return this.budgetRepository.save(budget);
  }

  async findAll(userId: string): Promise<Budget[]> {
    return this.budgetRepository.find({
      where: { userId },
      relations: ['categories'],
    });
  }

  async findOne(id: string, userId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id, userId },
      relations: ['categories'],
    });
    if (!budget) {
      throw new NotFoundException('Budget not found');
    }
    return budget;
  }

  async update(
    id: string,
    updateBudgetDto: UpdateBudgetDto,
    userId: string,
  ): Promise<Budget> {
    const budget = await this.findOne(id, userId);
    Object.assign(budget, updateBudgetDto);
    return this.budgetRepository.save(budget);
  }

  async remove(id: string, userId: string): Promise<void> {
    const budget = await this.findOne(id, userId);
    await this.budgetRepository.remove(budget);
  }

  // Category methods
  async createCategory(
    budgetId: string,
    dto: { category: string; limitAmount: number },
    userId: string,
  ): Promise<BudgetCategory> {
    // Verify budget belongs to user
    await this.findOne(budgetId, userId);

    const category = this.budgetCategoryRepository.create({
      budgetId,
      ...dto,
    });
    return this.budgetCategoryRepository.save(category);
  }

  async findCategories(
    budgetId: string,
    userId: string,
  ): Promise<BudgetCategory[]> {
    // Verify budget belongs to user
    await this.findOne(budgetId, userId);

    return this.budgetCategoryRepository.find({
      where: { budgetId },
    });
  }

  async updateCategory(
    id: string,
    dto: { limitAmount: number },
    userId: string,
  ): Promise<BudgetCategory> {
    const category = await this.budgetCategoryRepository.findOne({
      where: { id },
      relations: ['budget'],
    });
    if (!category || category.budget.userId !== userId) {
      throw new NotFoundException('Budget category not found');
    }

    Object.assign(category, dto);
    return this.budgetCategoryRepository.save(category);
  }

  async removeCategory(id: string, userId: string): Promise<void> {
    const category = await this.budgetCategoryRepository.findOne({
      where: { id },
      relations: ['budget'],
    });
    if (!category || category.budget.userId !== userId) {
      throw new NotFoundException('Budget category not found');
    }

    await this.budgetCategoryRepository.remove(category);
  }
}
