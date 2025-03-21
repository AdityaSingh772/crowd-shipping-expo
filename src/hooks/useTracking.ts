// hooks/useTracking.ts
import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constant';

// Import package status enum
export enum PackageStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  PICKUP_READY = 'pickup_ready',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

// Import package size enum
export enum PackageSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

// Package interface based on backend model
export interface Package {
  id: string;
  title: string;
  description?: string;
  size: PackageSize;
  weight: number;
  isFragile: boolean;
  requireSignature: boolean;
  status: PackageStatus;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupTimeWindow: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryContactName: string;
  deliveryContactPhone: string;
  deliveryTimeWindow: string;
  trackingCode: string;
  distance: number;
  isInsured: boolean;
  price: number;
  pickupTime?: string;
  deliveryTime?: string;
  estimatedDeliveryTime?: string;
  carrierId?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TrackingHistory {
  [key: string]: Package;
}

export interface UserInfo {
  userId?: string;
  userRole?: string;
}

export const useTracking = (userInfo?: UserInfo) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<Package | null>(null);
  const [trackingHistory, setTrackingHistory] = useState<TrackingHistory>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load tracking history from storage on mount
  useEffect(() => {
    const loadTrackingHistory = async () => {
      try {
        const savedHistory = await AsyncStorage.getItem('trackingHistory');
        const savedSearches = await AsyncStorage.getItem('recentSearches');
        
        if (savedHistory) {
          setTrackingHistory(JSON.parse(savedHistory));
        }
        
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }
      } catch (err) {
        console.error('Failed to load tracking history:', err);
      }
    };
    
    loadTrackingHistory();
  }, []);

  // Save tracking history to storage when it changes
  useEffect(() => {
    const saveTrackingHistory = async () => {
      if (Object.keys(trackingHistory).length > 0) {
        try {
          await AsyncStorage.setItem('trackingHistory', JSON.stringify(trackingHistory));
        } catch (err) {
          console.error('Failed to save tracking history:', err);
        }
      }
    };
    
    saveTrackingHistory();
  }, [trackingHistory]);

  // Save recent searches to storage when they change
  useEffect(() => {
    const saveRecentSearches = async () => {
      if (recentSearches.length > 0) {
        try {
          await AsyncStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        } catch (err) {
          console.error('Failed to save recent searches:', err);
        }
      }
    };
    
    saveRecentSearches();
  }, [recentSearches]);

  // Track a package by tracking code
  const trackPackage = useCallback(async (trackingCode: string) => {
    if (!trackingCode.trim()) {
      setError('Please enter a package ID or tracking number');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // First check if we have a cached result
      
      
    //   if (trackingHistory[trackingCode]) {
    //     // Only use cache if it's from the last hour
    //     const cacheTime = new Date(trackingHistory[trackingCode].updatedAt || '');
    //     const now = new Date();
    //     const diffMs = now.getTime() - cacheTime.getTime();
    //     const diffMins = Math.floor(diffMs / 60000);
        
    //     if (diffMins < 60) {
    //       setTrackingResult(trackingHistory[trackingCode]);
          
    //       // Add to recent searches if not already there
    //       updateRecentSearches(trackingCode);
          
    //       setLoading(false);
    //       return trackingHistory[trackingCode];
    //     }
    //   }

      // Prepare headers with authentication token
      const token = await AsyncStorage.getItem('token');
      console.log('Token exists:', !!token);
      if(!token){
        setError("You need to log in first");
        setLoading(false);
        throw new Error('Authentication Required');
      }
      const headers = { Authorization: `Bearer ${token}` };
      
      // Make API call to /packages/:id endpoint
      const response = await axios.get(`${API_URL}/api/v1/packages/${trackingCode}`, {
        headers
      });
      
      const packageData = response.data.data;
      
      // Update tracking result
      setTrackingResult(packageData);
      
      // Add to tracking history
      setTrackingHistory(prev => ({
        ...prev,
        [trackingCode]: packageData
      }));
      
      // Add to recent searches
      updateRecentSearches(trackingCode);
      
      return packageData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to find package. Please check the tracking number.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [trackingHistory]);

  // Update recent searches
  const updateRecentSearches = useCallback((packageId: string) => {
    setRecentSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(code => code !== packageId);
      
      // Add to beginning (most recent)
      const updated = [packageId, ...filtered];
      
      // Limit to 5 recent searches
      return updated.slice(0, 5);
    });
  }, []);

  // Get package status updates
  const refreshPackageStatus = useCallback(async (packageId: string) => {
    try {
      setLoading(true);
      
      // Prepare headers with authentication token
      const token = await AsyncStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Make API call to /packages/:id endpoint
      const response = await axios.get(`${API_URL}/api/v1/packages/${packageId}`, {
        headers
      });
      
      const packageData = response.data.data;
      
      // Update tracking result if it's the currently viewed package
      if (trackingResult?.id === packageId || trackingResult?.trackingCode === packageId) {
        setTrackingResult(packageData);
      }
      
      // Update in history
      setTrackingHistory(prev => ({
        ...prev,
        [packageId]: packageData
      }));
      
      return packageData;
    } catch (err) {
      console.error(`Failed to refresh package status for ${packageId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [trackingResult]);

  // Clear a specific tracking result from history
  const clearTrackingHistory = useCallback(async (packageId: string) => {
    setTrackingHistory(prev => {
      const updated = { ...prev };
      delete updated[packageId];
      return updated;
    });
    
    // Also remove from recent searches
    setRecentSearches(prev => prev.filter(code => code !== packageId));
  }, []);

  // Clear all tracking history
  const clearAllTrackingHistory = useCallback(async () => {
    setTrackingHistory({});
    setRecentSearches([]);
    try {
      await AsyncStorage.removeItem('trackingHistory');
      await AsyncStorage.removeItem('recentSearches');
    } catch (err) {
      console.error('Failed to clear tracking history:', err);
    }
  }, []);

  // Clear current tracking result
  const clearTracking = useCallback(() => {
    setTrackingResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    trackingResult,
    trackingHistory,
    recentSearches,
    trackPackage,
    refreshPackageStatus,
    clearTracking,
    clearTrackingHistory,
    clearAllTrackingHistory,
  };
};

export default useTracking;