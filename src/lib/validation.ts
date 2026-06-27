import { z } from "zod";
import {
  CAMPAIGN_CHANNELS,
  CUSTOMER_SOURCES,
  GADGET_CATEGORIES,
  USER_ROLES,
} from "./constants";

export const registerSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(USER_ROLES).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional().default(""),
  location: z.string().optional().default(""),
  interests: z.array(z.enum(GADGET_CATEGORIES)).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  totalSpend: z.coerce.number().min(0).optional().default(0),
  source: z.enum(CUSTOMER_SOURCES).optional().default("Walk-in"),
});

export const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  category: z.enum(GADGET_CATEGORIES),
  brand: z.string().optional().default(""),
  price: z.coerce.number().min(0, "Price must be positive"),
  stock: z.coerce.number().min(0).optional().default(0),
  imageUrl: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export const ruleSchema = z.object({
  field: z.string(),
  operator: z.string(),
  value: z.union([z.string(), z.number()]),
});

export const segmentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  description: z.string().optional().default(""),
  rules: z.array(ruleSchema).default([]),
});

export const campaignSchema = z.object({
  name: z.string().min(2, "Name is required"),
  channel: z.enum(CAMPAIGN_CHANNELS).default("email"),
  subject: z.string().optional().default(""),
  body: z.string().optional().default(""),
  products: z.array(z.string()).optional().default([]),
  segment: z.string().nullable().optional(),
  scheduledAt: z.string().nullable().optional(),
});

export const aiGenerateSchema = z.object({
  productName: z.string().optional().default(""),
  category: z.string().optional().default(""),
  offer: z.string().min(3, "Describe the offer or goal"),
  tone: z.string().optional().default("friendly and persuasive"),
  channel: z.enum(CAMPAIGN_CHANNELS).default("email"),
});
