import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';

import { Account } from '../entities/account.entity';
import { Transaction } from '../entities/transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Transaction, // 🔥 ԱՅՍ ՏՈՂԸ ՊԵՏՔ Է ԼԻՆԻ
    ]),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
})
export class AccountsModule {}