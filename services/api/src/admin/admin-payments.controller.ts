import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';
import { CurrentAdmin, AuthenticatedAdmin } from '../admin-auth/admin-current-admin.decorator';
import { depositActionSchema, withdrawalActionSchema, DepositActionDto, WithdrawalActionDto } from '@tradexa/validation';
import { parseDto } from '../common/parse-dto.util';

@Controller('admin/payments')
@UseGuards(AdminJwtAuthGuard)
export class AdminPaymentsController {
  constructor(private adminPayments: AdminPaymentsService) {}

  @Get('deposits')
  deposits(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminPayments.listDeposits({ status, page: Number(page), pageSize: Number(pageSize) });
  }

  @Patch('deposits/:id')
  async depositAction(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: DepositActionDto,
  ) {
    const dto = parseDto(depositActionSchema, body);
    return this.adminPayments.actionDeposit(admin, id, dto);
  }

  @Get('withdrawals')
  withdrawals(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminPayments.listWithdrawals({ status, page: Number(page), pageSize: Number(pageSize) });
  }

  @Patch('withdrawals/:id')
  async withdrawalAction(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: WithdrawalActionDto,
  ) {
    const dto = parseDto(withdrawalActionSchema, body);
    return this.adminPayments.actionWithdrawal(admin, id, dto);
  }
}