// CarrierMatchingDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define types for the data structures
interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

interface PackageDimensions {
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

type UrgencyLevel = 'high' | 'medium' | 'low' | 'normal';

interface PackageData {
  id: string;
  title?: string;
  pickupLocation?: Location;
  deliveryLocation?: Location;
  pickupWindow?: string[]; // Changed from any to string[]
  deliveryWindow?: string[];
  packageWeight?: number;
  dimensions?: PackageDimensions; // Renamed to avoid confusion with RN Dimensions
  urgency?: UrgencyLevel;
  // Add other package properties as needed
}

interface CarrierMatch {
  id: string;
  carrierId: string;
  packageId: string;
  packageData?: PackageData;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';
  createdAt: FirestoreTimestamp;
  responseTime?: FirestoreTimestamp;
  carrierNotes?: string;
  carrierPickupCode?: string;
  carrierDeliveryCode?: string;
  compensation?: number;
  routeDeviation?: RouteDeviation;
  // Add other match properties as needed
}

// Define types for navigation
type RootStackParamList = {
  CarrierHome: undefined;
  CarrierMatches: undefined;
  // Add other screens as needed
};

type CarrierNavigationProp = StackNavigationProp<RootStackParamList, 'CarrierMatches'>;

// Define package details interface for use in render functions
interface PackageDetails {
  id: string;
  title: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupWindow: string;
  deliveryWindow: string;
  weight: number | string;
  dimensions: string;
  urgency: string;
}

const CarrierMatchingDashboard = () => {
  const navigation = useNavigation<CarrierNavigationProp>();
  
  const [pendingMatches, setPendingMatches] = useState<CarrierMatch[]>([]);
  const [activeMatches, setActiveMatches] = useState<CarrierMatch[]>([]);
  const [historyMatches, setHistoryMatches] = useState<CarrierMatch[]>([]);
  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'history'>('pending');
  const [error, setError] = useState<string | null>(null);

  // Fetch all matches for the carrier
  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/v1/matches/me');
        if (!response.ok) {
          throw new Error('Failed to fetch matches');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Unknown error');
        }
        
        const matches: CarrierMatch[] = data.data || [];
        
        // Categorize matches by status
        const pending = matches.filter(m => m.status === 'PENDING');
        const active = matches.filter(m => m.status === 'ACCEPTED');
        const history = matches.filter(m => 
          ['COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED'].includes(m.status)
        );
        
        setPendingMatches(pending);
        setActiveMatches(active);
        setHistoryMatches(history);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Error fetching matches:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMatches();
    
    // Poll for updates every 30 seconds
    const intervalId = setInterval(fetchMatches, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Accept a delivery match
  const acceptMatch = async (matchId: string) => {
    try {
      const notes = responseNotes[matchId] || '';
      
      const response = await fetch(`/api/v1/matches/${matchId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to accept match');
      }
      
      const data = await response.json();
      
      // Move match from pending to active
      const acceptedMatch = data.data;
      setPendingMatches(pendingMatches.filter(m => m.id !== matchId));
      setActiveMatches([...activeMatches, acceptedMatch]);
      
      // Clear notes
      const updatedNotes = {...responseNotes};
      delete updatedNotes[matchId];
      setResponseNotes(updatedNotes);
      
      Alert.alert('Success', 'Delivery accepted successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', errorMessage || 'Error accepting match');
      console.error(err);
    }
  };

  // Reject a delivery match
  const rejectMatch = async (matchId: string) => {
    try {
      const notes = responseNotes[matchId] || '';
      
      const response = await fetch(`/api/v1/matches/${matchId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject match');
      }
      
      const data = await response.json();
      
      // Remove from pending and add to history
      setPendingMatches(pendingMatches.filter(m => m.id !== matchId));
      setHistoryMatches([data.data, ...historyMatches]);
      
      // Clear notes
      const updatedNotes = {...responseNotes};
      delete updatedNotes[matchId];
      setResponseNotes(updatedNotes);
      
      Alert.alert('Success', 'Delivery rejected');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Error', errorMessage || 'Error rejecting match');
      console.error(err);
    }
  };

  // Cancel an accepted delivery
  const cancelDelivery = async (matchId: string) => {
    Alert.alert(
      'Confirm Cancellation', 
      'Are you sure you want to cancel this delivery? This may affect your rating.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes',
          onPress: async () => {
            try {
              // Prompt for reason
              // Note: In real app, you'd use a proper input dialog
              // This is a simplification
              const reason = 'Cancelled by carrier'; // You would get this from an input
              
              const response = await fetch(`/api/v1/matches/${matchId}/cancel`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason })
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to cancel delivery');
              }
              
              const data = await response.json();
              
              // Move from active to history
              setActiveMatches(activeMatches.filter(m => m.id !== matchId));
              setHistoryMatches([data.data, ...historyMatches]);
              
              Alert.alert('Success', 'Delivery cancelled');
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : 'Unknown error';
              Alert.alert('Error', errorMessage || 'Error cancelling delivery');
              console.error(err);
            }
          }
        }
      ]
    );
  };

  // Handle notes change
  const handleNotesChange = (matchId: string, value: string) => {
    setResponseNotes({
      ...responseNotes,
      [matchId]: value
    });
  };

  // Format date from Firestore timestamp
  const formatDate = (timestamp?: FirestoreTimestamp): string => {
    if (!timestamp) return 'N/A';
    try {
      // Handle Firestore timestamp format
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get package details
  const getPackageDetails = (match: CarrierMatch): PackageDetails => {
    const packageData = match.packageData || {} as PackageData;
    const pickup = packageData.pickupLocation || {} as Location;
    const delivery = packageData.deliveryLocation || {} as Location;
    
    return {
      id: match.packageId || 'Unknown',
      title: packageData.title || `Package #${match.packageId?.substring(0, 6) || 'Unknown'}`,
      pickupAddress: pickup.address || 'Address unavailable',
      deliveryAddress: delivery.address || 'Address unavailable',
      pickupWindow: packageData.pickupWindow 
        ? packageData.pickupWindow.join(' - ') 
        : 'Flexible',
      deliveryWindow: packageData.deliveryWindow 
        ? packageData.deliveryWindow.join(' - ') 
        : 'Flexible',
      weight: packageData.packageWeight || 'Unknown',
      dimensions: packageData.dimensions
        ? `${packageData.dimensions.length} × ${packageData.dimensions.width} × ${packageData.dimensions.height} cm`
        : 'Not specified',
      urgency: packageData.urgency || 'normal'
    };
  };

  // Get urgency badge style
  const getUrgencyStyle = (urgency: string = 'normal') => {
    switch (urgency) {
      case 'high': return styles.badgeDanger;
      case 'medium': return styles.badgeWarning;
      case 'low': return styles.badgeSuccess;
      default: return styles.badgeSecondary;
    }
  };

  // Get urgency text style
  const getUrgencyTextStyle = (urgency: string = 'normal') => {
    switch (urgency) {
      case 'high': return styles.badgeDangerText;
      case 'medium': return styles.badgeWarningText;
      case 'low': return styles.badgeSuccessText;
      default: return styles.badgeSecondaryText;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    let badgeStyle;
    let textStyle;
    
    switch (status) {
      case 'PENDING':
        badgeStyle = styles.badgeWarning;
        textStyle = styles.badgeWarningText;
        break;
      case 'ACCEPTED':
        badgeStyle = styles.badgeSuccess;
        textStyle = styles.badgeSuccessText;
        break;
      case 'REJECTED':
        badgeStyle = styles.badgeDanger;
        textStyle = styles.badgeDangerText;
        break;
      case 'CANCELLED':
        badgeStyle = styles.badgeSecondary;
        textStyle = styles.badgeSecondaryText;
        break;
      case 'COMPLETED':
        badgeStyle = styles.badgeInfo;
        textStyle = styles.badgeInfoText;
        break;
      case 'EXPIRED':
        badgeStyle = styles.badgeSecondary;
        textStyle = styles.badgeSecondaryText;
        break;
      default:
        badgeStyle = styles.badgeSecondary;
        textStyle = styles.badgeSecondaryText;
    }
    
    return (
      <View style={[styles.badge, badgeStyle]}>
        <Text style={textStyle}>{status}</Text>
      </View>
    );
  };

  // Render delivery card for pending matches
  const renderPendingCard = (match: CarrierMatch) => {
    const pkg = getPackageDetails(match);
    
    return (
      <View key={match.id} style={styles.deliveryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{pkg.title}</Text>
            {getStatusBadge(match.status)}
          </View>
          <Text style={styles.cardPrice}>${match.compensation?.toFixed(2) || '--'}</Text>
        </View>
        
        <View style={styles.locations}>
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, styles.pickupIcon]}>
              <Text style={styles.iconText}>P</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{pkg.pickupAddress}</Text>
              <Text style={styles.locationTime}>{pkg.pickupWindow}</Text>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, styles.deliveryIcon]}>
              <Text style={styles.iconText}>D</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{pkg.deliveryAddress}</Text>
              <Text style={styles.locationTime}>{pkg.deliveryWindow}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.packageAttributes}>
          <View style={styles.attributeContainer}>
            <Text style={styles.attributeLabel}>Weight:</Text>
            <Text style={styles.attributeValue}>{pkg.weight} kg</Text>
          </View>
          
          <View style={styles.attributeContainer}>
            <Text style={styles.attributeLabel}>Size:</Text>
            <Text style={styles.attributeValue}>{pkg.dimensions}</Text>
          </View>
          
          <View style={styles.attributeContainer}>
            <Text style={styles.attributeLabel}>Priority:</Text>
            <View style={[styles.badge, getUrgencyStyle(pkg.urgency)]}>
              <Text style={getUrgencyTextStyle(pkg.urgency)}>
                {typeof pkg.urgency === 'string' 
                  ? pkg.urgency.charAt(0).toUpperCase() + pkg.urgency.slice(1)
                  : 'Normal'}
              </Text>
            </View>
          </View>
          
          {match.routeDeviation && (
            <View style={styles.attributeContainer}>
              <Text style={styles.attributeLabel}>Detour:</Text>
              <Text style={styles.attributeValue}>
                +{match.routeDeviation.distance.toFixed(1)}km (+{match.routeDeviation.time}min)
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.responseSection}>
          <TextInput
            style={styles.responseInput}
            placeholder="Add notes about this delivery (optional)"
            value={responseNotes[match.id] || ''}
            onChangeText={(text) => handleNotesChange(match.id, text)}
            multiline
          />
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.declineButton}
              onPress={() => rejectMatch(match.id)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => acceptMatch(match.id)}
            >
              <Text style={styles.acceptButtonText}>Accept Delivery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render delivery card for active matches
  const renderActiveCard = (match: CarrierMatch) => {
    const pkg = getPackageDetails(match);
    
    return (
      <View key={match.id} style={styles.deliveryCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{pkg.title}</Text>
            {getStatusBadge(match.status)}
          </View>
          <Text style={styles.cardPrice}>${match.compensation?.toFixed(2) || '--'}</Text>
        </View>
        
        <View style={styles.locations}>
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, styles.pickupIcon]}>
              <Text style={styles.iconText}>P</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{pkg.pickupAddress}</Text>
              <Text style={styles.locationTime}>{pkg.pickupWindow}</Text>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, styles.deliveryIcon]}>
              <Text style={styles.iconText}>D</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{pkg.deliveryAddress}</Text>
              <Text style={styles.locationTime}>{pkg.deliveryWindow}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.packageAttributes}>
          <View style={styles.attributeContainer}>
            <Text style={styles.attributeLabel}>Weight:</Text>
            <Text style={styles.attributeValue}>{pkg.weight} kg</Text>
          </View>
          
          <View style={styles.attributeContainer}>
            <Text style={styles.attributeLabel}>Size:</Text>
            <Text style={styles.attributeValue}>{pkg.dimensions}</Text>
          </View>
          
          <View style={styles.attributeContainer}>
            <Text style={styles.attributeLabel}>Priority:</Text>
            <View style={[styles.badge, getUrgencyStyle(pkg.urgency)]}>
              <Text style={getUrgencyTextStyle(pkg.urgency)}>
                {typeof pkg.urgency === 'string' 
                  ? pkg.urgency.charAt(0).toUpperCase() + pkg.urgency.slice(1)
                  : 'Normal'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.pickupCodeSection}>
          <View style={styles.pickupCode}>
            <Text style={styles.pickupCodeLabel}>Pickup Code:</Text>
            <Text style={styles.pickupCodeValue}>{match.carrierPickupCode || '------'}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => cancelDelivery(match.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel Delivery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render delivery card for history matches
  const renderHistoryCard = (match: CarrierMatch) => {
    const pkg = getPackageDetails(match);
    
    return (
      <View key={match.id} style={[styles.deliveryCard, styles.historyCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{pkg.title}</Text>
            {getStatusBadge(match.status)}
          </View>
          <Text style={styles.cardPrice}>${match.compensation?.toFixed(2) || '--'}</Text>
        </View>
        
        <View style={styles.locations}>
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, styles.pickupIcon]}>
              <Text style={styles.iconText}>P</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{pkg.pickupAddress}</Text>
              <Text style={styles.locationTime}>{pkg.pickupWindow}</Text>
            </View>
          </View>
          
          <View style={styles.locationRow}>
            <View style={[styles.locationIcon, styles.deliveryIcon]}>
              <Text style={styles.iconText}>D</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>{pkg.deliveryAddress}</Text>
              <Text style={styles.locationTime}>{pkg.deliveryWindow}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.datesSection}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Created:</Text>
            <Text style={styles.dateValue}>{formatDate(match.createdAt)}</Text>
          </View>
          
          {match.responseTime && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Response:</Text>
              <Text style={styles.dateValue}>{formatDate(match.responseTime)}</Text>
            </View>
          )}
        </View>
        
        {match.carrierNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Your Notes:</Text>
            <Text style={styles.notesContent}>{match.carrierNotes}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Delivery Matches</Text>
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            New Matches {pendingMatches.length > 0 && `(${pendingMatches.length})`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            Active {activeMatches.length > 0 && `(${activeMatches.length})`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading your matches...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer}>
          {activeTab === 'pending' && (
            pendingMatches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No pending matches available at the moment.</Text>
                <Text style={styles.emptySubtext}>Check back soon for new delivery opportunities!</Text>
              </View>
            ) : (
              <View>
                {pendingMatches.map(match => renderPendingCard(match))}
              </View>
            )
          )}
          
          {activeTab === 'active' && (
            activeMatches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>You have no active deliveries.</Text>
                <Text style={styles.emptySubtext}>Accept a delivery from the New Matches tab to get started!</Text>
              </View>
            ) : (
              <View>
                {activeMatches.map(match => renderActiveCard(match))}
              </View>
            )
          )}
          
          {activeTab === 'history' && (
            historyMatches.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No delivery history yet.</Text>
              </View>
            ) : (
              <View>
                {historyMatches.map(match => renderHistoryCard(match))}
              </View>
            )
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 16,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
  },
  activeTabText: {
    color: '#007bff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6c757d',
  },
  scrollContainer: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
    textAlign: 'center',
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
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
  locations: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  locationRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  locationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  pickupIcon: {
    backgroundColor: '#cfe2ff',
  },
  deliveryIcon: {
    backgroundColor: '#f8d7da',
  },
  iconText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    fontSize: 14,
    marginBottom: 2,
  },
  locationTime: {
    fontSize: 12,
    color: '#6c757d',
  },
  packageAttributes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  attributeContainer: {
    marginRight: 12,
    marginBottom: 8,
  },
  attributeLabel: {
    color: '#6c757d',
    fontSize: 12,
    marginBottom: 2,
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  responseSection: {
    padding: 15,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 10,
    fontSize: 14,
    minHeight: 80,
    marginBottom: 15,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  declineButton: {
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  declineButtonText: {
    color: '#dc3545',
    fontWeight: '500',
  },
  acceptButton: {
    backgroundColor: '#28a745',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  pickupCodeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  pickupCode: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
  },
  pickupCodeLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 5,
  },
  pickupCodeValue: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: '#dc3545',
    fontWeight: '500',
  },
  datesSection: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dateItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  dateLabel: {
    width: 80,
    color: '#6c757d',
    fontSize: 14,
  },
  dateValue: {
    fontWeight: '500',
    fontSize: 14,
  },
  notesSection: {
    padding: 15,
  },
  notesLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 5,
  },
  notesContent: {
    fontSize: 14,
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 4,
  },
  historyCard: {
    opacity: 0.85,
  },
});

export default CarrierMatchingDashboard;