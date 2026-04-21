import { EntityRepository, Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';

@EntityRepository(Transaction)
export class TransactionRepository extends Repository<Transaction> {
  async countByAccountId(accountId: string): Promise<number> {
    return this.count({ where: [{ accountId }, { toAccountId: accountId }] });
  }
}
