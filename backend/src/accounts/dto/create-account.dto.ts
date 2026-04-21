import { IsString, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType, Currency } from '../../entities/enums';

export class CreateAccountDto {
  @IsString()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsEnum(Currency)
  currency: Currency;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  initialBalance?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  creditLimit?: number;
}