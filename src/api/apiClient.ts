// src/api/apiClient.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constant';

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

// Helper function to test API connection
export const testConnection = async () => {
  try {
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
};

export default apiClient;