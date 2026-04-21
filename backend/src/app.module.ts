import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { IncomeSourcesModule } from './income-sources/income-sources.module';
import { BudgetsModule } from './budgets/budgets.module';
import { GoalsModule } from './goals/goals.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import * as entities from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => {
        return {
          type: 'postgres',
          url: process.env.DATABASE_URL,
          entities: Object.values(entities),
          synchronize: false,
          migrations: ['dist/migrations/*.js'],
          migrationsRun: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    IncomeSourcesModule,
    BudgetsModule,
    GoalsModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
