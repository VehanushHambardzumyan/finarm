import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';

import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,

    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async create(
    createAccountDto: CreateAccountDto,
    userId: string,
  ): Promise<Account> {
    const account = this.accountRepository.create({
      userId,
      name: createAccountDto.name,
      type: createAccountDto.type,
      currency: createAccountDto.currency,
      balance: createAccountDto.initialBalance ?? 0,
      creditLimit: createAccountDto.creditLimit ?? null,
      isArchived: false,
    });

    return this.accountRepository.save(account);
  }

  async findAll(userId: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Account> {
    const account = await this.accountRepository.findOne({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async update(
    id: string,
    updateAccountDto: UpdateAccountDto,
    userId: string,
  ): Promise<Account> {
    const account = await this.findOne(id, userId);

    if (updateAccountDto.name !== undefined) {
      account.name = updateAccountDto.name;
    }

    if (updateAccountDto.type !== undefined) {
      account.type = updateAccountDto.type;
    }

    if (updateAccountDto.currency !== undefined) {
      account.currency = updateAccountDto.currency;
    }

    if (updateAccountDto.initialBalance !== undefined) {
      account.balance = updateAccountDto.initialBalance;
    }

    if (updateAccountDto.creditLimit !== undefined) {
      account.creditLimit = updateAccountDto.creditLimit;
    }

    if (updateAccountDto.isArchived !== undefined) {
      account.isArchived = updateAccountDto.isArchived;
    }

    return this.accountRepository.save(account);
  }

  async archive(id: string, userId: string): Promise<Account> {
    const account = await this.findOne(id, userId);
    account.isArchived = true;
    return this.accountRepository.save(account);
  }

  async unarchive(id: string, userId: string): Promise<Account> {
    const account = await this.findOne(id, userId);
    account.isArchived = false;
    return this.accountRepository.save(account);
  }

  async remove(id: string, userId: string): Promise<void> {
    const account = await this.findOne(id, userId);

    const linkedCount = await this.transactionRepository.count({
      where: [{ accountId: id }, { toAccountId: id }],
    });

    if (linkedCount > 0) {
      throw new BadRequestException(
        'Account cannot be deleted because it has linked transactions.',
      );
    }

    await this.accountRepository.remove(account);
  }
}