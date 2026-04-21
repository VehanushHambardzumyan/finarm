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
import { IncomeSourcesService } from './income-sources.service';
import { CreateIncomeSourceDto } from './dto/create-income-source.dto';
import { UpdateIncomeSourceDto } from './dto/update-income-source.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('income-sources')
@UseGuards(JwtAuthGuard)
export class IncomeSourcesController {
  constructor(private readonly incomeSourcesService: IncomeSourcesService) {}

  @Post()
  create(
    @Body() createIncomeSourceDto: CreateIncomeSourceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.incomeSourcesService.create(createIncomeSourceDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.incomeSourcesService.findAll(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.incomeSourcesService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateIncomeSourceDto: UpdateIncomeSourceDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.incomeSourcesService.update(id, updateIncomeSourceDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.incomeSourcesService.remove(id, user.id);
  }
}
