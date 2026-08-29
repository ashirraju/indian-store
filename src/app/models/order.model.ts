import { CartItem } from './product.model';
import { OrderStatus } from '../enums';

export { OrderStatus };

export interface OrderTimelineStep {
  status: OrderStatus;
  timestamp: string;
  completed: boolean;
  notes?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  state?: string;
  pincode: string;
  postcode?: string;
  items: CartItem[];
  totalAmount: number;
  paymentMethod: string;
  status: OrderStatus;
  placedAt: string;
  assignedDeliveryAgent?: string;
  deliveryNotes?: string;
  timeline: OrderTimelineStep[];
}
