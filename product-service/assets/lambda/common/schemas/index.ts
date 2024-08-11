import { z } from "zod";
import { FALLBACK_PRODUCT_IMAGE_URL } from "../../../../constants";

/* Dynamodb tables */

export const Product = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  price: z.number(),
  imageUrl: z.string(),
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
  imageUrl: z
    .string()
    .optional()
    .transform((v) => v?.trim() || FALLBACK_PRODUCT_IMAGE_URL),
});

export const SQSCreateProductDto = CreateProductDto.extend({
  product_id: z.string().uuid(),
  price: z.number({ coerce: true }),
  count: z.number({ coerce: true }).int(),
});

export type CreateProductDto = z.infer<typeof CreateProductDto>;
export type SQSCreateProductDto = z.infer<typeof SQSCreateProductDto>;
