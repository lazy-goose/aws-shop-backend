import { z } from "zod";

/* Dynamodb tables */

export const Product = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number(),
});

export const Stock = z.object({
  product_id: z.string().uuid(),
  count: z.number().int(),
});

export type Product = z.infer<typeof Product>;
export type Stock = z.infer<typeof Stock>;

/* Transfer data */

export const CreateProductDto = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number(),
  count: z.number().int(),
});

export type CreateProductDto = z.infer<typeof CreateProductDto>;
