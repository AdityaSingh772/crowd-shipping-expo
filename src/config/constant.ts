// src/config/constant.ts

// API Configuration
export const API_URL = 'http://192.168.161.170:5001'; // Your backend server address
export const GOOGLE_MAPS_API_KEY = 'AIzaSyCWccCdcc_GtrsBoM_3oz5luJpYyc9mweg'; // Replace with your actual API key

// Colors
export const COLORS = {
  PRIMARY: '#2A5D3C',
  PRIMARY_LIGHT: '#E8F5E0',
  SECONDARY: '#64748b',
  BLACK: '#1e293b',
  WHITE: '#FFFFFF',
  BACKGROUND: '#f5f7fa',
  BORDER: '#cbd5e1',
  ERROR: '#ef4444',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  DISABLED: '#94a3b8',
  API_URL: API_URL, // For debugging display
};

// Sizes
export const SIZES = {
  H1: 28,
  H2: 24,
  H3: 20,
  H4: 18,
  BODY: 16,
  SMALL: 14,
  TINY: 12,
  PADDING: 24,
  MARGIN: 16,
  RADIUS: 8,
};

// Patterns for validation
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[0-9]{10,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
};

// Validation messages
export const VALIDATION = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  PASSWORD_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_MATCH: 'Passwords do not match',
  PASSWORD_STRENGTH: 'Password must contain uppercase, lowercase, and numbers',
};

// Navigation routes
export const ROUTES = {
  // Auth routes
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  RESET_PASSWORD: 'ResetPassword',
  
  // Main routes
  HOME: 'Home',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  
  // Package routes
  CREATE_ORDER: 'OrderAssignment',
  TRACK_PACKAGE: 'TrackingScreen',
  PACKAGE_DETAILS: 'PackageDetails',
  ORDER_HISTORY: 'OrderHistory',
  PAYMENT: 'PaymentScreen',
  
  // Carrier routes
  AVAILABLE_ORDERS: 'AvailableOrders',
  DELIVERY_HISTORY: 'DeliveryHistory',
  DELIVERY_DETAILS: 'DeliveryDetails',
  DELIVERY_DASHBOARD: 'DeliveryPartnerDashboard',
};

// API endpoints
export const ENDPOINTS = {
  // Auth endpoints
  REGISTER: '/users/register',
  LOGIN: '/users/login',
  LOGOUT: '/users/logout',
  FORGOT_PASSWORD: '/users/forgot-password',
  RESET_PASSWORD: '/users/reset-password',
  VERIFY_EMAIL: '/users/verify-email',
  RESEND_VERIFICATION: '/users/resend-verification',
  CURRENT_USER: '/users/me',
  UPDATE_USER: '/users/me',
  UPDATE_PASSWORD: '/users/me/password',
  
  // Package endpoints
  PACKAGES: '/packages',
  CREATE_PACKAGE: '/packages',
  USER_PACKAGES: '/packages/user',
  TRACK_PACKAGE: '/packages/track',
  
  // Location and address endpoints
  SAVED_ADDRESSES: '/users/addresses',
  
  // Payment endpoints
  PAYMENT_METHODS: '/users/payment-methods',
  ADD_PAYMENT_METHOD: '/payments/methods',
  PROCESS_PAYMENT: '/payments/process',
  PAYMENT_HISTORY: '/payments/history',
  
  // Carrier endpoints
  AVAILABLE_PACKAGES: '/packages/available',
  CARRIER_PACKAGES: '/packages/carrier',
  CARRIER_PROFILE: '/users/carrier-profile',
  
  // Notification endpoints
  NOTIFICATIONS: '/notifications',
  NOTIFICATION_SETTINGS: '/users/notification-settings',
  
  // Rating endpoints
  RATE_DELIVERY: '/packages/:id/rate',
  RATE_CARRIER: '/users/carriers/:id/rate',
};

// Package sizes
export const PACKAGE_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  EXTRA_LARGE: 'extra_large',
};

// Package statuses
export const PACKAGE_STATUS = {
  PENDING: 'pending',
  MATCHED: 'matched',
  PICKUP_READY: 'pickup_ready',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

// Status colors
export const STATUS_COLORS = {
  pending: '#f59e0b', // Amber
  matched: '#3b82f6', // Blue
  pickup_ready: '#8b5cf6', // Violet
  in_transit: '#10b981', // Emerald
  delivered: '#16a34a', // Green
  cancelled: '#ef4444', // Red
  returned: '#6b7280', // Gray
};

// Storage keys
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  TOKENS: 'tokens',
  USER_TYPE: 'userType',
  SAVED_ADDRESSES: 'savedAddresses',
  RECENT_LOCATIONS: 'recentLocations',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATION_SETTINGS: 'notificationSettings',
};

// Date formats
export const DATE_FORMATS = {
  FULL: 'MMMM DD, YYYY hh:mm A',
  DATE_ONLY: 'MMMM DD, YYYY',
  TIME_ONLY: 'hh:mm A',
  SHORT_DATE: 'MM/DD/YYYY',
  API_FORMAT: 'YYYY-MM-DD',
};

// Vehicle types for carriers
export const VEHICLE_TYPES = {
  BICYCLE: 'bicycle',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car',
  VAN: 'van',
  TRUCK: 'truck',
};

// User types
export const USER_TYPES = {
  SENDER: 'sender',
  CARRIER: 'carrier',
  ADMIN: 'admin',
};

export default {
  API_URL,
  GOOGLE_MAPS_API_KEY,
  COLORS,
  SIZES,
  PATTERNS,
  VALIDATION,
  ROUTES,
  ENDPOINTS,
  PACKAGE_SIZES,
  PACKAGE_STATUS,
  STATUS_COLORS,
  STORAGE_KEYS,
  DATE_FORMATS,
  VEHICLE_TYPES,
  USER_TYPES,
};