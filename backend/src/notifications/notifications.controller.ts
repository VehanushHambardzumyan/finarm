import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.create(createNotificationDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.notificationsService.findAll(user.id);
  }

  @Get('unread')
  findUnread(@CurrentUser() user: { id: string }) {
    return this.notificationsService.findUnread(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.notificationsService.update(id, updateNotificationDto, user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.markAsRead(id, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.notificationsService.remove(id, user.id);
  }
}
