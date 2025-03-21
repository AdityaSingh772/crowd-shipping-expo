"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons"
import { useAuth } from "../../hooks/useAuth"
import { useTracking } from "../../hooks/useTracking"
import { Card } from "../../components/Card"
import { PieChart } from 'react-native-chart-kit'
import axios from 'axios'

// Package status enum (matches backend)
enum PackageStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  PICKUP_READY = 'pickup_ready',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

// Package size enum (matches backend)
enum PackageSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  EXTRA_LARGE = 'extra_large',
}

// Package interface
interface Package {
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

// Carbon emission stats interface
interface EmissionStats {
  carbonReduced: number;
  treesEquivalent: number;
  trips: number;
  traditionalEmissions: number;
  avgUserEmissions: number;
}

// Status mapping for UI display
const statusInfo = {
  [PackageStatus.PENDING]: {
    label: "Pending",
    color: "#fef9c3",
    textColor: "#854d0e",
    icon: <MaterialIcons name="pending-actions" size={24} color="#854d0e" />,
    description: "Your package is pending carrier assignment.",
  },
  [PackageStatus.MATCHED]: {
    label: "Matched",
    color: "#dbeafe",
    textColor: "#1e40af",
    icon: <MaterialIcons name="people" size={24} color="#1e40af" />,
    description: "Your package has been matched with a carrier.",
  },
  [PackageStatus.PICKUP_READY]: {
    label: "Ready for Pickup",
    color: "#dbeafe",
    textColor: "#1e40af",
    icon: <MaterialIcons name="local-shipping" size={24} color="#1e40af" />,
    description: "Your package is ready for pickup by the carrier.",
  },
  [PackageStatus.IN_TRANSIT]: {
    label: "In Transit",
    color: "#dbeafe",
    textColor: "#1e40af",
    icon: <FontAwesome5 name="truck" size={20} color="#1e40af" />,
    description: "Your package is on its way to the destination.",
  },
  [PackageStatus.DELIVERED]: {
    label: "Delivered",
    color: "#dcfce7",
    textColor: "#166534",
    icon: <MaterialIcons name="check-circle" size={24} color="#166534" />,
    description: "Your package has been delivered successfully.",
  },
  [PackageStatus.CANCELLED]: {
    label: "Cancelled",
    color: "#fee2e2",
    textColor: "#991b1b",
    icon: <MaterialIcons name="cancel" size={24} color="#991b1b" />,
    description: "This delivery has been cancelled.",
  },
  [PackageStatus.RETURNED]: {
    label: "Returned",
    color: "#fee2e2",
    textColor: "#991b1b",
    icon: <MaterialIcons name="assignment-return" size={24} color="#991b1b" />,
    description: "Your package has been returned to sender.",
  },
};

// Format date from string or Date object
const formatDate = (date?: string): string => {
  if (!date) return "Not available";
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Calculate progress based on status
const getProgressPercentage = (status: PackageStatus): number => {
  const statusValues = Object.values(PackageStatus);
  const currentIndex = statusValues.indexOf(status);
  // Exclude CANCELLED and RETURNED from calculation
  const maxIndex = statusValues.length - 3; // -3 for CANCELLED, RETURNED, and 0-indexing
  return Math.min(100, Math.round((currentIndex / maxIndex) * 100));
};

type StatisticProps = {
  title: string
  value: string
  icon: React.ReactNode
  change?: string
}

const Statistic = ({ title, value, icon, change }: StatisticProps) => (
  <Card style={styles.statCard}>
    <View style={styles.statHeader}>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statIconContainer}>{icon}</View>
    </View>
    {change && (
      <Text style={styles.statChange}>
        <MaterialIcons name="trending-up" size={14} color="#16a34a" /> {change}
      </Text>
    )}
  </Card>
)

type ActivityItemProps = {
  title: string
  time: string
  status: "completed" | "in-progress" | "pending"
  icon: React.ReactNode
}

const ActivityItem = ({ title, time, status, icon }: ActivityItemProps) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIconContainer}>{icon}</View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
    <View
      style={[
        styles.activityStatus,
        status === "completed"
          ? styles.statusCompleted
          : status === "in-progress"
            ? styles.statusInProgress
            : styles.statusPending,
      ]}
    >
      <Text
        style={[
          styles.activityStatusText,
          status === "completed"
            ? styles.statusCompletedText
            : status === "in-progress"
              ? styles.statusInProgressText
              : styles.statusPendingText,
        ]}
      >
        {status === "completed" ? "Completed" : status === "in-progress" ? "In Progress" : "Pending"}
      </Text>
    </View>
  </View>
)

const TimelineEvent = ({ 
  title, 
  time, 
  icon, 
  isActive 
}: { 
  title: string; 
  time: string; 
  icon: React.ReactNode; 
  isActive: boolean;
}) => (
  <View style={[styles.timelineEvent, { opacity: isActive ? 1 : 0.5 }]}>
    <View style={styles.timelineIconContainer}>
      {icon}
    </View>
    <View style={styles.timelineContent}>
      <Text style={styles.timelineTitle}>{title}</Text>
      <Text style={styles.timelineTime}>{time}</Text>
    </View>
  </View>
)

// The API base URL - replace with your actual API URL
const API_BASE_URL = 'https://api.yourapp.com'; // Update with your API URL

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const { 
    loading: trackingLoading, 
    error: trackingError, 
    trackingResult, 
    trackPackage, 
    clearTracking,
    recentSearches,
    refreshPackageStatus,
    clearTrackingHistory 
  } = useTracking({ 
    userId: user?.id, 
    userRole: user?.role 
  })
  
  // State
  const [refreshing, setRefreshing] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [showTrackingDetails, setShowTrackingDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Activity and statistics
  const [stats, setStats] = useState({
    deliveries: "24",
    active: "3",
    earnings: "$342",
  })
  
  const [recentActivity, setRecentActivity] = useState([
    {
      id: '1001',
      title: "Order #1001 Delivered",
      time: "2 hours ago",
      status: "completed" as const,
      icon: <FontAwesome5 name="box" size={16} color="#2A5D3C" />
    },
    {
      id: '1002',
      title: "Order #1002 In Transit",
      time: "Yesterday",
      status: "in-progress" as const,
      icon: <FontAwesome5 name="truck" size={16} color="#2A5D3C" />
    },
    {
      id: '1003',
      title: "Order #1003 Accepted",
      time: "2 days ago",
      status: "pending" as const,
      icon: <MaterialIcons name="pending-actions" size={16} color="#2A5D3C" />
    }
  ])
  
  // Environmental impact state
  const [environmentalStats, setEnvironmentalStats] = useState<EmissionStats>({
    carbonReduced: 0,
    treesEquivalent: 0,
    trips: 0,
    traditionalEmissions: 250,
    avgUserEmissions: 100
  });

  // Fetching carrier emission stats
  const fetchEmissionStats = useCallback(async () => {
    if (!user?.id) return;
    
    // Only fetch for carriers or if a specific role needs this data
    const shouldFetchStats = user.role === 'carrier' || user.role === 'customer';
    
    if (!shouldFetchStats) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/carbon-emission/carrier/${user.id}`);
      
      if (response.data.success) {
        const statsData = response.data.data;
        
        setEnvironmentalStats({
          carbonReduced: statsData.carbonReduced || 0,
          treesEquivalent: statsData.treesEquivalent || 0,
          trips: statsData.completedDeliveries || 0,
          traditionalEmissions: statsData.traditionalEmissions || 250,
          avgUserEmissions: statsData.avgUserEmissions || 100
        });
      } else {
        // Handle API success: false response
        setError(response.data.message || 'Failed to load emission data');
        
        // Set default values if API returns error
        setEnvironmentalStats({
          carbonReduced: 0,
          treesEquivalent: 0,
          trips: 0,
          traditionalEmissions: 250,
          avgUserEmissions: 100
        });
      }
    } catch (err: any) {
      console.error('Error fetching emission stats:', err);
      setError(err.message || 'Failed to load emission data');
      
      // Set default values if API throws error
      setEnvironmentalStats({
        carbonReduced: 0,
        treesEquivalent: 0,
        trips: 0,
        traditionalEmissions: 250,
        avgUserEmissions: 100
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  // Initial data loading
  useEffect(() => {
    fetchEmissionStats();
  }, [fetchEmissionStats]);

  // Calculate pie chart data based on environmental stats
  const carbonEmissionData = [
    {
      name: 'Saved',
      population: environmentalStats.carbonReduced,
      color: '#4CAF50',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: 'Avg User',
      population: environmentalStats.avgUserEmissions,
      color: '#8CD867',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    },
    {
      name: 'Traditional',
      population: environmentalStats.traditionalEmissions,
      color: '#B5EAD7',
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }
  ];

  // Pie chart configuration
  const screenWidth = Dimensions.get('window').width - 40;
  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(42, 93, 60, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  const isDeliveryPartner = user?.role === "carrier";
   
  // Handle refresh - clear tracking state and fetch latest data
  const handleRefresh = useCallback(() => {
    clearTracking();
    setTrackingNumber("");
    setShowTrackingDetails(false);
  }, [clearTracking]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Reset tracking state
    handleRefresh();
    
    // Fetch latest data
    Promise.all([
      fetchEmissionStats()
    ]).finally(() => {
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
    });
  }, [handleRefresh, fetchEmissionStats]);

  // Handle logout
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => logout(),
        style: "destructive",
      },
    ]);
  };

  // Handle package tracking
  const handleSearch = async () => {
    if (!trackingNumber.trim()) {
      Alert.alert("Error", "Please enter a tracking number");
      return;
    }
    
    try {
      await trackPackage(trackingNumber);
      setShowTrackingDetails(true);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  // Close tracking details
  const closeTrackingDetails = () => {
    setShowTrackingDetails(false);
    // Don't clear the result immediately to avoid flickering
  };
  
  // Render tracking input card
  const renderTrackingInput = () => (
    <Card style={styles.trackingCard}>
      <Text style={styles.trackingTitle}>Track your package</Text>
      <Text style={styles.trackingSubtitle}>Enter your package tracking number</Text>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Enter tracking number"
          value={trackingNumber}
          onChangeText={setTrackingNumber}
          placeholderTextColor="#a3a3a3"
        />
        <TouchableOpacity 
          style={[styles.searchButton, trackingLoading && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={trackingLoading}
        >
          {trackingLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="search" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
      {trackingError && <Text style={styles.errorText}>{trackingError}</Text>}
    </Card>
  );

  // Render tracking result card
  const renderTrackingResult = () => {
    if (!trackingResult) return null;
    
    const pkg = trackingResult;
    const status = statusInfo[pkg.status] || statusInfo[PackageStatus.PENDING];
    const progressPercentage = getProgressPercentage(pkg.status);

    return (
      <Card style={styles.trackingResultCard}>
        <View style={styles.trackingResultHeader}>
          <Text style={styles.trackingResultTitle}>Package Details</Text>
          <TouchableOpacity onPress={closeTrackingDetails} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.trackingResultContent}>
          {/* Tracking number and status */}
          <View style={styles.trackingHeader}>
            <View>
              <Text style={styles.trackingLabel}>Tracking Number</Text>
              <Text style={styles.trackingNumber}>{pkg.trackingCode}</Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: status.color }]}
            >
              <Text style={[styles.statusText, { color: status.textColor }]}>
                {status.label}
              </Text>
            </View>
          </View>

          {/* Progress visualization */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{status.description}</Text>
          </View>

          {/* Package info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Package Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Package Title</Text>
              <Text style={styles.infoValue}>{pkg.title}</Text>
            </View>
            {pkg.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description</Text>
                <Text style={styles.infoValue}>{pkg.description}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Size</Text>
              <Text style={styles.infoValue}>{pkg.size}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weight</Text>
              <Text style={styles.infoValue}>{pkg.weight} kg</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Fragile</Text>
              <Text style={styles.infoValue}>{pkg.isFragile ? "Yes" : "No"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Insured</Text>
              <Text style={styles.infoValue}>{pkg.isInsured ? "Yes" : "No"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Signature Required</Text>
              <Text style={styles.infoValue}>
                {pkg.requireSignature ? "Yes" : "No"}
              </Text>
            </View>
          </View>

          {/* Delivery details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pickup From</Text>
              <Text style={styles.infoValue}>{pkg.pickupAddress}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Deliver To</Text>
              <Text style={styles.infoValue}>{pkg.deliveryAddress}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Estimated Delivery</Text>
              <Text style={styles.infoValue}>
                {formatDate(pkg.estimatedDeliveryTime)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Distance</Text>
              <Text style={styles.infoValue}>{pkg.distance} km</Text>
            </View>
          </View>

          {/* Timeline events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.timeline}>
              <TimelineEvent
                title="Package Created"
                time={formatDate(pkg.createdAt)}
                icon={<MaterialIcons name="add-box" size={20} color={pkg.createdAt ? "#2A5D3C" : "#a3a3a3"} />}
                isActive={true}
              />

              <TimelineEvent
                title="Carrier Matched"
                time={pkg.carrierId ? formatDate(pkg.updatedAt) : "Pending"}
                icon={<MaterialIcons name="people" size={20} color={pkg.carrierId ? "#2A5D3C" : "#a3a3a3"} />}
                isActive={Boolean(pkg.carrierId)}
              />

              <TimelineEvent
                title="Package Picked Up"
                time={pkg.pickupTime ? formatDate(pkg.pickupTime) : "Pending"}
                icon={<FontAwesome5 name="truck" size={16} color={pkg.pickupTime ? "#2A5D3C" : "#a3a3a3"} />}
                isActive={Boolean(pkg.pickupTime)}
              />

              <TimelineEvent
                title="Package Delivered"
                time={pkg.deliveryTime ? formatDate(pkg.deliveryTime) : "Pending"}
                icon={<MaterialIcons name="check-circle" size={20} color={pkg.deliveryTime ? "#2A5D3C" : "#a3a3a3"} />}
                isActive={Boolean(pkg.deliveryTime)}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.supportButton}>
            <Text style={styles.supportButtonText}>Contact Support</Text>
          </TouchableOpacity>
        </ScrollView>
      </Card>
    );
  };

  // Render environmental impact section
  const renderEnvironmentalImpact = () => (
    <View style={styles.environmentalContainer}>
      <Text style={styles.sectionTitle}>Your Environmental Impact</Text>
      <Card style={styles.environmentalCard}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2A5D3C" />
            <Text style={styles.loadingText}>Loading environmental data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={40} color="#991b1b" />
            <Text style={styles.errorMessage}>
              Couldn't load environmental data. Please try again later.
            </Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={fetchEmissionStats}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.environmentalTitle}>
              You've reduced carbon emissions by:
            </Text>
            
            <View style={styles.carbonValueContainer}>
              <Text style={styles.carbonValue}>{environmentalStats.carbonReduced}</Text>
              <Text style={styles.carbonUnit}>kg of CO₂</Text>
            </View>
            
            <View style={styles.chartContainer}>
              <PieChart
                data={carbonEmissionData}
                width={screenWidth - 40}
                height={180}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"0"}
                center={[10, 0]}
                absolute
              />
            </View>
            
            <View style={styles.factContainer}>
              <View style={styles.factIconContainer}>
                <FontAwesome5 name="tree" size={24} color="#2A5D3C" />
              </View>
              <View style={styles.factContent}>
                <Text style={styles.factText}>
                  That's equivalent to saving {environmentalStats.treesEquivalent} trees!
                </Text>
                <Text style={styles.factSubtext}>
                  Based on your {environmentalStats.trips} eco-friendly deliveries
                </Text>
              </View>
            </View>
          </>
        )}
      </Card>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2A5D3C" barStyle="light-content" />

      {/* Top bar with logout */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.firstName || "Paul Smithers"}</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton}>
            <MaterialIcons name="account-circle" size={40} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#8CD867"]} />}
      >
        {/* Package Tracking Section */}
        {showTrackingDetails ? renderTrackingResult() : renderTrackingInput()}

        {/* Environmental Impact Section */}
        {renderEnvironmentalImpact()}

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            {recentActivity.map((activity) => (
              <ActivityItem
                key={activity.id}
                title={activity.title}
                time={activity.time}
                status={activity.status}
                icon={activity.icon}
              />
            ))}
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Activity</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#2A5D3C" />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Earnings Overview (for delivery partners) */}
        {isDeliveryPartner && (
          <View style={styles.earningsContainer}>
            <Text style={styles.sectionTitle}>Earnings Overview</Text>
            <Card style={styles.earningsCard}>
              <View style={styles.earningsSummary}>
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>Today</Text>
                  <Text style={styles.earningsValue}>$42</Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>This Week</Text>
                  <Text style={styles.earningsValue}>$185</Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>This Month</Text>
                  <Text style={styles.earningsValue}>$342</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.withdrawButton}>
                <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2A5D3C",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#2A5D3C",
  },
  greeting: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    padding: 5,
  },
  logoutButton: {
    padding: 8,
    marginRight: 10,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  // Loading and Error States
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: "#2A5D3C",
    fontSize: 14,
  },
  errorContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessage: {
    marginTop: 15,
    marginBottom: 15,
    color: "#991b1b",
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: "#8CD867",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  // Tracking card styles
  trackingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  trackingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A5D3C",
    marginBottom: 5,
  },
  trackingSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    backgroundColor: "#f0f0f0",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginRight: 10,
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#8CD867",
    justifyContent: "center",
    alignItems: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "#a3a3a3",
  },
  errorText: {
    color: "#dc2626",
    marginTop: 10,
    fontSize: 14,
  },
  // Tracking result styles
  trackingResultCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 20,
    padding: 0,
    overflow: "hidden",
  },
  trackingResultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  trackingResultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  closeButton: {
    padding: 5,
  },
  trackingResultContent: {
    padding: 20,
  },
  trackingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  trackingLabel: {
    fontSize: 12,
    color: "#666",
  },
  trackingNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  progressContainer: {
    marginBottom: 25,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2A5D3C",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A5D3C",
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: "#2A5D3C",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  timeline: {
    marginTop: 10,
  },
  timelineEvent: {
    flexDirection: "row",
    marginBottom: 15,
  },
  timelineIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2A5D3C",
  },
  timelineTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
  },
  supportButton: {
    backgroundColor: "#8CD867",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  supportButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  // Stats and activity styles
  statsContainer: {
    marginBottom: 20,
  },
  statCard: {
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  statHeader: {
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: "#666",
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E0",
    justifyContent: "center",
    alignItems: "center",
  },
  statChange: {
    marginTop: 8,
    fontSize: 12,
    color: "#16a34a",
  },
  // Environmental Impact Styles
  environmentalContainer: {
    marginBottom: 20,
  },
  environmentalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
  environmentalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A5D3C",
    textAlign: "center",
    marginBottom: 10,
  },
  carbonValueContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  carbonValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  carbonUnit: {
    fontSize: 16,
    color: "#666",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  factContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E0",
    borderRadius: 12,
    padding: 15,
  },
  factIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  factContent: {
    flex: 1,
  },
  factText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2A5D3C",
    marginBottom: 5,
  },
  factSubtext: {
    fontSize: 14,
    color: "#666",
  },
  // Recent Activity styles
  recentActivityContainer: {
    marginBottom: 20,
  },
  activityCard: {
    padding: 0,
    borderRadius: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5E0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2A5D3C",
  },
  activityTime: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: "#dcfce7",
  },
  statusInProgress: {
    backgroundColor: "#dbeafe",
  },
  statusPending: {
    backgroundColor: "#fef9c3",
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statusCompletedText: {
    color: "#166534",
  },
  statusInProgressText: {
    color: "#1e40af",
  },
  statusPendingText: {
    color: "#854d0e",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2A5D3C",
    marginRight: 5,
  },
  // Earnings styles
  earningsContainer: {
    marginBottom: 30,
  },
  earningsCard: {
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  earningsSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  earningsItem: {
    flex: 1,
    alignItems: "center",
  },
  earningsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2A5D3C",
  },
  earningsDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },
  withdrawButton: {
    backgroundColor: "#8CD867",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  withdrawButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  }});