/**
 * DEVELOPMENT/DEMO SEED SCRIPT
 *
 * This script populates the database with demo data for development/testing only.
 * It is NOT run automatically during app startup or in production.
 * To run manually: npm run seed
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Account } from './entities/account.entity';
import { Transaction } from './entities/transaction.entity';
import { AccountType, Currency, TransactionType } from './entities/enums';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const userRepository = dataSource.getRepository(User);
  const accountRepository = dataSource.getRepository(Account);
  const transactionRepository = dataSource.getRepository(Transaction);

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = userRepository.create({
    email: 'demo@example.com',
    name: 'Demo User',
    passwordHash,
  });
  await userRepository.save(user);

  // Create accounts
  const cashAccount = accountRepository.create({
    user,
    name: 'Cash',
    type: AccountType.CASH,
    balance: 1000,
    currency: Currency.AMD,
  });
  await accountRepository.save(cashAccount);

  const bankAccount = accountRepository.create({
    user,
    name: 'Bank Account',
    type: AccountType.BANK,
    balance: 50000,
    currency: Currency.AMD,
  });
  await accountRepository.save(bankAccount);

  const creditCard = accountRepository.create({
    user,
    name: 'Credit Card',
    type: AccountType.CREDIT,
    balance: -5000,
    currency: Currency.AMD,
    creditLimit: 100000,
  });
  await accountRepository.save(creditCard);

  // Create transactions
  const transaction1 = transactionRepository.create({
  userId: user.id,
  accountId: cashAccount.id,
  type: TransactionType.INCOME,
  amount: 500000,
  currency: Currency.AMD,
  category: 'salary',
  note: 'Monthly salary',
  txDate: new Date(),
});
  await transactionRepository.save(transaction1);

  const transaction2 = transactionRepository.create({
  userId: user.id,
  accountId: cashAccount.id,
  type: TransactionType.EXPENSE,
  amount: 25000,
  currency: Currency.AMD,
  category: 'food',
  note: 'Groceries',
  txDate: new Date(),
});
  await transactionRepository.save(transaction2);

  const transaction3 = transactionRepository.create({
  userId: user.id,
  accountId: cashAccount.id,
  toAccountId: bankAccount.id,
  type: TransactionType.TRANSFER,
  amount: 100000,
  currency: Currency.AMD,
  note: 'Transfer to bank account',
  txDate: new Date(),
});
  await transactionRepository.save(transaction3);

  // Update balances after transfer
  bankAccount.balance -= 10000;
  cashAccount.balance += 10000;
  await accountRepository.save(bankAccount);
  await accountRepository.save(cashAccount);

  console.log('Seeding completed');
  await app.close();
}

seed().catch(console.error);
