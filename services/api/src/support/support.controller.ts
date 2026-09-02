import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import {
  ticketCreateSchema,
  ticketReplySchema,
  ticketStatusSchema,
  TicketCreateDto,
  TicketReplyDto,
  TicketStatusDto,
} from '@tradexa/validation';
import { parseDto } from '../common/parse-dto.util';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private support: SupportService) {}

  @Post('tickets')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: TicketCreateDto) {
    const dto = parseDto(ticketCreateSchema, body);
    return this.support.create(user, dto);
  }

  @Get('tickets')
  tickets(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.support.listMine(user, { status, page: Number(page), pageSize: Number(pageSize) });
  }

  @Get('tickets/:id')
  ticket(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.support.getMine(user, id);
  }

  @Post('tickets/:id/reply')
  async reply(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: TicketReplyDto,
  ) {
    const dto = parseDto(ticketReplySchema, body);
    return this.support.reply(user, id, dto);
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: TicketStatusDto,
  ) {
    const dto = parseDto(ticketStatusSchema, body);
    return this.support.updateStatus(user, id, dto);
  }
}
