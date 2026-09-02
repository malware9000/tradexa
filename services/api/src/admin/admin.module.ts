import { Module } from '@nestjs/common';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminPaymentsService } from './admin-payments.service';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminSettingsService } from './admin-settings.service';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSupportService } from './admin-support.service';
import { AdminSupportController } from './admin-support.controller';

@Module({
  controllers: [AdminUsersController, AdminPaymentsController, AdminSettingsController, AdminSupportController],
  providers: [AdminUsersService, AdminPaymentsService, AdminSettingsService, AdminSupportService],
  exports: [AdminUsersService, AdminPaymentsService, AdminSettingsService, AdminSupportService],
})
export class AdminModule {}