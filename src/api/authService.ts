import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constant';
import { UserType } from '../context/AuthContext';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for slower networks
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const tokensString = await AsyncStorage.getItem('tokens');
      if (tokensString) {
        const tokens = JSON.parse(tokensString);
        config.headers.Authorization = `Bearer ${tokens.accessToken}`;
      }
    } catch (error) {
      console.error('Error setting auth header:', error);
    }
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    if (config.data) {
      console.log('Request payload:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response error data:', error.response.data);
        console.error('Response error status:', error.response.status);
        console.error('Response error headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        
        // If timeout error
        if (error.code === 'ECONNABORTED') {
          console.error('Request timed out. Please check server availability.');
        }
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', error.message);
      }
      console.error('Error config:', error.config);
    } else {
      console.error('Non-Axios error:', error);
    }
    return Promise.reject(error);
  }
);

// Helper function to ping the server
const pingServer = async () => {
  try {
    // Simple HEAD request that should be fast
    await axios.head(API_URL, { timeout: 5000 });
    return true;
  } catch (error) {
    console.error('Server ping failed:', error);
    return false;
  }
};

// Auth service
export const authService = {
  // Test API connection
  testConnection: async () => {
    try {
      // Ping server first
      const isReachable = await pingServer();
      
      if (!isReachable) {
        return {
          success: false,
          message: `Failed to connect to API server at ${API_URL}. Please check if the server is running and reachable.`
        };
      }
      
      // Try a simple GET request to the root endpoint
      const response = await axios.get(API_URL, { timeout: 10000 });
      
      return {
        success: true,
        message: 'API connection successful',
        data: response.data
      };
    } catch (error) {
      console.error('API connection test error:', error);
      
      let errorMessage = 'Failed to connect to API';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          errorMessage = `Connection refused. Make sure your server at ${API_URL} is running.`;
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timed out. Server might be slow or unreachable.';
        }
      }
      
      return {
        success: false,
        message: errorMessage
      };
    }
  },

  // Register a new user
  register: async (
    name: string,
    email: string,
    password: string,
    userType: UserType,
    phoneNumber?: string,
    vehicleType?: string
  ) => {
    try {
      // First check if server is reachable
      const isReachable = await pingServer();
      if (!isReachable) {
        return {
          success: false,
          message: 'Cannot connect to server. Please check your network or server status.',
        };
      }
      
      // Split name into first and last name
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
      
      // Build request data
      const requestData = {
        firstName,
        lastName,
        email,
        password,
        phoneNumber: phoneNumber || '',
        role: userType === 'partner' ? 'driver' : 'sender',
      };
      
      if (userType === 'partner' && vehicleType) {
        // @ts-ignore
        requestData.vehicleType = vehicleType;
      }
      
      console.log('Registration request data:', requestData);
      
      // Make API call
      const response = await apiClient.post('/users/register', requestData);
      
      console.log('Registration response status:', response.status);
      console.log('Registration response data:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || response.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Registration failed for unknown reason',
        };
      }
    } catch (error) {
      console.error('Registration error details:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            success: false,
            message: error.response.data?.message || 'Registration failed',
          };
        } else if (error.request) {
          // Network error - no response received
          return {
            success: false,
            message: 'Network error. Server might be down or unreachable.',
          };
        }
      }
      
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
      };
    }
  },
  
  // Login user
  login: async (email: string, password: string, userType: UserType) => {
    try {
      // First check if server is reachable
      const isReachable = await pingServer();
      if (!isReachable) {
        return {
          success: false,
          message: 'Cannot connect to server. Please check your network or server status.',
        };
      }
      
      console.log('Login request:', { email, userType });
      
      const response = await apiClient.post('/users/login', {
        email,
        password,
        role: userType === 'partner' ? 'driver' : 'sender',
      });
      
      console.log('Login response status:', response.status);
      console.log('Login response data type:', typeof response.data);
      
      if (response.data && response.data.success) {
        const userData = response.data.data?.user || response.data.user;
        const tokensData = response.data.data?.tokens || response.data.tokens;
        
        if (!userData || !tokensData) {
          throw new Error('Invalid response format. Missing user or token data.');
        }
        
        // Store auth tokens and user data
        await Promise.all([
          AsyncStorage.setItem('userData', JSON.stringify(userData)),
          AsyncStorage.setItem('tokens', JSON.stringify(tokensData)),
          AsyncStorage.setItem('userType', userType)
        ]);
        
        return {
          success: true,
          data: { 
            user: userData, 
            tokens: tokensData 
          },
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Login failed for unknown reason',
        };
      }
    } catch (error) {
      console.error('Login error details:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            success: false,
            message: error.response.data?.message || 'Login failed',
          };
        } else if (error.request) {
          return {
            success: false,
            message: 'No response from server. Please check your connection.',
          };
        }
      }
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Network error. Please try again.',
      };
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      // Call logout endpoint to invalidate refresh token
      await apiClient.post('/users/logout').catch(() => {
        // Ignore logout endpoint errors
        console.log('Logout endpoint error ignored');
      });
      
      // Remove tokens and user data from storage
      await Promise.all([
        AsyncStorage.removeItem('userData'),
        AsyncStorage.removeItem('tokens'),
        AsyncStorage.removeItem('userType')
      ]);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if API call fails, clear local storage
      await Promise.all([
        AsyncStorage.removeItem('userData'),
        AsyncStorage.removeItem('tokens'),
        AsyncStorage.removeItem('userType')
      ]);
      
      return { success: true };
    }
  },
  
  // Forgot password
  forgotPassword: async (email: string) => {
    try {
      // Check server connectivity first
      const isReachable = await pingServer();
      if (!isReachable) {
        return {
          success: false,
          message: 'Cannot connect to server. Please check your network or server status.',
        };
      }
      
      const response = await apiClient.post('/users/forgot-password', { email });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // For security reasons, we might still want to show success message
      // but we'll log the actual error and return a failure for debugging
      if (axios.isAxiosError(error) && error.request && !error.response) {
        return {
          success: false,
          message: 'Network error. Please check your connection and try again.',
        };
      }
      
      // For security reasons, still show the standard message
      return {
        success: true,
        message: 'If your email is registered, you will receive a password reset link.',
      };
    }
  },
  
  // Reset password
  resetPassword: async (token: string, password: string) => {
    try {
      const response = await apiClient.post(`/users/reset-password/${token}`, { password });
      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            success: false,
            message: error.response.data?.message || 'Failed to reset password',
          };
        } else if (error.request) {
          return {
            success: false,
            message: 'Network error. Server might be down or unreachable.',
          };
        }
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Get current user
  getCurrentUser: async () => {
    try {
      // Check connectivity first
      const isReachable = await pingServer();
      if (!isReachable) {
        return {
          success: false,
          message: 'Cannot connect to server. Please check your network or server status.',
        };
      }
      
      const response = await apiClient.get('/users/me');
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data || response.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to get user profile',
        };
      }
    } catch (error) {
      console.error('Get user profile error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            success: false,
            message: error.response.data?.message || 'Failed to get user profile',
          };
        } else if (error.request) {
          return {
            success: false,
            message: 'Network error. Server might be down or unreachable.',
          };
        }
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
};

export default authService;