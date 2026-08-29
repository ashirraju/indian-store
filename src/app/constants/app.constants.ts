/**
 * Application Constants
 */

// ==========================================
// KEYCLOAK IAM CONFIGURATION
// ==========================================
export const KEYCLOAK_CONFIG = {
  URL: 'http://localhost:8080',
  REALM: 'indian-store',
  CLIENT_ID: 'indian-store-public'
} as const;

// ==========================================
// BACKEND API ENDPOINTS
// ==========================================
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5001/api/v1',
  HEALTH_URL: 'http://localhost:5001/api/health',
  DOCS_URL: 'http://localhost:5001/api-docs/json'
} as const;

// ==========================================
// LOCAL & SESSION STORAGE KEYS
// ==========================================
export const STORAGE_KEYS = {
  AUTH_USER: 'kc_auth_user',
  AUTH_TOKEN: 'kc_auth_token',
  TARGET_PATH: 'kc_target_path',
  TARGET_ROLE: 'kc_target_role',
  CART: 'indian_store_cart',
  WISHLIST: 'indian_store_wishlist'
} as const;

// ==========================================
// AUSTRALIAN STORE & BUSINESS CONFIGURATION
// ==========================================
export const STORE_CONFIG = {
  NAME: 'Desi Aussie Bazaar',
  TAGLINE: 'Australia’s #1 Destination for Authentic Indian Groceries & Daily Needs',
  COUNTRY: 'Australia',
  CURRENCY: 'AUD',
  CURRENCY_SYMBOL: '$',
  TAX_RATE: 0.10, // 10% GST
  FREE_SHIPPING_THRESHOLD: 75, // $75 AUD
  STANDARD_SHIPPING_FEE: 9.99, // $9.99 AUD
  DEFAULT_STATE: 'NSW',
  DEFAULT_POSTCODE: '2000',
  HELPLINE: '1300 463 426',
  EMAIL: 'support@desiaussiebazaar.com.au',
  ABN: '48 612 390 124',
  DISTRIBUTION_HUBS: {
    SYDNEY: {
      NAME: 'Sydney Central Distribution Hub',
      ADDRESS: 'Unit 4, 15-17 Wentworth St, Parramatta NSW 2150'
    },
    MELBOURNE: {
      NAME: 'Melbourne Fulfilment Hub',
      ADDRESS: '108 Collins Street, Melbourne VIC 3000'
    }
  }
} as const;

// ==========================================
// APPLICATION ROUTES & PROTECTED ROLES
// ==========================================
export const APP_ROUTES = {
  STORE: '/store',
  ADMIN: '/admin',
  MANAGER: '/manager',
  OPERATIONS: '/operations',
  DELIVERY: '/delivery'
} as const;

export const PROTECTED_ROLES = ['Admin', 'Manager', 'Operations', 'Delivery'] as const;
