import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminSupportService } from './admin-support.service';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';
import { CurrentAdmin, AuthenticatedAdmin } from '../admin-auth/admin-current-admin.decorator';
import { ticketStatusSchema, ticketReplySchema, TicketStatusDto, TicketReplyDto } from '@tradexa/validation';
import { parseDto } from '../common/parse-dto.util';

@Controller('admin/support')
@UseGuards(AdminJwtAuthGuard)
export class AdminSupportController {
  constructor(private adminSupport: AdminSupportService) {}

  @Get('tickets')
  tickets(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminSupport.list({ status, search, page: Number(page), pageSize: Number(pageSize) });
  }

  @Get('tickets/:id')
  ticket(@Param('id') id: string) {
    return this.adminSupport.getOne(id);
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: TicketStatusDto,
  ) {
    const dto = parseDto(ticketStatusSchema, body);
    return this.adminSupport.updateStatus(admin, id, dto);
  }

  @Post('tickets/:id/reply')
  async reply(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Param('id') id: string,
    @Body() body: TicketReplyDto,
  ) {
    const dto = parseDto(ticketReplySchema, body);
    return this.adminSupport.reply(admin, id, dto);
  }
}
