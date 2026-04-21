import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  type: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
