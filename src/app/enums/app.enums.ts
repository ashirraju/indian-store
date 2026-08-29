/**
 * Application Enums & String Constant Definitions
 */

// ==========================================
// USER & STAFF ROLES
// ==========================================
export enum AppRoleEnum {
  CUSTOMER = 'Customer',
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  OPERATIONS = 'Operations',
  DELIVERY = 'Delivery'
}

export type AppRole = 'Customer' | 'Manager' | 'Operations' | 'Delivery' | 'Admin' | AppRoleEnum;
export const AppRole = AppRoleEnum;

// ==========================================
// APPLICATION NAVIGATION ROUTES
// ==========================================
export enum AppRoutesEnum {
  STORE = '/store',
  ADMIN = '/admin',
  MANAGER = '/manager',
  OPERATIONS = '/operations',
  DELIVERY = '/delivery'
}

export type AppRoutes = '/store' | '/admin' | '/manager' | '/operations' | '/delivery' | AppRoutesEnum;
export const AppRoutes = AppRoutesEnum;

// ==========================================
// ORDER STATUS ENUM
// ==========================================
export enum OrderStatusEnum {
  PLACED = 'Placed',
  IN_PACKING = 'In Packing',
  READY_FOR_DISPATCH = 'Ready for Dispatch',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered'
}

export type OrderStatus = 'Placed' | 'In Packing' | 'Ready for Dispatch' | 'Out for Delivery' | 'Delivered' | OrderStatusEnum;
export const OrderStatus = OrderStatusEnum;

// ==========================================
// TOAST NOTIFICATION TYPES
// ==========================================
export enum ToastTypeEnum {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

export type ToastType = 'success' | 'info' | 'warning' | 'error' | ToastTypeEnum;
export const ToastType = ToastTypeEnum;

// ==========================================
// LOCAL & SESSION STORAGE KEYS
// ==========================================
export enum StorageKeysEnum {
  AUTH_USER = 'kc_auth_user',
  AUTH_TOKEN = 'kc_auth_token',
  TARGET_PATH = 'kc_target_path',
  TARGET_ROLE = 'kc_target_role',
  CART = 'indian_store_cart',
  WISHLIST = 'indian_store_wishlist'
}

export type StorageKeys = 'kc_auth_user' | 'kc_auth_token' | 'kc_target_path' | 'kc_target_role' | 'indian_store_cart' | 'indian_store_wishlist' | StorageKeysEnum;
export const StorageKeys = StorageKeysEnum;

// ==========================================
// AUSTRALIAN STATES & TERRITORIES
// ==========================================
export enum AustralianStateEnum {
  NSW = 'NSW',
  VIC = 'VIC',
  QLD = 'QLD',
  WA = 'WA',
  SA = 'SA',
  ACT = 'ACT',
  TAS = 'TAS',
  NT = 'NT'
}

export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'ACT' | 'TAS' | 'NT' | AustralianStateEnum;
export const AustralianState = AustralianStateEnum;

// ==========================================
// PAYMENT METHODS
// ==========================================
export enum PaymentMethodEnum {
  CREDIT_CARD = 'Credit / Debit Card',
  PAYPAL = 'PayPal',
  AFTERPAY = 'Afterpay',
  ZIP = 'Zip Pay',
  APPLE_PAY = 'Apple Pay',
  COD = 'Cash on Delivery'
}

export type PaymentMethod =
  | 'Credit / Debit Card'
  | 'PayPal'
  | 'Afterpay'
  | 'Zip Pay'
  | 'Apple Pay'
  | 'Cash on Delivery'
  | PaymentMethodEnum;
export const PaymentMethod = PaymentMethodEnum;
