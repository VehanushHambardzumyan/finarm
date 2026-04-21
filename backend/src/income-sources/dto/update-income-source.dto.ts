import { PartialType } from '@nestjs/mapped-types';
import { CreateIncomeSourceDto } from './create-income-source.dto';

export class UpdateIncomeSourceDto extends PartialType(CreateIncomeSourceDto) {}
