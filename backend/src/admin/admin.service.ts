import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { Account } from '../entities/account.entity';
import { Budget } from '../entities/budget.entity';
import { Goal } from '../entities/goal.entity';
import { UserRole, TransactionType } from '../entities/enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,

    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,

    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,

    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
  ) {}

  async getAllUsers() {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    return users.map(({ passwordHash, refreshTokenHash, ...safe }) => safe);
  }

  async getStats() {
    const totalUsers = await this.userRepository.count();

    const transactions = await this.transactionRepository.find();

    const totalTransactions = transactions.length;

    const totalRevenue = transactions
      .filter((tx) => tx.type === TransactionType.INCOME)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const totalExpenses = transactions
      .filter((tx) => tx.type === TransactionType.EXPENSE)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Active users: users who have at least one transaction
    const userIdsWithTransactions = new Set(
      transactions.map((tx) => tx.userId),
    );
    const activeUsers = userIdsWithTransactions.size;

    return {
      totalUsers,
      activeUsers,
      totalTransactions,
      totalRevenue,
      totalExpenses,
    };
  }

  async getAllTransactions() {
    const transactions = await this.transactionRepository.find({
      relations: ['user'],
      order: { txDate: 'DESC' },
    });

    return transactions.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      userName: tx.user?.name ?? null,
      userEmail: tx.user?.email ?? null,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      category: tx.category,
      note: tx.note,
      txDate: tx.txDate,
      createdAt: tx.createdAt,
    }));
  }

  async getAllAccounts() {
    const accounts = await this.accountRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return accounts.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: a.user?.name ?? null,
      userEmail: a.user?.email ?? null,
      name: a.name,
      type: a.type,
      balance: a.balance,
      currency: a.currency,
      isArchived: a.isArchived,
      createdAt: a.createdAt,
    }));
  }

  async getAllBudgets() {
    const budgets = await this.budgetRepository.find({
      relations: ['user', 'categories'],
      order: { createdAt: 'DESC' },
    });
    return budgets.map((b) => ({
      id: b.id,
      userId: b.userId,
      userName: b.user?.name ?? null,
      userEmail: b.user?.email ?? null,
      period: b.period,
      totalLimit: b.totalLimit,
      categoriesCount: b.categories?.length ?? 0,
      createdAt: b.createdAt,
    }));
  }

  async getAllGoals() {
    const goals = await this.goalRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    return goals.map((g) => ({
      id: g.id,
      userId: g.userId,
      userName: g.user?.name ?? null,
      userEmail: g.user?.email ?? null,
      title: g.title,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline,
      createdAt: g.createdAt,
    }));
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.userRepository.findOneOrFail({ where: { id } });
    user.role = role;
    await this.userRepository.save(user);
    const { passwordHash, refreshTokenHash, ...safe } = user;
    return safe;
  }

  async deleteUser(id: string) {
    await this.userRepository.delete(id);
    return { success: true };
  }
}
