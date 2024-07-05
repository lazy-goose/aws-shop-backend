import { z } from "zod";

export const CreateProductCsv = z.object({
  product_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number({ coerce: true }),
  count: z.number({ coerce: true }).int(),
});

export type CreateProductCsv = z.infer<typeof CreateProductCsv>;
