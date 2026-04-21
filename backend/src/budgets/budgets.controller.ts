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
import { BudgetsService } from './budgets.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  create(
    @Body() createBudgetDto: CreateBudgetDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetsService.create(createBudgetDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.budgetsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.budgetsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetsService.update(id, updateBudgetDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.budgetsService.remove(id, user.id);
  }

  // Budget categories
  @Post(':budgetId/categories')
  createCategory(
    @Param('budgetId') budgetId: string,
    @Body() dto: { category: string; limitAmount: number },
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetsService.createCategory(budgetId, dto, user.id);
  }

  @Get(':budgetId/categories')
  findCategories(
    @Param('budgetId') budgetId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetsService.findCategories(budgetId, user.id);
  }

  @Patch(':budgetId/categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() dto: { limitAmount: number },
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetsService.updateCategory(categoryId, dto, user.id);
  }

  @Delete(':budgetId/categories/:categoryId')
  removeCategory(
    @Param('categoryId') categoryId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.budgetsService.removeCategory(categoryId, user.id);
  }
}
