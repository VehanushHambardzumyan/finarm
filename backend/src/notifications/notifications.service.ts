import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationItem } from '../entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationItem)
    private notificationRepository: Repository<NotificationItem>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
    userId: string,
  ): Promise<NotificationItem> {
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      userId,
    });
    return this.notificationRepository.save(notification);
  }

  async findAll(userId: string): Promise<NotificationItem[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findUnread(userId: string): Promise<NotificationItem[]> {
    return this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<NotificationItem> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
    userId: string,
  ): Promise<NotificationItem> {
    const notification = await this.findOne(id, userId);
    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async markAsRead(id: string, userId: string): Promise<NotificationItem> {
    const notification = await this.findOne(id, userId);
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationRepository.remove(notification);
  }
}
