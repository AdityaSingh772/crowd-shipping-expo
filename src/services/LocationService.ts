// src/api/locationService.ts
import * as Location from 'expo-location';
import axios from 'axios';
import apiClient from '../api/apiClient';
import { ENDPOINTS, GOOGLE_MAPS_API_KEY } from '../config/constant';

// Location service
export const locationService = {
  // Get current location
  getCurrentLocation: async () => {
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        return {
          success: false,
          message: 'Permission to access location was denied',
        };
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      return {
        success: true,
        data: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get current location',
      };
    }
  },
  
  // Get coordinates from address
  getCoordinatesFromAddress: async (address:any) => {
    try {
      console.log('Geocoding address:', address);
      
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await axios.get(url);
      console.log('Geocoding response status:', response.status);
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        
        return {
          success: true,
          data: {
            latitude: location.lat,
            longitude: location.lng,
          },
          formattedAddress: response.data.results[0].formatted_address,
          address_components: response.data.results[0].address_components
        };
      } else {
        console.warn('Geocoding failed with status:', response.data.status);
        
        return {
          success: false,
          message: `Geocoding failed: ${response.data.status || 'Unknown error'}`,
        };
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to geocode address',
      };
    }
  },
  
  // Get address from coordinates
  getAddressFromCoordinates: async (latitude: any, longitude: any) => {
    try {
      console.log('Reverse geocoding coordinates:', latitude, longitude);
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await axios.get(url);
      console.log('Reverse geocoding response status:', response.status);
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return {
          success: true,
          data: response.data.results[0],
        };
      } else {
        console.warn('Reverse geocoding failed with status:', response.data.status);
        
        return {
          success: false,
          message: `Reverse geocoding failed: ${response.data.status || 'Unknown error'}`,
        };
      }
    } catch (error) {
      console.error('Error reverse geocoding coordinates:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reverse geocode coordinates',
      };
    }
  },
  
  // Calculate distance between coordinates using Haversine formula
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  },
  
  // Get saved addresses for current user
  getSavedAddresses: async () => {
    try {
      const response = await apiClient.get(ENDPOINTS.SAVED_ADDRESSES);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to get saved addresses',
        };
      }
    } catch (error: any) {
      console.error('Error getting saved addresses:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to get saved addresses',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Network error. Server might be down or unreachable.',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Save a new address
  saveAddress: async (addressData: any) => {
    try {
      const response = await apiClient.post(ENDPOINTS.SAVED_ADDRESSES, addressData);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Address saved successfully',
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to save address',
        };
      }
    } catch (error: any) {
      console.error('Error saving address:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to save address',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Network error. Server might be down or unreachable.',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Update a saved address
  updateAddress: async (id: any, addressData: any) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.SAVED_ADDRESSES}/${id}`, addressData);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Address updated successfully',
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to update address',
        };
      }
    } catch (error: any) {
      console.error('Error updating address:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to update address',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Network error. Server might be down or unreachable.',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Delete a saved address
  deleteAddress: async (id: any) => {
    try {
      const response = await apiClient.delete(`${ENDPOINTS.SAVED_ADDRESSES}/${id}`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Address deleted successfully',
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to delete address',
        };
      }
    } catch (error: any) {
      console.error('Error deleting address:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to delete address',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Network error. Server might be down or unreachable.',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Get distance and duration between points from Google Distance Matrix API
  getRouteInfo: async (origin: { latitude: any; longitude: any; }, destination: { latitude: any; longitude: any; }, mode = 'driving') => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await axios.get(url);
      
      if (
        response.data.status === 'OK' &&
        response.data.rows.length > 0 &&
        response.data.rows[0].elements.length > 0 &&
        response.data.rows[0].elements[0].status === 'OK'
      ) {
        return {
          success: true,
          data: {
            distance: response.data.rows[0].elements[0].distance,
            duration: response.data.rows[0].elements[0].duration,
          },
        };
      } else {
        return {
          success: false,
          message: `Failed to get route info: ${response.data.status || 'Unknown error'}`,
        };
      }
    } catch (error) {
      console.error('Error getting route info:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get route info',
      };
    }
  },
  
  // Save recent location to local storage
  saveRecentLocation: async (location: any) => {
    try {
      // Save recent location to backend
      const response = await apiClient.post(`${ENDPOINTS.SAVED_ADDRESSES}/recent`, location);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Location saved successfully',
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to save location',
        };
      }
    } catch (error: any) {
      console.error('Error saving recent location:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to save location',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Network error. Server might be down or unreachable.',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Get recent locations
  getRecentLocations: async () => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.SAVED_ADDRESSES}/recent`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to get recent locations',
        };
      }
    } catch (error: any) {
      console.error('Error getting recent locations:', error);
      
      if (error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to get recent locations',
        };
      } else if (error.request) {
        return {
          success: false,
          message: 'Network error. Server might be down or unreachable.',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
};

// Helper function to convert degrees to radians
function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default locationService;