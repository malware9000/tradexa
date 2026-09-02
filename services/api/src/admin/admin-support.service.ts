import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AdminActor {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  active: boolean;
}

@Injectable()
export class AdminSupportService {
  constructor(private prisma: PrismaService) {}

  async list(params: { status?: string; search?: string; page?: number; pageSize?: number }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100);
    const where: Record<string, unknown> = {};

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }
    if (params.search) {
      const q = params.search.trim();
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        {
          user: {
            is: {
              email: { contains: q, mode: 'insensitive' },
            },
          },
        },
        {
          user: {
            is: {
              profile: {
                is: { fullName: { contains: q, mode: 'insensitive' } },
              },
            },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { fullName: true } },
            },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            select: { authorType: true },
          },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    const mapped = items.map((t) => ({
      id: t.id,
      category: t.category,
      subject: t.subject,
      priority: t.priority,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      messageCount: t.messages.length,
      lastAuthor: t.messages.length
        ? t.messages[t.messages.length - 1].authorType
        : 'USER',
      user: t.user,
    }));

    return { items: mapped, total, page, pageSize };
  }

  async getOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            createdAt: true,
            profile: { select: { fullName: true, phone: true, country: true } },
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    return { ticket, messages: ticket.messages };
  }

  async updateStatus(admin: AdminActor, id: string, data: { status: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    if (ticket.status === data.status) {
      return { id, status: ticket.status };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.supportTicket.update({
        where: { id },
        data: { status: data.status as never },
      });
      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'UPDATE_TICKET_STATUS',
          targetType: 'SUPPORT_TICKET',
          targetId: id,
          detail: { from: ticket.status, to: data.status },
        },
      });
      if (data.status === 'RESOLVED') {
        await tx.notification.create({
          data: {
            userId: ticket.userId,
            type: 'SUPPORT_REPLY',
            title: 'Ticket resolved',
            body: `Your support ticket "${ticket.subject}" has been marked as resolved.`,
          },
        });
      }
    });

    return { id, status: data.status };
  }

  async reply(admin: AdminActor, id: string, data: { message: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: {
          ticketId: id,
          authorType: 'ADMIN',
          authorId: admin.id,
          message: data.message,
        },
      });

      await tx.supportTicket.update({
        where: { id },
        data: {
          status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status,
          updatedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          userId: ticket.userId,
          type: 'SUPPORT_REPLY',
          title: 'Reply to your support ticket',
          body: `Support replied to "${ticket.subject}": ${data.message.slice(0, 140)}${data.message.length > 140 ? '…' : ''}`,
        },
      });

      await tx.adminAction.create({
        data: {
          adminId: admin.id,
          action: 'REPLY_TICKET',
          targetType: 'SUPPORT_TICKET',
          targetId: id,
          detail: { to: ticket.userId },
        },
      });

      return created;
    });

    return message;
  }
}
