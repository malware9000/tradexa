import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AdminActor {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
}

@Injectable()
export class AdminSettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const rows = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return rows.map((r) => ({ key: r.key, value: r.value, description: r.description, updatedAt: r.updatedAt }));
  }

  async update(admin: AdminActor, updates: Record<string, unknown>) {
    const keys = Object.keys(updates);
    if (keys.length === 0) {
      throw new BadRequestException('No settings provided');
    }

    const results: Array<{ key: string; value: unknown; description: string | null }> = [];
    await this.prisma.$transaction(async (tx) => {
      for (const key of keys) {
        const value = updates[key];
        const result = await tx.systemSetting.upsert({
          where: { key },
          update: { value: value as never, updatedBy: admin.email },
          create: {
            key,
            value: value as never,
            updatedBy: admin.email,
            description: 'Managed from admin settings',
          },
        });
        results.push({ key: result.key, value: result.value, description: result.description });
      }
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'UPDATE_SETTINGS',
          targetType: 'SYSTEM_SETTINGS',
          detail: { updated: keys },
        },
      });
    });

    return results;
  }
}