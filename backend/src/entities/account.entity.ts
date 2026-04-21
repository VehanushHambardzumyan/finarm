import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Transaction } from './transaction.entity';
import { AccountType, Currency } from './enums';

@Entity('accounts')
@Index(['userId'])
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.accounts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AccountType })
  type: AccountType;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  balance: number;

  @Column({ type: 'enum', enum: Currency })
  currency: Currency;

  @Column({ type: 'numeric', precision: 15, scale: 2, nullable: true })
  creditLimit: number | null;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.toAccount)
  incomingTransfers: Transaction[];
}