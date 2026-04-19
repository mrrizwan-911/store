import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

export const quotationItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(10, "Minimum quantity for quotation is 10 units"),
  notes: z.string().optional(),
});

export const quotationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
});

export const quotationUpdateSchema = z.object({
  status: z.nativeEnum(QuotationStatus).optional(),
  aiDraft: z.string().optional(),
  expiresAt: z.string().datetime().or(z.date()).optional(),
});

export type QuotationInput = z.infer<typeof quotationSchema>;
export type QuotationUpdateInput = z.infer<typeof quotationUpdateSchema>;
