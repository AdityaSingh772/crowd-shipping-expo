// API Configuration
// Update this with your actual backend IP address
export const API_URL = 'http://192.168.2.1:5001/api/v1'; // Replace X with your actual IP's last part

// Alternative options:
// export const API_URL = 'http://localhost:5001/api/v1'; // For iOS simulator
// export const API_URL = 'http://10.0.2.2:3000/api/v1'; // For Android emulator÷÷
// export const API_URL = 'https://your-deployed-backend.com/api/v1'; // For production

// Authentication Constants
export const AUTH_TOKEN_STORAGE_KEY = 'tokens';
export const USER_DATA_STORAGE_KEY = 'userData';
export const USER_TYPE_STORAGE_KEY = 'userType';

// User Roles
export const USER_ROLES = {
  SENDER: 'sender',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

// Message Constants
export const MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection and try again.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again later.',
};

// Regex Patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
  PHONE: /^\+?[0-9]{10,15}$/,
};

// Validation Messages
export const VALIDATION = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PASSWORD: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, and one number',
  INVALID_PHONE: 'Please enter a valid phone number',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
};

// Colors
export const COLORS = {
  PRIMARY: '#4A80F0',
  PRIMARY_LIGHT: '#e0e7ff',
  SECONDARY: '#64748b',
  BACKGROUND: '#f5f7fa',
  WHITE: '#ffffff',
  BLACK: '#1e293b',
  ERROR: '#ef4444',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  BORDER: '#cbd5e1',
  INPUT_BG: '#ffffff',
  DISABLED: '#94a3b8',
};

// Sizes
export const SIZES = {
  BASE: 8,
  FONT: 14,
  RADIUS: 8,
  PADDING: 24,
  
  // Font Sizes
  H1: 28,
  H2: 22,
  H3: 18,
  H4: 16,
  BODY: 14,
  SMALL: 12,
};