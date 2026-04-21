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
import { GoalsService } from './goals.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(
    @Body() createGoalDto: CreateGoalDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.goalsService.create(createGoalDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.goalsService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.goalsService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGoalDto: UpdateGoalDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.goalsService.update(id, updateGoalDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.goalsService.remove(id, user.id);
  }

  @Post(':id/contribute')
  contribute(
    @Param('id') id: string,
    @Body() dto: { amount: number },
    @CurrentUser() user: { id: string },
  ) {
    return this.goalsService.contribute(id, dto.amount, user.id);
  }
}
