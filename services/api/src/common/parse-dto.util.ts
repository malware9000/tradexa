import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

export function parseDto<S extends z.ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    const message = first
      ? `${first.path.join('.') || 'value'}: ${first.message}`
      : 'Validation failed';
    throw new BadRequestException(message);
  }
  return parsed.data as z.output<S>;
}
