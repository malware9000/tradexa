import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';
import { CurrentAdmin, AuthenticatedAdmin } from '../admin-auth/admin-current-admin.decorator';
import { adminUserStatusSchema, AdminUserStatusDto } from '@tradexa/validation';
import { parseDto } from '../common/parse-dto.util';

@Controller('admin')
@UseGuards(AdminJwtAuthGuard)
export class AdminUsersController {
  constructor(private adminUsers: AdminUsersService) {}

  @Get('users')
  users(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminUsers.list({ search, status, page: Number(page), pageSize: Number(pageSize) });
  }

  @Get('users/:id')
  user(@Param('id') id: string) {
    return this.adminUsers.getOne(id);
  }

  @Patch('users/:id/status')
  async updateStatus(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: AdminUserStatusDto,
  ) {
    const dto = parseDto(adminUserStatusSchema, body);
    return this.adminUsers.updateStatus(admin, id, dto);
  }

  @Get('stats')
  stats() {
    return this.adminUsers.stats();
  }
}