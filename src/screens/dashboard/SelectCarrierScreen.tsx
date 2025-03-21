import React, { useState, useEffect } from 'react';
import {
 StyleSheet,
 View,
 Text,
 FlatList,
 TouchableOpacity,
 Image,
 ActivityIndicator,
 Alert,
 ListRenderItemInfo
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Card, Chip, Button, Divider } from 'react-native-paper';


// Type definitions
type RootStackParamList = {
 CreatePackage: undefined;
 SelectCarrier: { packageData: PackageData };
 Track: undefined;
};


type SelectCarrierScreenRouteProp = RouteProp<RootStackParamList, 'SelectCarrier'>;


type SelectCarrierScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;


interface PackageData {
 name: string;
 weight: number;
 size: 'SMALL' | 'MEDIUM' | 'LARGE';
 requiresSignature: boolean;
 requiresRefrigeration: boolean;
 isFragile: boolean;
 pickupLocation: {
   latitude: number;
   longitude: number;
   address: string;
 };
 deliveryLocation: {
   latitude: number;
   longitude: number;
   address: string;
 };
 pickupTimeWindow: {
   start: Date;
   end: Date;
 };
 deliveryTimeWindow: {
   start: Date;
   end: Date;
 };
}


interface Carrier {
 id: string;
 name: string;
 vehicleType: 'CAR' | 'BICYCLE' | 'MOTORCYCLE' | 'AUTO_RICKSHAW' | 'VAN';
 rating: number;
 totalDeliveries: number;
 price: number;
 estimatedArrival: string;
 matchScore: number;
 profileImage: string;
 currentLocation: {
   latitude: number;
   longitude: number;
 };
}


type SortOption = 'match' | 'price' | 'time';


// Simulated data representing the response from our AI matching algorithm
const MOCK_CARRIER_MATCHES: Carrier[] = [
 {
   id: 'carrier-001',
   name: 'Michael Chen',
   vehicleType: 'CAR',
   rating: 4.8,
   totalDeliveries: 153,
   price: 15.99,
   estimatedArrival: '2:45 PM',
   matchScore: 0.94,
   profileImage: 'https://i.pravatar.cc/150?img=1',
   currentLocation: {
     latitude: 37.7699,
     longitude: -122.4149
   }
 },
 {
   id: 'carrier-002',
   name: 'Sarah Wilson',
   vehicleType: 'BICYCLE',
   rating: 4.9,
   totalDeliveries: 278,
   price: 12.50,
   estimatedArrival: '2:30 PM',
   matchScore: 0.87,
   profileImage: 'https://i.pravatar.cc/150?img=5',
   currentLocation: {
     latitude: 37.7749,
     longitude: -122.4194
   }
 },
 {
   id: 'carrier-003',
   name: 'David Lee',
   vehicleType: 'MOTORCYCLE',
   rating: 4.7,
   totalDeliveries: 104,
   price: 14.75,
   estimatedArrival: '2:35 PM',
   matchScore: 0.82,
   profileImage: 'https://i.pravatar.cc/150?img=8',
   currentLocation: {
     latitude: 37.7829,
     longitude: -122.4094
   }
 },
 {
   id: 'carrier-004',
   name: 'Priya Sharma',
   vehicleType: 'AUTO_RICKSHAW',
   rating: 4.6,
   totalDeliveries: 89,
   price: 13.25,
   estimatedArrival: '3:00 PM',
   matchScore: 0.79,
   profileImage: 'https://i.pravatar.cc/150?img=10',
   currentLocation: {
     latitude: 37.7649,
     longitude: -122.4229
   }
 },
 {
   id: 'carrier-005',
   name: 'James Thompson',
   vehicleType: 'VAN',
   rating: 4.5,
   totalDeliveries: 167,
   price: 17.50,
   estimatedArrival: '3:15 PM',
   matchScore: 0.75,
   profileImage: 'https://i.pravatar.cc/150?img=14',
   currentLocation: {
     latitude: 37.7849,
     longitude: -122.4294
   }
 }
];


const SelectCarrierScreen: React.FC = () => {
 const navigation = useNavigation<SelectCarrierScreenNavigationProp>();
 const route = useRoute<SelectCarrierScreenRouteProp>();
 const  packageData  = route.params?.packageData;


 useEffect(() => {
   if (!packageData) {
     // Handle missing data - navigate back or show error
     Alert.alert(
       "Error",
       "Package information is missing. Please try again.",
       [{ text: "Go Back", onPress: () => navigation.goBack() }]
     );
   }
 }, [packageData]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
 const [carriers, setCarriers] = useState<Carrier[]>([]);
 const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
 const [sortBy, setSortBy] = useState<SortOption>('match');
  useEffect(() => {
   // Simulate API call to get matches from our AI matching algorithm
   setTimeout(() => {
     setCarriers(MOCK_CARRIER_MATCHES);
     setIsLoading(false);
   }, 1500);
 }, []);
  // Function to sort carriers based on selected criteria
 useEffect(() => {
   let sortedCarriers = [...carriers];
  
   switch (sortBy) {
     case 'match':
       sortedCarriers.sort((a, b) => b.matchScore - a.matchScore);
       break;
     case 'price':
       sortedCarriers.sort((a, b) => a.price - b.price);
       break;
     case 'time':
       sortedCarriers.sort((a, b) => {
         const timeA = a.estimatedArrival.replace(/[^0-9:]/g, '');
         const timeB = b.estimatedArrival.replace(/[^0-9:]/g, '');
         return timeA.localeCompare(timeB);
       });
       break;
   }
  
   setCarriers(sortedCarriers);
 }, [sortBy]);
  // Handle carrier selection
 const handleSelectCarrier = (carrier: Carrier): void => {
   setSelectedCarrier(carrier);
 };
  // Book the selected carrier
 const handleBookNow = (): void => {
   if (!selectedCarrier) {
     Alert.alert('Selection Required', 'Please select a carrier first.');
     return;
   }
  
   // Simulate API call to book the carrier
   setIsLoading(true);
  
   setTimeout(() => {
     setIsLoading(false);
    
     Alert.alert(
       'Booking Successful',
       `Your package will be picked up by ${selectedCarrier.name}. You can track your delivery in the Track tab.`,
       [
         {
           text: 'OK',
           onPress: () => navigation.navigate('Track')
         }
       ]
     );
   }, 1500);
 };
  // Get the vehicle icon based on vehicle type
 const getVehicleIcon = (vehicleType: Carrier['vehicleType']): React.ComponentProps<typeof Ionicons>['name'] => {
   switch (vehicleType) {
     case 'CAR':
       return 'car-outline';
     case 'BICYCLE':
       return 'bicycle-outline';
     case 'MOTORCYCLE':
       return 'bicycle';
     case 'AUTO_RICKSHAW':
       return 'car';
     case 'VAN':
       return 'car-sport-outline';
     default:
       return 'car-outline';
   }
 };
  // Render a carrier item in the list
 const renderCarrierItem = ({ item }: ListRenderItemInfo<Carrier>): React.ReactElement => (
   <TouchableOpacity
     style={[
       styles.carrierItem,
       selectedCarrier?.id === item.id && styles.selectedCarrierItem
     ]}
     onPress={() => handleSelectCarrier(item)}
   >
     <View style={styles.carrierProfileContainer}>
       <Image
         source={{ uri: item.profileImage }}
         style={styles.carrierProfileImage}
       />
       <View style={styles.profileInfo}>
         <Text style={styles.carrierName}>{item.name}</Text>
         <View style={styles.ratingContainer}>
           <Ionicons name="star" size={16} color="#f59e0b" />
           <Text style={styles.ratingText}>{item.rating}</Text>
           <Text style={styles.totalDeliveriesText}>({item.totalDeliveries} deliveries)</Text>
         </View>
       </View>
     </View>
    
     <View style={styles.carrierInfoContainer}>
       <View style={styles.infoRow}>
         <View style={styles.infoItem}>
           <Ionicons name={getVehicleIcon(item.vehicleType)} size={16} color="#4f46e5" />
           <Text style={styles.infoText}>{item.vehicleType.replace('_', ' ')}</Text>
         </View>
        
         <View style={styles.infoItem}>
           <Ionicons name="time-outline" size={16} color="#4f46e5" />
           <Text style={styles.infoText}>{item.estimatedArrival}</Text>
         </View>
        
         <View style={styles.infoItem}>
           <Ionicons name="pricetag-outline" size={16} color="#4f46e5" />
           <Text style={styles.infoText}>${item.price.toFixed(2)}</Text>
         </View>
       </View>
      
       <View style={styles.matchScoreContainer}>
         <Text style={styles.matchScoreLabel}>Match Score</Text>
         <View style={styles.matchScoreBarContainer}>
           <View
             style={[
               styles.matchScoreBar,
               { width: `${item.matchScore * 100}%` }
             ]}
           />
         </View>
         <Text style={styles.matchScoreText}>{Math.round(item.matchScore * 100)}%</Text>
       </View>
     </View>
   </TouchableOpacity>
 );
  return (
   <SafeAreaView style={styles.container}>
     {isLoading ? (
       <View style={styles.loadingContainer}>
         <ActivityIndicator size="large" color="#4f46e5" />
         <Text style={styles.loadingText}>Finding the best carriers...</Text>
       </View>
     ) : (
       <>
         {/* Map showing pickup, delivery, and carriers */}
         <View style={styles.mapContainer}>
           <MapView
             style={styles.map}
             provider={PROVIDER_GOOGLE}
             initialRegion={{
               latitude: packageData?.pickupLocation?.latitude || 37.7749, // Fallback coordinates
   longitude: packageData?.pickupLocation?.longitude || -122.4194,
   latitudeDelta: 0.0922,
   longitudeDelta: 0.0421,
             }}
           >
             {/* Pickup location marker */}
             <Marker
               coordinate={{
                 latitude: packageData.pickupLocation.latitude,
                 longitude: packageData.pickupLocation.longitude,
               }}
               title="Pickup Location"
             >
               <Ionicons name="locate" size={24} color="#4f46e5" />
             </Marker>
            
             {/* Delivery location marker */}
             <Marker
               coordinate={{
                 latitude: packageData.deliveryLocation.latitude,
                 longitude: packageData.deliveryLocation.longitude,
               }}
               title="Delivery Location"
             >
               <Ionicons name="flag" size={24} color="#ef4444" />
             </Marker>
            
             {/* Line between pickup and delivery */}
             <Polyline
               coordinates={[
                 {
                   latitude: packageData.pickupLocation.latitude,
                   longitude: packageData.pickupLocation.longitude,
                 },
                 {
                   latitude: packageData.deliveryLocation.latitude,
                   longitude: packageData.deliveryLocation.longitude,
                 },
               ]}
               strokeColor="#4f46e5"
               strokeWidth={2}
               lineDashPattern={[5, 5]}
             />
            
             {/* Carrier markers (only show selected carrier or all if none selected) */}
             {(selectedCarrier ? [selectedCarrier] : carriers).map((carrier) => (
               <Marker
                 key={carrier.id}
                 coordinate={carrier.currentLocation}
                 title={carrier.name}
               >
                 <View style={styles.carrierMarker}>
                   <Ionicons name={getVehicleIcon(carrier.vehicleType)} size={16} color="white" />
                 </View>
               </Marker>
             ))}
           </MapView>
         </View>
        
         {/* Sort options */}
         <View style={styles.sortContainer}>
           <Text style={styles.sortLabel}>Sort by:</Text>
          
           <TouchableOpacity
             style={[
               styles.sortOption,
               sortBy === 'match' && styles.activeSortOption,
             ]}
             onPress={() => setSortBy('match')}
           >
             <Text
               style={[
                 styles.sortText,
                 sortBy === 'match' && styles.activeSortText,
               ]}
             >
               Best Match
             </Text>
           </TouchableOpacity>
          
           <TouchableOpacity
             style={[
               styles.sortOption,
               sortBy === 'price' && styles.activeSortOption,
             ]}
             onPress={() => setSortBy('price')}
           >
             <Text
               style={[
                 styles.sortText,
                 sortBy === 'price' && styles.activeSortText,
               ]}
             >
               Lowest Price
             </Text>
           </TouchableOpacity>
          
           <TouchableOpacity
             style={[
               styles.sortOption,
               sortBy === 'time' && styles.activeSortOption,
             ]}
             onPress={() => setSortBy('time')}
           >
             <Text
               style={[
                 styles.sortText,
                 sortBy === 'time' && styles.activeSortText,
               ]}
             >
               Fastest Pickup
             </Text>
           </TouchableOpacity>
         </View>
        
         {/* Carriers list */}
         <FlatList
           data={carriers}
           renderItem={renderCarrierItem}
           keyExtractor={(item) => item.id}
           contentContainerStyle={styles.carriersList}
           showsVerticalScrollIndicator={false}
         />
        
         {/* Book now button */}
         <View style={styles.bottomContainer}>
           <TouchableOpacity
             style={[
               styles.bookButton,
               !selectedCarrier && styles.disabledBookButton
             ]}
             onPress={handleBookNow}
             disabled={!selectedCarrier}
           >
             <Text style={styles.bookButtonText}>
               {selectedCarrier
                 ? `Book ${selectedCarrier.name} for $${selectedCarrier.price.toFixed(2)}`
                 : 'Select a carrier to book'}
             </Text>
           </TouchableOpacity>
         </View>
       </>
     )}
   </SafeAreaView>
 );
};


const styles = StyleSheet.create({
 container: {
   flex: 1,
   backgroundColor: '#f9fafb',
 },
 loadingContainer: {
   flex: 1,
   justifyContent: 'center',
   alignItems: 'center',
 },
 loadingText: {
   marginTop: 16,
   fontSize: 16,
   color: '#6b7280',
 },
 mapContainer: {
   height: 200,
 },
 map: {
   ...StyleSheet.absoluteFillObject,
 },
 carrierMarker: {
   backgroundColor: '#4f46e5',
   padding: 8,
   borderRadius: 20,
   borderWidth: 2,
   borderColor: 'white',
 },
 sortContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   paddingHorizontal: 16,
   paddingVertical: 12,
   backgroundColor: 'white',
   borderBottomWidth: 1,
   borderBottomColor: '#e5e7eb',
 },
 sortLabel: {
   fontSize: 14,
   fontWeight: '500',
   color: '#4b5563',
   marginRight: 12,
 },
 sortOption: {
   paddingHorizontal: 10,
   paddingVertical: 6,
   borderRadius: 16,
   marginRight: 8,
 },
 activeSortOption: {
   backgroundColor: '#ede9fe',
 },
 sortText: {
   fontSize: 12,
   color: '#6b7280',
 },
 activeSortText: {
   color: '#4f46e5',
   fontWeight: '500',
 },
 carriersList: {
   padding: 16,
 },
 carrierItem: {
   backgroundColor: 'white',
   borderRadius: 12,
   padding: 16,
   marginBottom: 16,
   shadowColor: '#000',
   shadowOffset: { width: 0, height: 1 },
   shadowOpacity: 0.1,
   shadowRadius: 2,
   elevation: 2,
 },
 selectedCarrierItem: {
   borderWidth: 2,
   borderColor: '#4f46e5',
 },
 carrierProfileContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   marginBottom: 12,
 },
 carrierProfileImage: {
   width: 50,
   height: 50,
   borderRadius: 25,
 },
 profileInfo: {
   marginLeft: 12,
 },
 carrierName: {
   fontSize: 16,
   fontWeight: '600',
   color: '#111827',
 },
 ratingContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   marginTop: 4,
 },
 ratingText: {
   fontSize: 14,
   fontWeight: '500',
   color: '#4b5563',
   marginLeft: 4,
 },
 totalDeliveriesText: {
   fontSize: 12,
   color: '#6b7280',
   marginLeft: 4,
 },
 carrierInfoContainer: {
   marginTop: 8,
 },
 infoRow: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   marginBottom: 12,
 },
 infoItem: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 infoText: {
   fontSize: 14,
   color: '#4b5563',
   marginLeft: 4,
 },
 matchScoreContainer: {
   flexDirection: 'row',
   alignItems: 'center',
 },
 matchScoreLabel: {
   fontSize: 14,
   color: '#6b7280',
   marginRight: 8,
   width: 90,
 },
 matchScoreBarContainer: {
   flex: 1,
   height: 8,
   backgroundColor: '#e5e7eb',
   borderRadius: 4,
   overflow: 'hidden',
 },
 matchScoreBar: {
   height: '100%',
   backgroundColor: '#4f46e5',
   borderRadius: 4,
 },
 matchScoreText: {
   fontSize: 14,
   fontWeight: '600',
   color: '#4f46e5',
   marginLeft: 8,
   width: 40,
   textAlign: 'right',
 },
 bottomContainer: {
   padding: 16,
   backgroundColor: 'white',
   borderTopWidth: 1,
   borderTopColor: '#e5e7eb',
 },
 bookButton: {
   backgroundColor: '#4f46e5',
   paddingVertical: 14,
   borderRadius: 8,
   alignItems: 'center',
 },
 disabledBookButton: {
   backgroundColor: '#9ca3af',
 },
 bookButtonText: {
   color: 'white',
   fontSize: 16,
   fontWeight: '500',
 },
});


export default SelectCarrierScreen;



