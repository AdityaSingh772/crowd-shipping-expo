// src/types/package.ts

/**
 * Enum for package statuses
 */
 export enum PackageStatus {
    PENDING = 'pending',
    MATCHED = 'matched',
    PICKUP_READY = 'pickup_ready',
    IN_TRANSIT = 'in_transit',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
    RETURNED = 'returned',
  }
  
  /**
   * Enum for package sizes
   */
  export enum PackageSize {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
    EXTRA_LARGE = 'extra_large',
  }
  
  /**
   * Interface for time window
   */
  export interface TimeWindow {
    start: Date | string; // ISO date string when serialized
    end: Date | string; // ISO date string when serialized
  }
  
  /**
   * Interface for package location
   */
  export interface PackageLocation {
    address: string;
    latitude: number;
    longitude: number;
    contactName: string;
    contactPhone: string;
    timeWindow: TimeWindow | string; // String when serialized as JSON
  }
  
  /**
   * Interface for package timeline entry
   */
  export interface PackageTimelineEntry {
    id: string;
    packageId: string;
    status: PackageStatus;
    description: string;
    userId: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    createdAt: Date | string;
  }
  
  /**
   * Interface for package data
   */
  export interface Package {
    id: string;
    senderId: string;
    carrierId?: string;
    title: string;
    description?: string;
    size: PackageSize;
    weight: number;
    value?: number;
    isFragile: boolean;
    requireSignature: boolean;
    status: PackageStatus;
    pickupAddress: string;
    pickupLatitude: number;
    pickupLongitude: number;
    pickupContactName: string;
    pickupContactPhone: string;
    pickupTimeWindow: string; // JSON string
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryContactName: string;
    deliveryContactPhone: string;
    deliveryTimeWindow: string; // JSON string
    trackingCode: string;
    deliveryCode?: string;
    price: number;
    commissionAmount: number;
    carrierPayoutAmount: number;
    pickupTime?: Date | string;
    deliveryTime?: Date | string;
    estimatedDeliveryTime?: Date | string;
    notes?: string;
    imageUrl?: string;
    isInsured: boolean;
    insuranceCost?: number;
    distance: number;
    createdAt: Date | string;
    updatedAt: Date | string;
  }
  
  /**
   * Interface for package creation/update request
   */
  export interface PackageRequest {
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
    pickupTimeWindow: string; // JSON string
    deliveryAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryContactName: string;
    deliveryContactPhone: string;
    deliveryTimeWindow: string; // JSON string
    notes?: string;
    isInsured: boolean;
  }
  
  /**
   * Interface for package filter options
   */
  export interface PackageFilterOptions {
    status?: PackageStatus;
    size?: PackageSize;
    minDistance?: number;
    maxDistance?: number;
    minPrice?: number;
    maxPrice?: number;
    isFragile?: boolean;
    requireSignature?: boolean;
    isInsured?: boolean;
    startDate?: Date | string;
    endDate?: Date | string;
    page?: number;
    limit?: number;
  }
  
  /**
   * Interface for tracking info response
   */
  export interface TrackingInfo {
    trackingCode: string;
    status: PackageStatus;
    estimatedDeliveryTime?: Date | string;
    packageSize: PackageSize;
    packageWeight: number;
    pickupAddress: string;
    deliveryAddress: string;
    timeline: {
      status: PackageStatus;
      description: string;
      timestamp: Date | string;
    }[];
  }
  
  /**
   * Interface for package issue report
   */
  export interface PackageIssue {
    packageId: string;
    issueType: string;
    description: string;
    reportedBy: string;
    reportedAt: Date | string;
  }
  
  /**
   * Interface for API response containing package data
   */
  export interface PackageResponse {
    success: boolean;
    message?: string;
    data: Package;
  }
  
  /**
   * Interface for API response containing multiple package data
   */
  export interface PackagesListResponse {
    success: boolean;
    message?: string;
    count: number;
    totalPages: number;
    currentPage: number;
    data: Package[];
  }