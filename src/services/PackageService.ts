import axios from 'axios';
import { API_URL, ENDPOINTS } from '../config/constant';
import apiClient from '../api/apiClient';

// Package sizes enum
export enum PackageSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

// Package status enum
export enum PackageStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  PICKUP_READY = 'pickup_ready',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

// Interface for creating a package
export interface CreatePackageRequest {
  title: string;
  description?: string;
  size: PackageSize;
  weight: number;
  value?: number;
  isFragile: boolean;
  requireSignature: boolean;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupContactName: string;
  pickupContactPhone: string;
  pickupTimeWindow: string; // JSON string with start and end times
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryContactName: string;
  deliveryContactPhone: string;
  deliveryTimeWindow: string; // JSON string with start and end times
  notes?: string;
  isInsured: boolean;
}

// Package service
const packageService = {
  // Create a new package
  createPackage: async (packageData: CreatePackageRequest) => {
    try {
      console.log('Creating package with data:', packageData);
      
      const response = await apiClient.post(ENDPOINTS.CREATE_PACKAGE, packageData);
      
      console.log('Create package response:', response.data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to create package',
        };
      }
    } catch (error) {
      console.error('Create package error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            success: false,
            message: error.response.data?.message || 'Failed to create package',
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

  // Create multiple packages in bulk
  createBulkPackages: async (packagesData: CreatePackageRequest[]) => {
    try {
      const results = [];
      const errors = [];

      // Process packages sequentially
      for (const packageData of packagesData) {
        try {
          const result = await packageService.createPackage(packageData);
          if (result.success) {
            results.push(result.data);
          } else {
            errors.push({
              package: packageData.title,
              error: result.message
            });
          }
        } catch (error) {
          errors.push({
            package: packageData.title,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        successCount: results.length,
        failureCount: errors.length,
        results,
        errors
      };
    } catch (error) {
      console.error('Bulk package creation error:', error);
      return {
        success: false,
        message: 'Failed to process bulk package creation',
        successCount: 0,
        failureCount: packagesData.length,
        results: [],
        errors: [{ package: 'Bulk operation', error: 'Operation failed' }]
      };
    }
  },
  
  // Get all packages for the current user
  getUserPackages: async (status?: PackageStatus, page: number = 1, limit: number = 10) => {
    try {
      const params: any = { page, limit };
      if (status) {
        params.status = status;
      }
      
      const response = await apiClient.get(ENDPOINTS.USER_PACKAGES, { params });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
          count: response.data.count,
          totalPages: response.data.totalPages,
          currentPage: response.data.currentPage,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to get packages',
        };
      }
    } catch (error) {
      console.error('Get user packages error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to get packages',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Get package by ID
  getPackageById: async (id: string) => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.PACKAGES}/${id}`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to get package',
        };
      }
    } catch (error) {
      console.error('Get package error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to get package',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Track package by tracking code
  trackPackage: async (trackingCode: string) => {
    try {
      const response = await apiClient.get(ENDPOINTS.TRACK_PACKAGE, { 
        params: { trackingCode } 
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to track package',
        };
      }
    } catch (error) {
      console.error('Track package error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to track package',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Update a package
  updatePackage: async (id: string, packageData: Partial<CreatePackageRequest>) => {
    try {
      const response = await apiClient.put(`${ENDPOINTS.PACKAGES}/${id}`, packageData);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to update package',
        };
      }
    } catch (error) {
      console.error('Update package error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to update package',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Cancel a package
  cancelPackage: async (id: string) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.PACKAGES}/${id}/cancel`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Package cancelled successfully',
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to cancel package',
        };
      }
    } catch (error) {
      console.error('Cancel package error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to cancel package',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Mark package as picked up (carrier only)
  pickupPackage: async (id: string) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.PACKAGES}/${id}/pickup`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Package picked up successfully',
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to pickup package',
        };
      }
    } catch (error) {
      console.error('Pickup package error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to pickup package',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Mark package as delivered (carrier only)
  deliverPackage: async (id: string, deliveryCode?: string) => {
    try {
      const data = deliveryCode ? { deliveryCode } : {};
      const response = await apiClient.post(`${ENDPOINTS.PACKAGES}/${id}/deliver`, data);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Package delivered successfully',
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to deliver package',
        };
      }
    } catch (error) {
      console.error('Deliver package error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to deliver package',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Confirm package delivery (sender only)
  confirmDelivery: async (id: string) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.PACKAGES}/${id}/confirm`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Delivery confirmed successfully',
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to confirm delivery',
        };
      }
    } catch (error) {
      console.error('Confirm delivery error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to confirm delivery',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Report an issue with a package
  reportIssue: async (id: string, issueType: string, description: string) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.PACKAGES}/${id}/issues`, {
        issueType,
        description
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Issue reported successfully',
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to report issue',
        };
      }
    } catch (error) {
      console.error('Report issue error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to report issue',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Get package timeline
  getPackageTimeline: async (id: string) => {
    try {
      const response = await apiClient.get(`${ENDPOINTS.PACKAGES}/${id}/timeline`);
      
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to get package timeline',
        };
      }
    } catch (error) {
      console.error('Get package timeline error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to get package timeline',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
  
  // Upload package image
  uploadPackageImage: async (id: string, formData: FormData) => {
    try {
      const response = await apiClient.post(`${ENDPOINTS.PACKAGES}/${id}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Image uploaded successfully',
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          message: response.data?.message || 'Failed to upload image',
        };
      }
    } catch (error) {
      console.error('Upload package image error:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to upload image',
        };
      }
      
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  },
};

export default packageService;