import {
  IsString,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';
import { Currency } from '../../entities/enums';

export class CreateIncomeSourceDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(Currency)
  currency: Currency;

  @IsString()
  frequency: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
