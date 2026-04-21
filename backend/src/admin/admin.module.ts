import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { User } from '../entities/user.entity';
import { Transaction } from '../entities/transaction.entity';
import { Account } from '../entities/account.entity';
import { Budget } from '../entities/budget.entity';
import { Goal } from '../entities/goal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transaction, Account, Budget, Goal])],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
