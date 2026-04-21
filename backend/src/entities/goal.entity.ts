import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('goals')
@Index(['userId'])
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, (user) => user.goals, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  title: string;

  @Column({ type: 'numeric', precision: 15, scale: 2 })
  targetAmount: number;

  @Column({ type: 'numeric', precision: 15, scale: 2, default: 0 })
  currentAmount: number;

  @Column({ type: 'date', nullable: true })
  deadline: string;

  @CreateDateColumn()
  createdAt: Date;
}
