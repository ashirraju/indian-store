export type NotificationType = 'NEW_ORDER' | 'LOW_STOCK' | 'URGENT_SLA' | 'STATUS_UPDATE' | 'INFO' | string;

export interface NotificationMetadata {
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  totalAmount?: number;
  itemsCount?: number;
  deliverySla?: string;
  items?: Array<{ name: string; quantity: number; unitPrice: number }>;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  recipientRole: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string | null;
  metadata?: NotificationMetadata;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
}
