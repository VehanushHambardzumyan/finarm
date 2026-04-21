import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Account } from '../entities/account.entity';
import { TransactionType } from '../entities/enums';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private dataSource: DataSource,
  ) {}

  async createTransaction(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    const {
      accountId,
      toAccountId,
      type,
      amount,
      category,
      note,
      txDate,
      currency,
    } = createTransactionDto as CreateTransactionDto & { txDate?: string };

    if (amount <= 0) {
      throw new BadRequestException('Գումարը պետք է լինի 0-ից մեծ');
    }

    if (!accountId) {
      throw new BadRequestException('Հաշիվը պարտադիր է');
    }

    const fromAccount = await this.accountRepository.findOne({
      where: { id: accountId, userId },
    });

    if (!fromAccount) {
      throw new NotFoundException('Հաշիվը չի գտնվել');
    }

    if ((fromAccount as any).isArchived) {
      throw new BadRequestException('Արխիվացված հաշվի վրա գործարք հնարավոր չէ');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transactionData: Partial<Transaction> = {
        userId,
        accountId,
        type,
        amount,
        currency: currency ?? fromAccount.currency,
        category,
        note,
        txDate: txDate ? new Date(txDate) : new Date(),
      };

      if (type === TransactionType.INCOME) {
        fromAccount.balance = Number(fromAccount.balance) + Number(amount);
      } else if (type === TransactionType.EXPENSE) {
        if (Number(fromAccount.balance) < Number(amount)) {
          throw new BadRequestException('Հաշվում բավարար գումար չկա');
        }

        fromAccount.balance = Number(fromAccount.balance) - Number(amount);
      } else if (type === TransactionType.TRANSFER) {
        if (!toAccountId) {
          throw new BadRequestException('Պետք է ընտրված լինի ստացող հաշիվը');
        }

        if (accountId === toAccountId) {
          throw new BadRequestException('Չի կարելի փոխանցել նույն հաշվին');
        }

        const toAccount = await queryRunner.manager.findOne(Account, {
          where: { id: toAccountId, userId },
        });

        if (!toAccount) {
          throw new NotFoundException('Ստացող հաշիվը չի գտնվել');
        }

        if ((toAccount as any).isArchived) {
          throw new BadRequestException(
            'Արխիվացված հաշվի վրա գործարք հնարավոր չէ',
          );
        }

        if (Number(fromAccount.balance) < Number(amount)) {
          throw new BadRequestException('Հաշվում բավարար գումար չկա');
        }

        fromAccount.balance = Number(fromAccount.balance) - Number(amount);
        toAccount.balance = Number(toAccount.balance) + Number(amount);

        transactionData.toAccountId = toAccountId;

        await queryRunner.manager.save(Account, toAccount);
      } else {
        throw new BadRequestException('Գործարքի տեսակը սխալ է');
      }

      await queryRunner.manager.save(Account, fromAccount);

      const transaction = queryRunner.manager.create(Transaction, transactionData);
      const savedTransaction = await queryRunner.manager.save(
        Transaction,
        transaction,
      );

      await queryRunner.commitTransaction();

      return (await this.transactionRepository.findOne({
        where: { id: savedTransaction.id, userId },
        relations: ['account', 'toAccount'],
      })) as Transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactions(userId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      relations: ['account', 'toAccount'],
      order: { txDate: 'DESC', createdAt: 'DESC' },
    });
  }

  async getTransactionById(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
      relations: ['account', 'toAccount'],
    });

    if (!transaction) {
      throw new NotFoundException('Գործարքը չի գտնվել');
    }

    return transaction;
  }

  async updateTransaction(
    userId: string,
    id: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const oldTransaction = await this.transactionRepository.findOne({
      where: { id, userId },
      relations: ['account', 'toAccount'],
    });

    if (!oldTransaction) {
      throw new NotFoundException('Գործարքը չի գտնվել');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.rollbackTransactionEffect(queryRunner, userId, oldTransaction);

      const mergedDto: CreateTransactionDto & { txDate?: string } = {
        accountId: updateTransactionDto.accountId ?? oldTransaction.accountId,
        toAccountId:
          updateTransactionDto.toAccountId ?? oldTransaction.toAccountId ?? undefined,
        type: updateTransactionDto.type ?? oldTransaction.type,
        amount: updateTransactionDto.amount ?? oldTransaction.amount,
        currency: updateTransactionDto.currency ?? oldTransaction.currency,
        category: updateTransactionDto.category ?? oldTransaction.category ?? undefined,
        note: updateTransactionDto.note ?? oldTransaction.note ?? undefined,
        txDate:
          (updateTransactionDto as UpdateTransactionDto & { txDate?: string }).txDate ??
          (oldTransaction.txDate
            ? new Date(oldTransaction.txDate).toISOString()
            : new Date().toISOString()),
      };

      const {
        accountId,
        toAccountId,
        type,
        amount,
        category,
        note,
        txDate,
        currency,
      } = mergedDto;

      if (!accountId) {
        throw new BadRequestException('Հաշիվը պարտադիր է');
      }

      const fromAccount = await queryRunner.manager.findOne(Account, {
        where: { id: accountId, userId },
      });

      if (!fromAccount) {
        throw new NotFoundException('Հաշիվը չի գտնվել');
      }

      if ((fromAccount as any).isArchived) {
        throw new BadRequestException('Արխիվացված հաշվի վրա գործարք հնարավոր չէ');
      }

      if (type === TransactionType.INCOME) {
        fromAccount.balance = Number(fromAccount.balance) + Number(amount);
      } else if (type === TransactionType.EXPENSE) {
        if (Number(fromAccount.balance) < Number(amount)) {
          throw new BadRequestException('Հաշվում բավարար գումար չկա');
        }

        fromAccount.balance = Number(fromAccount.balance) - Number(amount);
      } else if (type === TransactionType.TRANSFER) {
        if (!toAccountId) {
          throw new BadRequestException('Պետք է ընտրված լինի ստացող հաշիվը');
        }

        if (accountId === toAccountId) {
          throw new BadRequestException('Չի կարելի փոխանցել նույն հաշվին');
        }

        const toAccount = await queryRunner.manager.findOne(Account, {
          where: { id: toAccountId, userId },
        });

        if (!toAccount) {
          throw new NotFoundException('Ստացող հաշիվը չի գտնվել');
        }

        if ((toAccount as any).isArchived) {
          throw new BadRequestException(
            'Արխիվացված հաշվի վրա գործարք հնարավոր չէ',
          );
        }

        if (Number(fromAccount.balance) < Number(amount)) {
          throw new BadRequestException('Հաշվում բավարար գումար չկա');
        }

        fromAccount.balance = Number(fromAccount.balance) - Number(amount);
        toAccount.balance = Number(toAccount.balance) + Number(amount);

        await queryRunner.manager.save(Account, toAccount);
      } else {
        throw new BadRequestException('Գործարքի տեսակը սխալ է');
      }

      await queryRunner.manager.save(Account, fromAccount);

      oldTransaction.accountId = accountId;
  oldTransaction.toAccountId = toAccountId ?? null;
  oldTransaction.type = type;
  oldTransaction.amount = Number(amount);
  oldTransaction.currency = currency ?? oldTransaction.currency;
  oldTransaction.category = category ?? null;
  oldTransaction.note = note ?? null;
  oldTransaction.txDate = txDate ? new Date(txDate) : oldTransaction.txDate;

      await queryRunner.manager.save(Transaction, oldTransaction);

      await queryRunner.commitTransaction();

      return (await this.transactionRepository.findOne({
        where: { id: oldTransaction.id, userId },
        relations: ['account', 'toAccount'],
      })) as Transaction;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    const transaction = await this.transactionRepository.findOne({
      where: { id, userId },
      relations: ['account', 'toAccount'],
    });

    if (!transaction) {
      throw new NotFoundException('Գործարքը չի գտնվել');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.rollbackTransactionEffect(queryRunner, userId, transaction);
      await queryRunner.manager.remove(Transaction, transaction);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async rollbackTransactionEffect(
    queryRunner: any,
    userId: string,
    transaction: Transaction,
  ): Promise<void> {
    const fromAccount = await queryRunner.manager.findOne(Account, {
      where: { id: transaction.accountId, userId },
    });

    if (!fromAccount) {
      throw new NotFoundException('Հաշիվը չի գտնվել');
    }

    if (transaction.type === TransactionType.INCOME) {
      if (Number(fromAccount.balance) < Number(transaction.amount)) {
        throw new BadRequestException('Հաշվում բավարար գումար չկա');
      }

      fromAccount.balance =
        Number(fromAccount.balance) - Number(transaction.amount);

      await queryRunner.manager.save(Account, fromAccount);
      return;
    }

    if (transaction.type === TransactionType.EXPENSE) {
      fromAccount.balance =
        Number(fromAccount.balance) + Number(transaction.amount);

      await queryRunner.manager.save(Account, fromAccount);
      return;
    }

    if (transaction.type === TransactionType.TRANSFER) {
      if (!transaction.toAccountId) {
        throw new BadRequestException('Transfer transaction is invalid');
      }

      const toAccount = await queryRunner.manager.findOne(Account, {
        where: { id: transaction.toAccountId, userId },
      });

      if (!toAccount) {
        throw new NotFoundException('Ստացող հաշիվը չի գտնվել');
      }

      if (Number(toAccount.balance) < Number(transaction.amount)) {
        throw new BadRequestException('Ստացող հաշվում բավարար գումար չկա');
      }

      fromAccount.balance =
        Number(fromAccount.balance) + Number(transaction.amount);
      toAccount.balance = Number(toAccount.balance) - Number(transaction.amount);

      await queryRunner.manager.save(Account, fromAccount);
      await queryRunner.manager.save(Account, toAccount);
    }
  }
}