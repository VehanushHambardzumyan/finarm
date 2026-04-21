import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.createTransaction(
      user.id,
      createTransactionDto,
    );
  }

  @Get()
  getTransactions(@CurrentUser() user: { id: string }) {
    return this.transactionsService.getTransactions(user.id);
  }

  @Get(':id')
  getTransactionById(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.getTransactionById(user.id, id);
  }

  @Patch(':id')
  updateTransaction(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.updateTransaction(
      user.id,
      id,
      updateTransactionDto,
    );
  }

  @Delete(':id')
  deleteTransaction(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.transactionsService.deleteTransaction(user.id, id);
  }
}