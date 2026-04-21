import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Budget } from './budget.entity';

@Entity('budget_categories')
@Unique(['budgetId', 'category'])
export class BudgetCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  budgetId: string;

  @ManyToOne(() => Budget, (budget) => budget.categories, {
    onDelete: 'CASCADE',
  })
  budget: Budget;

  @Column()
  category: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  limitAmount: number;
}
