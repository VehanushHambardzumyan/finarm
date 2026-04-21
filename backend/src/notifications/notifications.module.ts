import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationItem } from '../entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationItem])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
