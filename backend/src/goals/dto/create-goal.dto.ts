import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsNumber()
  @Min(0.01)
  targetAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentAmount?: number;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
