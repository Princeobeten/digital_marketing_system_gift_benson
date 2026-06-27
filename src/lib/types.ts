/** Plain JSON shapes returned by the API (ObjectIds serialized to strings). */

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  interests: string[];
  tags: string[];
  totalSpend: number;
  lastPurchaseAt?: string | null;
  source: string;
  createdAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  brand?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
}

export interface SegmentRule {
  field: string;
  operator: string;
  value: string | number;
}

export interface Segment {
  _id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
  createdAt?: string;
}

export interface CampaignMetrics {
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
}

export interface Campaign {
  _id: string;
  name: string;
  channel: "email" | "sms" | "social";
  subject?: string;
  body?: string;
  products: string[] | Product[];
  segment?: string | Segment | null;
  scheduledAt?: string | null;
  status: "draft" | "scheduled" | "sent";
  metrics: CampaignMetrics;
  sentAt?: string | null;
  createdAt?: string;
}
