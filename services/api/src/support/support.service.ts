import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SupportActor {
  id: string;
  email: string;
}

const USER_ALLOWED_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED'];

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async create(user: SupportActor, data: { category: string; subject: string; message: string }) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId: user.id,
          category: data.category,
          subject: data.subject,
          message: data.message,
          priority: 2,
          status: 'OPEN',
          messages: {
            create: {
              authorType: 'USER',
              authorId: user.id,
              message: data.message,
            },
          },
        },
      });
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'SUPPORT_REPLY',
          title: 'Ticket created',
          body: `Your support ticket "${data.subject}" has been created. Our team will get back to you.`,
        },
      });
      return this.mapDetail(ticket, []);
    });
  }

  async listMine(user: SupportActor, params: { status?: string; page?: number; pageSize?: number }) {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100);
    const where: Record<string, unknown> = { userId: user.id };
    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          messages: { orderBy: { createdAt: 'asc' }, select: { authorType: true, createdAt: true } },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      items: items.map((t) => ({
        id: t.id,
        category: t.category,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messageCount: t.messages.length,
        lastAuthor: t.messages.length
          ? t.messages[t.messages.length - 1].authorType
          : 'USER',
        lastMessageAt: t.messages.length
          ? t.messages[t.messages.length - 1].createdAt
          : t.createdAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getMine(user: SupportActor, id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    if (ticket.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
    return this.mapDetail(ticket, ticket.messages);
  }

  async reply(user: SupportActor, id: string, data: { message: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    if (ticket.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
    if (ticket.status === 'CLOSED') {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportMessage.create({
        data: {
          ticketId: id,
          authorType: 'USER',
          authorId: user.id,
          message: data.message,
        },
      });
      await tx.supportTicket.update({
        where: { id },
        data: {
          status:
            ticket.status === 'CLOSED' || ticket.status === 'RESOLVED'
              ? 'OPEN'
              : 'WAITING_FOR_USER',
          updatedAt: new Date(),
        },
      });
      return created;
    });

    return message;
  }

  async updateStatus(user: SupportActor, id: string, data: { status: string }) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException('Support ticket not found');
    }
    if (ticket.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
    if (!USER_ALLOWED_STATUSES.includes(data.status)) {
      throw new BadRequestException('Invalid status');
    }
    // Users may only close/resolve their own ticket or reopen a resolved one.
    if (!['RESOLVED', 'OPEN', 'CLOSED'].includes(data.status)) {
      throw new BadRequestException('Users may only resolve, reopen, or close their tickets');
    }

    if (ticket.status === data.status) {
      return { id, status: ticket.status };
    }

    await this.prisma.supportTicket.update({
      where: { id },
      data: { status: data.status as never },
    });
    return { id, status: data.status };
  }

  private mapDetail(ticket: {
    id: string;
    userId: string;
    category: string;
    subject: string;
    message: string;
    priority: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }, messages: Array<{ id: string; authorType: string; authorId: string | null; message: string; createdAt: Date }>) {
    return {
      ticket: {
        id: ticket.id,
        category: ticket.category,
        subject: ticket.subject,
        message: ticket.message,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
      },
      messages,
    };
  }
}
