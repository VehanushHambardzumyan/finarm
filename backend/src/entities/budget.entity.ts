import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { BudgetCategory } from './budget-category.entity';
import { BudgetPeriod } from './enums';

@Entity('budgets')
@Index(['userId'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.budgets, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: BudgetPeriod })
  period: BudgetPeriod;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  totalLimit: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => BudgetCategory, (category) => category.budget)
  categories: BudgetCategory[];
}
