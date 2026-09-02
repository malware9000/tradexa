import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { parseDto } from '../common/parse-dto.util';
import {
  depositCreateSchema,
  withdrawalCreateSchema,
  DepositCreateDto,
  WithdrawalCreateDto,
} from '@tradexa/validation';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private accounts: AccountsService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.accounts.getSummary(user.id);
  }

  @Get('chart')
  chart(@CurrentUser() user: AuthenticatedUser) {
    return this.accounts.getChart(user.id);
  }

  @Get('deposits')
  deposits(@CurrentUser() user: AuthenticatedUser) {
    return this.accounts.listDeposits(user.id);
  }

  @Post('deposits')
  async createDeposit(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: DepositCreateDto,
  ) {
    const dto = parseDto(depositCreateSchema, body);
    return this.accounts.createDeposit(user.id, dto);
  }

  @Get('withdrawals')
  withdrawals(@CurrentUser() user: AuthenticatedUser) {
    return this.accounts.listWithdrawals(user.id);
  }

  @Post('withdrawals')
  async createWithdrawal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: WithdrawalCreateDto,
  ) {
    const dto = parseDto(withdrawalCreateSchema, body);
    return this.accounts.createWithdrawal(user.id, dto);
  }

  @Get('transactions')
  transactions(@CurrentUser() user: AuthenticatedUser) {
    return this.accounts.listTransactions(user.id);
  }

  @Get('test-returns')
  testReturns(@CurrentUser() user: AuthenticatedUser) {
    return this.accounts.listTestReturns(user.id);
  }

  @Get('activity')
  activity(
    @CurrentUser() user: AuthenticatedUser,
    @Query('limit') limit?: string,
  ) {
    const take = Math.min(Number(limit) || 10, 50);
    return this.accounts.listTransactions(user.id).then((rows) => rows.slice(0, take));
  }
}