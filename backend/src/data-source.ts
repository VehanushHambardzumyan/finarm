import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { IncomeSource } from './entities/income-source.entity';
import { Budget } from './entities/budget.entity';
import { BudgetCategory } from './entities/budget-category.entity';
import { Goal } from './entities/goal.entity';
import { NotificationItem } from './entities/notification.entity';
import { InitialSchema1735689600000 } from './migrations/1735689600000-InitialSchema';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Account,
    Transaction,
    IncomeSource,
    Budget,
    BudgetCategory,
    Goal,
    NotificationItem,
  ],
  migrations: [InitialSchema1735689600000],
});
