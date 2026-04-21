import { IsEnum, IsNumber, Min } from 'class-validator';
import { BudgetPeriod } from '../../entities/enums';

export class CreateBudgetDto {
  @IsEnum(BudgetPeriod)
  period: BudgetPeriod;

  @IsNumber()
  @Min(0.01)
  totalLimit: number;
}
