import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../entities/enums';

class UpdateRoleDto {
  role: 'admin' | 'user';
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('transactions')
  getAllTransactions() {
    return this.adminService.getAllTransactions();
  }

  @Get('accounts')
  getAllAccounts() {
    return this.adminService.getAllAccounts();
  }

  @Get('budgets')
  getAllBudgets() {
    return this.adminService.getAllBudgets();
  }

  @Get('goals')
  getAllGoals() {
    return this.adminService.getAllGoals();
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: UpdateRoleDto) {
    const role =
      body.role === 'admin' ? UserRole.ADMIN : UserRole.USER;
    return this.adminService.updateUserRole(id, role);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
