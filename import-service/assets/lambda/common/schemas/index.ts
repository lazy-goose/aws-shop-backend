import { z } from "zod";

export const CreateProductFromCsvDto = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number({ coerce: true }),
  count: z.number({ coerce: true }).int(),
  imageUrl: z.string().optional(),
});

export const SQSMessageProductDto = CreateProductFromCsvDto.extend({
  product_id: z.string().uuid(),
});

export type CreateProductFromCsvDto = z.infer<typeof CreateProductFromCsvDto>;
export type SQSMessageProductDto = z.infer<typeof CreateProductFromCsvDto>;
