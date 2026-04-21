import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Account } from './account.entity';
import { TransactionType, Currency } from './enums';

@Entity('transactions')
@Index(['userId'])
@Index(['accountId'])
@Index(['toAccountId'])
@Index(['txDate'])
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column()
  accountId: string;

  @ManyToOne(() => Account, (account) => account.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column({ nullable: true })
  toAccountId: string | null;

  @ManyToOne(() => Account, (account) => account.incomingTransfers, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'toAccountId' })
  toAccount: Account | null;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column({ type: 'varchar', nullable: true })
  category: string | null;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  txDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}