import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  IsUUID,
} from 'class-validator';
import { TransactionType, Currency } from '../../entities/enums';

export class CreateTransactionDto {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsUUID()
  toAccountId?: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsDateString()
  txDate?: string;
}
