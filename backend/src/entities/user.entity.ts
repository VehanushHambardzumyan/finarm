import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Account } from './account.entity';
import { Transaction } from './transaction.entity';
import { IncomeSource } from './income-source.entity';
import { Budget } from './budget.entity';
import { Goal } from './goal.entity';
import { NotificationItem } from './notification.entity';
import { UserRole, Currency } from './enums';

export interface Profile {
  age?: number;
  maritalStatus?: string;
  currency?: Currency;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'jsonb', nullable: true })
  profile: Profile;

  @Column()
  passwordHash: string;

  @Column({ name: 'refresh_token_hash', type: 'text', nullable: true })
  refreshTokenHash: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => IncomeSource, (incomeSource) => incomeSource.user)
  incomeSources: IncomeSource[];

  @OneToMany(() => Budget, (budget) => budget.user)
  budgets: Budget[];

  @OneToMany(() => Goal, (goal) => goal.user)
  goals: Goal[];

  @OneToMany(() => NotificationItem, (notification) => notification.user)
  notifications: NotificationItem[];
}
