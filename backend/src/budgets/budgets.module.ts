import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetsService } from './budgets.service';
import { BudgetsController } from './budgets.controller';
import { Budget } from '../entities/budget.entity';
import { BudgetCategory } from '../entities/budget-category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Budget, BudgetCategory])],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
