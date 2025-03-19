import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, ENDPOINTS } from '../config/constant';
import { UserType } from '../context/AuthContext';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,  // Adding /api/v1 here once
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for slower networks
});

console.log('API base URL:', apiClient.defaults.baseURL);

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

// Auth service
export const authService = {
  // Test API connection
  testConnection: async () => {
    try {
      // Ping server firs
      
      // Try a simple GET request to the root endpoint
      const response = await apiClient.get('/');
      
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
          errorMessage = `Connection refused. Make sure your server at ${API_URL}/api/v1 is running.`;
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
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phoneNumber: string,
  role: string,
  vehicleType?: string
) => {
  try {
   
    // Build request data according to your backend controller requirements
    const requestData = {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      // Use 'carrier' if that's what your backend accepts, or convert from 'carrier' to 'driver' if needed
      role: role === 'carrier' ? 'carrier' : 'sender',
    };
    
    // The vehicleType is not used in the controller, so we can remove it from the request
    // Note: Looking at your backend code, vehicleDetails is not processed in registerUser
    
    console.log('Registration request data:', requestData);
    
    // Make API call
    const response = await apiClient.post(ENDPOINTS.REGISTER, requestData);
    
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
        // Provide more detailed error information
        console.error('Registration error response data:', error.response.data);
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
     
      
      console.log('Login request:', { email, userType });
      
      const response = await apiClient.post(ENDPOINTS.LOGIN, {
        email,
        password
      });
      
      console.log('Login response status:', response.status);
      
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
  
  // All other methods using ENDPOINTS constants
  logout: async () => {
    try {
      // Call logout endpoint to invalidate refresh token
      await apiClient.post(ENDPOINTS.LOGOUT).catch(() => {
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
  
      
      const response = await apiClient.post(ENDPOINTS.FORGOT_PASSWORD, { email });
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
      const response = await apiClient.post(`${ENDPOINTS.RESET_PASSWORD}/${token}`, { password });
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
   
      
      const response = await apiClient.get(ENDPOINTS.CURRENT_USER);
      
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

  // Verify email
  verifyEmail: async (token: string) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.VERIFY_EMAIL}/${token}`);
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Email verification error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Email verification failed',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Resend verification email
  resendVerification: async () => {
    try {
      const response = await apiClient.post(ENDPOINTS.RESEND_VERIFICATION);
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to resend verification',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Update user profile
  updateProfile: async (profileData: any) => {
    try {
      const response = await apiClient.put(ENDPOINTS.UPDATE_USER, profileData);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to update profile',
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to update profile',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },

  // Update password
  updatePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const response = await apiClient.put(ENDPOINTS.UPDATE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      
      return {
        success: response.data.success,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Update password error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to update password',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
};

export default authService;