import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(
    @Body() createAccountDto: CreateAccountDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.accountsService.create(createAccountDto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.accountsService.findAll(user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.accountsService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.accountsService.update(id, updateAccountDto, user.id);
  }

  @Patch(':id/archive')
  archive(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.accountsService.archive(id, user.id);
  }

  @Patch(':id/unarchive')
  unarchive(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.accountsService.unarchive(id, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.accountsService.remove(id, user.id);
  }
}