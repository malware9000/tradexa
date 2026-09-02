import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt-auth.guard';
import { CurrentAdmin, AuthenticatedAdmin } from '../admin-auth/admin-current-admin.decorator';
import { settingsUpdateSchema, SettingsUpdateDto } from '@tradexa/validation';
import { parseDto } from '../common/parse-dto.util';

@Controller('admin/settings')
@UseGuards(AdminJwtAuthGuard)
export class AdminSettingsController {
  constructor(private adminSettings: AdminSettingsService) {}

  @Get()
  getAll() {
    return this.adminSettings.getAll();
  }

  @Patch()
  async update(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() body: SettingsUpdateDto,
  ) {
    const dto = parseDto(settingsUpdateSchema, body);
    return this.adminSettings.update(admin, dto);
  }
}