// SenderMatchingDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define types for the data structures
interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface Dimensions {
  length: number;
  width: number;
  height: number;
}

interface RouteDeviation {
  distance: number;
  time: number;
}

interface FirestoreTimestamp {
  toDate: () => Date;
  seconds: number;
  nanoseconds: number;
}

interface PackageDetails {
  id: string;
  pickupLocation?: Location;
  deliveryLocation?: Location;
  packageWeight?: number;
  dimensions?: Dimensions;
  urgency?: 'high' | 'medium' | 'low';
  // Add other package properties as needed
}

interface CarrierMatch {
  id: string;
  carrierId: string;
  carrierName?: string;
  packageId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
  createdAt: FirestoreTimestamp;
  responseTime?: FirestoreTimestamp;
  carrierNotes?: string;
  carrierPickupCode?: string;
  carrierDeliveryCode?: string;
  compensation?: number;
  // Add other match properties as needed
}

interface PotentialCarrier {
  carrierId: string;
  carrierName: string;
  matchScore: number;
  compensation: number;
  carrierRating?: number;
  carrierVehicleType?: string;
  routeDeviation: RouteDeviation;
  estimatedCarbonSavings?: number;
  // Add other carrier properties as needed
}

// Define types for route params
type RootStackParamList = {
  Packages: undefined;
  PackageMatching: { packageId: string };
};

type PackageMatchingRouteProp = RouteProp<RootStackParamList, 'PackageMatching'>;
type PackagesNavigationProp = StackNavigationProp<RootStackParamList, 'Packages'>;

const SenderMatchingDashboard = () => {
  const route = useRoute<PackageMatchingRouteProp>();
  const navigation = useNavigation<PackagesNavigationProp>();
  const packageId = route.params?.packageId;
  
  const [packageDetails, setPackageDetails] = useState<PackageDetails | null>(null);
  const [activeMatches, setActiveMatches] = useState<CarrierMatch[]>([]);
  const [potentialCarriers, setPotentialCarriers] = useState<PotentialCarrier[]>([]);
  const [isLoading, setIsLoading] = useState({
    package: true,
    matches: true,
    carriers: false
  });
  const [error, setError] = useState<string | null>(null);

  // Fetch package details
  useEffect(() => {
    const fetchPackageDetails = async () => {
      try {
        const response = await fetch(`/api/v1/packages/${packageId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch package details');
        }
        const data = await response.json();
        setPackageDetails(data.data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError('Error loading package details: ' + errorMessage);
        console.error(err);
      } finally {
        setIsLoading(prev => ({ ...prev, package: false }));
      }
    };

    // Fetch existing matches
    const fetchMatches = async () => {
      try {
        const response = await fetch(`/api/v1/matches/package/${packageId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        const data = await response.json();
        // Filter only active matches (pending/accepted)
        const active = data.data.filter((match: CarrierMatch) => 
          match.status === 'PENDING' || match.status === 'ACCEPTED'
        );
        setActiveMatches(active);
      } catch (err) {
        console.error('Error loading matches:', err);
      } finally {
        setIsLoading(prev => ({ ...prev, matches: false }));
      }
    };

    if (packageId) {
      fetchPackageDetails();
      fetchMatches();
    }
  }, [packageId]);

  // Find potential carriers
  const findCarriers = async () => {
    setIsLoading(prev => ({ ...prev, carriers: true }));
    setError(null);
    
    try {
      const response = await fetch('/api/v1/matches/find-carriers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          radius: 10,
          maxCarriers: 5
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to find carriers');
      }
      
      const data = await response.json();
      setPotentialCarriers(data.data);
      
      if (data.data.length === 0) {
        setError('No suitable carriers found nearby. Try increasing search radius.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage || 'Error finding carriers');
      console.error(err);
    } finally {
      setIsLoading(prev => ({ ...prev, carriers: false }));
    }
  };

  // Create a match with a carrier
  const createMatch = async (carrierId: string) => {
    try {
      const response = await fetch('/api/v1/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          carrierId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create match');
      }
      
      const data = await response.json();
      
      // Add new match to active matches
      setActiveMatches([...activeMatches, data.data]);
      
      // Remove carrier from potential carriers list
      setPotentialCarriers(potentialCarriers.filter(
        carrier => carrier.carrierId !== carrierId
      ));
      
      Alert.alert('Success', 'Match created successfully! The carrier will be notified.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', errorMessage || 'Error creating match');
      console.error(err);
    }
  };

  // Cancel a match
  const cancelMatch = async (matchId: string) => {
    Alert.alert(
      'Confirm Cancellation',
      'Are you sure you want to cancel this match?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              const response = await fetch(`/api/v1/matches/${matchId}/cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  reason: 'Cancelled by sender'
                })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to cancel match');
              }
              
              // Remove cancelled match from active matches
              setActiveMatches(activeMatches.filter(match => match.id !== matchId));
              
              Alert.alert('Success', 'Match cancelled successfully');
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              Alert.alert('Error', errorMessage || 'Error cancelling match');
              console.error(err);
            }
          }
        }
      ]
    );
  };

  if (isLoading.package) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading package details...</Text>
      </View>
    );
  }

  if (!packageDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Package not found.</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Packages')}
        >
          <Text style={styles.buttonText}>Back to Packages</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Format timestamp safely
  const formatTimestamp = (timestamp?: FirestoreTimestamp): string => {
    if (!timestamp || !timestamp.toDate) return 'N/A';
    try {
      return timestamp.toDate().toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get status badge style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return styles.badgeWarning;
      case 'ACCEPTED': return styles.badgeSuccess;
      case 'REJECTED': return styles.badgeDanger;
      case 'CANCELLED': return styles.badgeSecondary;
      case 'COMPLETED': return styles.badgeInfo;
      default: return styles.badgeSecondary;
    }
  };

  // Get status text style
  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return styles.badgeWarningText;
      case 'ACCEPTED': return styles.badgeSuccessText;
      case 'REJECTED': return styles.badgeDangerText;
      case 'CANCELLED': return styles.badgeSecondaryText;
      case 'COMPLETED': return styles.badgeInfoText;
      default: return styles.badgeSecondaryText;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Package Matching</Text>
      
      {/* Package Details Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Package Details</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Pickup:</Text>
            <Text style={styles.value}>{packageDetails.pickupLocation?.address || 'Not specified'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Delivery:</Text>
            <Text style={styles.value}>{packageDetails.deliveryLocation?.address || 'Not specified'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Weight:</Text>
            <Text style={styles.value}>{packageDetails.packageWeight || 'Not specified'} kg</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Dimensions:</Text>
            <Text style={styles.value}>
              {packageDetails.dimensions
                ? `${packageDetails.dimensions.length} × ${packageDetails.dimensions.width} × ${packageDetails.dimensions.height} cm`
                : 'Not specified'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Urgency:</Text>
            <View style={[
              styles.badge,
              packageDetails.urgency === 'high' ? styles.badgeDanger :
              packageDetails.urgency === 'medium' ? styles.badgeWarning :
              styles.badgeSuccess
            ]}>
              <Text style={[
                packageDetails.urgency === 'high' ? styles.badgeDangerText :
                packageDetails.urgency === 'medium' ? styles.badgeWarningText :
                styles.badgeSuccessText
              ]}>
                {packageDetails.urgency || 'Normal'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Active Matches Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Active Matches</Text>
        </View>
        <View style={styles.cardBody}>
          {isLoading.matches ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007bff" />
              <Text style={styles.loadingText}>Loading matches...</Text>
            </View>
          ) : activeMatches.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No active matches for this package.</Text>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={findCarriers}
              >
                <Text style={styles.primaryButtonText}>Find Carriers</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.matchesList}>
              {activeMatches.map(match => (
                <View key={match.id} style={styles.matchCard}>
                  <View style={styles.matchHeader}>
                    <View style={styles.matchCarrier}>
                      <Text style={styles.matchCarrierName}>{match.carrierName || 'Carrier'}</Text>
                      <View style={[styles.badge, getStatusStyle(match.status)]}>
                        <Text style={getStatusTextStyle(match.status)}>{match.status}</Text>
                      </View>
                    </View>
                    {match.status === 'PENDING' && (
                      <TouchableOpacity
                        style={styles.outlineDangerButton}
                        onPress={() => cancelMatch(match.id)}
                      >
                        <Text style={styles.outlineDangerButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  <View style={styles.matchDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.label}>Status:</Text>
                      <Text style={styles.value}>
                        {match.status === 'PENDING'
                          ? 'Waiting for carrier response'
                          : match.status === 'ACCEPTED'
                          ? 'Carrier has accepted this delivery'
                          : match.status}
                      </Text>
                    </View>
                    
                    {match.responseTime && (
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Response Time:</Text>
                        <Text style={styles.value}>
                          {formatTimestamp(match.responseTime)}
                        </Text>
                      </View>
                    )}
                    
                    {match.carrierNotes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.label}>Carrier Notes:</Text>
                        <Text style={styles.carrierNotes}>{match.carrierNotes}</Text>
                      </View>
                    )}
                    
                    {match.status === 'ACCEPTED' && match.carrierPickupCode && (
                      <View style={styles.highlightRow}>
                        <Text style={styles.label}>Pickup Code:</Text>
                        <Text style={styles.codeValue}>{match.carrierPickupCode}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      
      {/* Find Carriers Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Find Carriers</Text>
        </View>
        <View style={styles.cardBody}>
          {error && (
            <View style={styles.alert}>
              <Text style={styles.alertText}>{error}</Text>
            </View>
          )}
          
          <View style={styles.findCarriersActions}>
            <TouchableOpacity
              style={[styles.primaryButton, isLoading.carriers && styles.disabledButton]}
              onPress={findCarriers}
              disabled={isLoading.carriers}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading.carriers ? 'Searching...' : 'Find Available Carriers'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {potentialCarriers.length > 0 && (
            <View style={styles.carriersList}>
              <Text style={styles.sectionTitle}>Recommended Carriers</Text>
              
              {potentialCarriers.map(carrier => (
                <View key={carrier.carrierId} style={styles.carrierCard}>
                  <View style={styles.carrierHeader}>
                    <View style={styles.carrierInfo}>
                      <Text style={styles.carrierName}>{carrier.carrierName}</Text>
                      <View style={styles.matchScore}>
                        <Text style={styles.label}>Match Score:</Text>
                        <View style={styles.progress}>
                          <View
                            style={[
                              styles.progressBar,
                              { width: `${Math.round(carrier.matchScore * 100)}%` }
                            ]}
                          />
                        </View>
                        <Text style={styles.percentage}>{Math.round(carrier.matchScore * 100)}%</Text>
                      </View>
                    </View>
                    <Text style={styles.price}>
                      ${carrier.compensation.toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={styles.carrierDetails}>
                    <View style={styles.detailGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Vehicle:</Text>
                        <Text style={styles.detailValue}>{carrier.carrierVehicleType || 'Not specified'}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Rating:</Text>
                        <Text style={styles.detailValue}>{carrier.carrierRating ? `${carrier.carrierRating}/5` : 'No ratings'}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Route Deviation:</Text>
                        <Text style={styles.detailValue}>+{carrier.routeDeviation.distance.toFixed(1)}km (+{carrier.routeDeviation.time}min)</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>CO₂ Savings:</Text>
                        <Text style={styles.detailValue}>
                          {carrier.estimatedCarbonSavings 
                            ? `${carrier.estimatedCarbonSavings.toFixed(2)}kg CO₂` 
                            : 'Calculating...'}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.carrierActions}>
                      <TouchableOpacity
                        style={styles.successButton}
                        onPress={() => createMatch(carrier.carrierId)}
                      >
                        <Text style={styles.successButtonText}>Select Carrier</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#721c24',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardBody: {
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  label: {
    fontWeight: '600',
    width: 120,
    marginRight: 10,
  },
  value: {
    flex: 1,
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeSuccess: {
    backgroundColor: '#d4edda',
  },
  badgeWarning: {
    backgroundColor: '#fff3cd',
  },
  badgeDanger: {
    backgroundColor: '#f8d7da',
  },
  badgeInfo: {
    backgroundColor: '#d1ecf1',
  },
  badgeSecondary: {
    backgroundColor: '#e2e3e5',
  },
  badgeSuccessText: {
    color: '#155724',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeWarningText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeDangerText: {
    color: '#721c24',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeInfoText: {
    color: '#0c5460',
    fontSize: 12,
    fontWeight: '600',
  },
  badgeSecondaryText: {
    color: '#383d41',
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#666',
    marginBottom: 10,
  },
  matchesList: {
    marginTop: 5,
  },
  matchCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  matchCarrier: {
    flex: 1,
  },
  matchCarrierName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  matchDetails: {
    marginTop: 5,
  },
  outlineDangerButton: {
    borderWidth: 1,
    borderColor: '#dc3545',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  outlineDangerButtonText: {
    color: '#dc3545',
    fontSize: 12,
    fontWeight: '500',
  },
  carrierNotes: {
    fontStyle: 'italic',
    color: '#666',
    flex: 1,
  },
  highlightRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
    marginTop: 10,
  },
  codeValue: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  alert: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
    marginBottom: 15,
  },
  alertText: {
    color: '#721c24',
  },
  findCarriersActions: {
    marginBottom: 20,
  },
  carriersList: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  carrierCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  carrierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  carrierInfo: {
    flex: 1,
  },
  carrierName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  progress: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff',
  },
  percentage: {
    fontSize: 12,
    fontWeight: '600',
    width: 40,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  carrierDetails: {
    marginTop: 5,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  detailItem: {
    width: '50%',
    paddingVertical: 5,
  },
  detailLabel: {
    color: '#6c757d',
    fontSize: 12,
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '500',
    fontSize: 14,
  },
  carrierActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  successButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  successButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
});

export default SenderMatchingDashboard;